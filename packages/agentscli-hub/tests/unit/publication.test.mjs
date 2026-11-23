import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  bumpVersion,
  selectVersion,
  parseRefs,
  parseStatus,
  prepareRelease,
  publishRelease,
  parseArgs,
  compareVersions,
} from '../../assets/templates/skills/agentscli-hub-publish/scripts/release.mjs';
import { parseManifest } from '../../assets/templates/skills/agentscli-hub-publish/scripts/support.mjs';
import { memoryFs } from './memory-fs.mjs';

const A = 'a'.repeat(40),
  B = 'b'.repeat(40),
  C = 'c'.repeat(40);
const root = path.resolve('unit-publication');
function fixture({ initial = false } = {}) {
  const fs = memoryFs({
    [path.join(root, 'agentscli-hub.yml')]:
      'schemaVersion: 1\nversion: 1.0.0\n',
  });
  const state = {
    head: initial ? null : A,
    branch: initial ? null : A,
    tags: new Map(initial ? [] : [['v1.0.0', A]]),
    localTags: new Map(initial ? [] : [['v1.0.0', A]]),
    commits: new Map([[A, 'schemaVersion: 1\nversion: 1.0.0\n']]),
    status: initial
      ? '?? conventions/rules.tpl.md\0?? unrelated.txt\0'
      : ' M conventions/rules.tpl.md\0M  unrelated.txt\0',
    committedDiff: '',
    calls: [],
    failPushTag: false,
    lostResponse: false,
  };
  const git = (args) => {
    state.calls.push(args);
    if (args[0] === 'symbolic-ref') return 'main';
    if (args[0] === 'config') return null;
    if (args[0] === 'remote')
      return args[1] === 'get-url' ? 'git@example.test:team/hub.git' : 'origin';
    if (args[0] === 'ls-remote')
      return [
        state.branch && `${state.branch}\trefs/heads/main`,
        ...[...state.tags].map(
          ([name, commit]) => `${commit}\trefs/tags/${name}`,
        ),
      ]
        .filter(Boolean)
        .join('\n');
    if (args[0] === 'rev-parse') {
      if (args.at(-1) === 'HEAD') return state.head;
      const name = args.at(-1).match(/^refs\/tags\/(.+)\^\{commit\}$/)?.[1];
      return state.localTags.get(name) ?? null;
    }
    if (args[0] === 'show')
      return state.commits.get(args[1].split(':')[0]) ?? null;
    if (args[0] === 'status') return state.status;
    if (args[0] === 'diff') return state.committedDiff;
    if (args[0] === 'merge-base')
      return args[2] === A && [B, C].includes(args[3]) ? '' : null;
    if (args[0] === 'add') return '';
    if (args[0] === 'commit') {
      state.head = B;
      state.commits.set(
        B,
        fs.readFileSync(path.join(root, 'agentscli-hub.yml'), 'utf8'),
      );
      state.status = 'M  unrelated.txt\0';
      return B;
    }
    if (args[0] === 'tag') {
      state.localTags.set(args[1], args[2]);
      return '';
    }
    if (args[0] === 'push') {
      if (args[2].startsWith('refs/tags/')) {
        if (state.failPushTag) {
          const error = new Error('Access denied');
          error.code = 'git';
          throw error;
        }
        const name = args[2].split(':')[0].slice(10);
        state.tags.set(name, state.localTags.get(name));
        if (state.lostResponse) {
          const error = new Error('Ambiguous response');
          error.code = 'git';
          throw error;
        }
      } else state.branch = args[2].split(':')[0];
      return '';
    }
    throw new Error(`Unexpected injected Git operation: ${args[0]}`);
  };
  const inspect = () => ({
    manifest: parseManifest(
      fs.readFileSync(path.join(root, 'agentscli-hub.yml'), 'utf8'),
    ),
  });
  return { fs, git, inspect, state };
}
test('agent impact derives semantic content versions independently of CLI versions', () => {
  assert.equal(selectVersion(undefined, 'major'), '1.0.0');
  assert.equal(bumpVersion('1.2.3', 'patch'), '1.2.4');
  assert.equal(bumpVersion('1.2.3', 'minor'), '1.3.0');
  assert.equal(bumpVersion('1.2.3', 'major'), '2.0.0');
  assert.equal(selectVersion('1.2.3', 'patch', '3.0.0'), '3.0.0');
  assert.throws(() => selectVersion('1.2.3', 'minor', '1.0.0'), {
    code: 'version',
  });
  assert.throws(() => bumpVersion('1.0.0', 'guess'), { code: 'version' });
  assert.equal(
    selectVersion('1.0.0', 'minor', '1.1.0-beta.1+build'),
    '1.1.0-beta.1+build',
  );
  assert.ok(compareVersions('1.1.0-beta.2', '1.1.0-beta.10') < 0);
  assert.ok(compareVersions('1.1.0-beta.2', '1.1.0') < 0);
  assert.equal(bumpVersion('1.0.0-rc.1+build', 'patch'), '1.0.1');
  assert.equal(compareVersions('1.0.0+build-a', '1.0.0+build-b'), 0);
  assert.ok(
    compareVersions(
      '1.0.0-999999999999999999999999',
      '1.0.0-1000000000000000000000000',
    ) < 0,
  );
  assert.throws(() => bumpVersion('9007199254740991.0.0', 'major'), {
    code: 'version',
  });
  assert.throws(() => selectVersion('1.0.0', 'patch', '9007199254740992.0.0'), {
    code: 'version',
  });
});
test('a partial manifest write preserves baseline bytes and retries the same derived candidate', () => {
  const adapters = fixture();
  const write = adapters.fs.writeFileSync;
  let failed = false;
  adapters.fs.writeFileSync = (file, value, options) => {
    if (!failed && path.basename(file).startsWith('.agentscli-hub-')) {
      failed = true;
      write(file, Buffer.from(value).subarray(0, 3), options);
      throw new Error('Injected partial disk write');
    }
    return write(file, value, options);
  };
  const first = publishRelease({ root, bump: 'minor' }, adapters);
  assert.equal(first.ok, false);
  assert.equal(
    adapters.fs.readFileSync(path.join(root, 'agentscli-hub.yml'), 'utf8'),
    'schemaVersion: 1\nversion: 1.0.0\n',
  );
  const retry = publishRelease({ root, bump: 'minor' }, adapters);
  assert.equal(retry.ok, true);
  assert.equal(retry.candidate.version, '1.1.0');
});
test('native ref/status parsing preserves exact commits and rename cleanup paths', () => {
  assert.equal(
    parseRefs(`${A}\trefs/tags/v1.0.0\n${B}\trefs/tags/v1.0.0^{}`).get(
      'refs/tags/v1.0.0',
    ),
    B,
  );
  assert.deepEqual(
    parseStatus('R  skills/new/SKILL.md\0skills/old/SKILL.md\0').map(
      (item) => item.path,
    ),
    ['skills/new/SKILL.md', 'skills/old/SKILL.md'],
  );
  assert.throws(() => parseStatus('?? ../outside\0'), { code: 'unsafe-path' });
  assert.throws(() => parseRefs('credential-like malformed output'), {
    code: 'refs',
  });
});
test('first publication is 1.0.0 and preview never changes files/index/refs', () => {
  const adapters = fixture({ initial: true });
  const result = publishRelease(
    { root, bump: 'major', preview: true },
    adapters,
  );
  assert.equal(result.ok, true);
  assert.equal(result.candidate.version, '1.0.0');
  assert.equal(result.candidate.tag, 'v1.0.0');
  assert.deepEqual(adapters.fs.mutations, []);
  assert.equal(
    adapters.state.calls.some((args) =>
      ['add', 'commit', 'tag', 'push', 'fetch'].includes(args[0]),
    ),
    false,
  );
});
test('scoped publication preserves unrelated staging and verifies branch plus immutable tag', () => {
  const adapters = fixture();
  const result = publishRelease({ root, bump: 'minor' }, adapters);
  assert.equal(result.ok, true);
  assert.equal(result.candidate.version, '1.1.0');
  assert.equal(result.candidate.commit, B);
  assert.equal(adapters.state.tags.get('v1.1.0'), B);
  assert.equal(adapters.state.branch, B);
  const commit = adapters.state.calls.find((args) => args[0] === 'commit');
  assert.ok(commit.includes('--only'));
  assert.equal(commit.includes('unrelated.txt'), false);
  assert.equal(
    adapters.state.calls.some((args) => args.includes('--force')),
    false,
  );
  assert.equal(
    adapters.state.calls.some((args) => args[0] === 'reset'),
    false,
  );
  assert.equal(adapters.state.status, 'M  unrelated.txt\0');
});
test('no changed published hub content does not create a release', () => {
  const adapters = fixture();
  adapters.state.status = 'M  unrelated.txt\0';
  const result = publishRelease({ root, bump: 'minor' }, adapters);
  assert.equal(result.ok, true);
  assert.equal(result.noChanges, true);
  assert.equal(result.candidate.version, '1.0.0');
  assert.equal(
    adapters.state.calls.some((args) =>
      ['commit', 'tag', 'push'].includes(args[0]),
    ),
    false,
  );
});
test('partial tag delivery retries exact prepared version/commit without another commit or bump', () => {
  const adapters = fixture();
  adapters.state.failPushTag = true;
  const first = publishRelease({ root, bump: 'minor' }, adapters);
  assert.equal(first.ok, false);
  assert.equal(first.candidate.version, '1.1.0');
  assert.equal(first.candidate.commit, B);
  assert.deepEqual(first.pending, ['push/verify-tag']);
  const priorCommits = adapters.state.calls.filter(
    (args) => args[0] === 'commit',
  ).length;
  adapters.state.failPushTag = false;
  const second = publishRelease({ root, bump: 'minor' }, adapters);
  assert.equal(second.ok, true);
  assert.equal(second.candidate.version, '1.1.0');
  assert.equal(second.candidate.commit, B);
  assert.equal(
    adapters.state.calls.filter((args) => args[0] === 'commit').length,
    priorCommits,
  );
});
test('lost successful push response is resolved from matching remote refs', () => {
  const adapters = fixture();
  adapters.state.lostResponse = true;
  const result = publishRelease({ root, bump: 'patch' }, adapters);
  assert.equal(result.ok, true);
  assert.equal(result.candidate.version, '1.0.1');
  assert.ok(result.completed.includes('verify'));
});
test('tag-only partial publication reuses current candidate and completes only branch delivery', () => {
  const adapters = fixture();
  adapters.state.head = B;
  adapters.state.status = '';
  adapters.state.localTags.set('v1.1.0', B);
  adapters.state.tags.set('v1.1.0', B);
  adapters.fs.addFile(
    path.join(root, 'agentscli-hub.yml'),
    'schemaVersion: 1\nversion: 1.1.0\n',
  );
  adapters.state.commits.set(B, 'schemaVersion: 1\nversion: 1.1.0\n');
  const result = publishRelease({ root, bump: 'minor' }, adapters);
  assert.equal(result.ok, true);
  assert.equal(result.candidate.version, '1.1.0');
  assert.equal(
    adapters.state.calls.some((args) => args[0] === 'commit'),
    false,
  );
  assert.equal(
    adapters.state.calls.filter((args) => args[0] === 'push').length,
    1,
  );
});
test('preflight blocks partial selected staging, conflicts, malformed tag manifests, and missing destination', () => {
  const staged = fixture();
  staged.state.status = 'MM conventions/rules.tpl.md\0';
  assert.throws(() => prepareRelease({ root, bump: 'patch' }, staged), {
    code: 'staging',
  });
  const conflict = fixture();
  conflict.state.tags.set('v1.1.0', C);
  conflict.state.commits.set(C, 'schemaVersion: 1\nversion: 1.1.0\n');
  assert.throws(() => prepareRelease({ root, bump: 'minor' }, conflict), {
    code: 'tag-conflict',
  });
  const manifest = fixture();
  manifest.state.commits.set(A, 'schemaVersion: 1\nversion: 2.0.0\n');
  assert.throws(() => prepareRelease({ root, bump: 'patch' }, manifest), {
    code: 'manifest-tag',
  });
  const missing = fixture();
  const git = (args, options) =>
    args[0] === 'remote' && args.length === 1 ? '' : missing.git(args, options);
  assert.throws(
    () => prepareRelease({ root, bump: 'minor' }, { ...missing, git }),
    { code: 'destination' },
  );
  assert.deepEqual(staged.fs.mutations, []);
});
test('private release helper parser keeps publication out of public CLI and requires assessed impact', () => {
  assert.deepEqual(
    parseArgs([
      'plan',
      '--repo-root',
      'hub',
      '--bump',
      'minor',
      '--path',
      'skills/review-code',
    ]),
    { mode: 'plan', root: 'hub', bump: 'minor', paths: ['skills/review-code'] },
  );
  for (const args of [
    ['publish', '--repo-root', 'hub'],
    ['publish', '--repo-root', 'hub', '--bump', 'guess'],
    ['plan', '--repo-root', 'hub', '--bump', 'patch', '--force', 'true'],
  ])
    assert.throws(() => parseArgs(args), { code: 'arguments' });
});
