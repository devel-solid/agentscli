import test from 'node:test';
import assert from 'node:assert/strict';
import { join, resolve } from 'node:path';
import {
  createGitCapture,
  parseTree,
} from '../../assets/templates/skills/agentscli-manage-hub-imports/scripts/git.mjs';
import { snapshotFromCapture } from '../../assets/templates/skills/agentscli-manage-hub-imports/scripts/contracts.mjs';
import { parseYaml } from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/manifest.mjs';
const commit = 'b'.repeat(40);
const input = {
  repository: 'git@example.org:team/hub.git',
  tag: 'v1.0.0',
  conventions: [],
  skills: [],
};
function harness({
  fail = false,
  entries = [
    {
      path: 'agentscli-hub.yml',
      content: 'schemaVersion: 1\nversion: 1.0.0\n',
      textAttribute: 'unset',
    },
  ],
} = {}) {
  const blobs = entries.map((entry, index) => ({
    gitMode: '100644',
    type: 'blob',
    ...entry,
    object: String(index + 1).padStart(40, '0'),
  }));
  const parent = resolve('unit-scratch');
  const scratch = join(parent, 'agentscli-hub-unique');
  const calls = [];
  const cleanup = [];
  const filesystem = {
    realpathSync: (p) => p,
    mkdtempSync: () => scratch,
    mkdirSync: () => {},
    writeFileSync: () => {},
    lstatSync: () => ({ isDirectory: () => true, isSymbolicLink: () => false }),
    rmSync: (...args) => cleanup.push(args),
  };
  const run = (executable, args, options) => {
    calls.push({ executable, args, options });
    const command = args.find((value) =>
      [
        'init',
        'fetch',
        'rev-parse',
        'ls-tree',
        'read-tree',
        'check-attr',
        'cat-file',
      ].includes(value),
    );
    if (fail && command === 'fetch')
      return {
        status: 1,
        stderr: Buffer.from('secret token and remote error'),
      };
    let stdout = '';
    if (command === 'rev-parse') stdout = commit + '\n';
    if (command === 'ls-tree')
      stdout = blobs
        .map(
          (entry) =>
            `${entry.gitMode} ${entry.type} ${entry.object}\t${entry.path}\0`,
        )
        .join('');
    if (command === 'check-attr')
      stdout = Buffer.from(options.input)
        .toString()
        .split('\0')
        .filter(Boolean)
        .map(
          (path) =>
            `${path}\0text\0${blobs.find((entry) => entry.path === path)?.textAttribute ?? 'unspecified'}\0`,
        )
        .join('');
    if (command === 'cat-file')
      stdout = blobs.find((entry) => entry.object === args.at(-1)).content;
    return { status: 0, stdout: Buffer.from(stdout) };
  };
  return {
    capture: createGitCapture({
      run,
      filesystem,
      temporaryRoot: parent,
      environment: {
        GIT_DIR: 'danger',
        GIT_CONFIG_PARAMETERS: 'danger',
        GIT_SSH_COMMAND: 'native-auth',
      },
    }),
    calls,
    cleanup,
    scratch,
  };
}
test('native Git acquisition uses argument arrays, committed attributes and no checkout or imported execution', () => {
  const h = harness();
  const captured = h.capture.capture(input);
  assert.equal(captured.commit, commit);
  assert.equal(captured.entries[0].textAttribute, 'unset');
  assert.equal(h.calls.filter((c) => c.args.includes('fetch')).length, 1);
  const fetch = h.calls.find((c) => c.args.includes('fetch'));
  assert.deepEqual(fetch.args.slice(-3), [
    '--',
    input.repository,
    'refs/tags/v1.0.0',
  ]);
  for (const call of h.calls) {
    assert.equal(call.executable, 'git');
    assert.equal(call.options.windowsHide, true);
    assert.equal(call.options.env.GIT_ATTR_NOSYSTEM, '1');
    assert.equal(call.options.env.GIT_DIR, undefined);
    assert.equal(call.options.env.GIT_CONFIG_PARAMETERS, undefined);
    assert.equal(call.options.env.GIT_SSH_COMMAND, 'native-auth');
    assert.ok(call.args.includes('protocol.ext.allow=never'));
    assert.ok(!call.args.includes('checkout'));
  }
  assert.equal(h.cleanup.length, 1);
  assert.equal(h.cleanup[0][0], h.scratch);
});
test('Git failures hide stderr and clean only verified scratch storage', () => {
  const h = harness({ fail: true });
  assert.throws(
    () => h.capture.capture(input),
    (error) => !error.message.includes('secret') && error.exitCode === 3,
  );
  assert.equal(h.cleanup.length, 1);
});
test('tree decoding distinguishes invalid UTF-8 from valid replacement characters', () => {
  const header = Buffer.from(`100644 blob ${'c'.repeat(40)}\t`);
  assert.equal(
    parseTree(Buffer.concat([header, Buffer.from([0xff, 0])]))[0].invalidPath,
    true,
  );
  assert.equal(
    parseTree(Buffer.concat([header, Buffer.from('\ufffd\0')]))[0].invalidPath,
    false,
  );
  assert.throws(() => parseTree(Buffer.from('unterminated')));
});

test('capture reads only selected physical shared paths and evaluates attributes before mapping', () => {
  const selected = {
    ...input,
    conventions: ['testing/unit'],
    skills: ['review'],
  };
  const raw = Buffer.from('opaque\r\n');
  const entries = [
    {
      path: 'agentscli-hub.yml',
      content: 'schemaVersion: 1\nversion: 1.0.0\n',
    },
    { path: 'shared/conventions/testing/unit.tpl.md', content: 'template\r\n' },
    { path: 'shared/skills/review/SKILL.md', content: 'entry\r\n' },
    { path: 'shared/skills/review/agentscli-skill.yml', content: '{}\n' },
    {
      path: 'shared/skills/review/payload.dat',
      content: raw,
      gitMode: '100755',
      textAttribute: 'unset',
    },
    { path: 'shared/skills/unselected/SKILL.md', content: 'unselected' },
    { path: '.agents/skills/internal/SKILL.md', content: 'internal' },
    { path: 'skills/review/SKILL.md', content: 'unrelated' },
  ];
  const h = harness({ entries });
  const capture = h.capture.capture(selected);
  assert.deepEqual(
    capture.entries.map((entry) => entry.path),
    entries.slice(0, 5).map((entry) => entry.path),
  );
  const attributes = h.calls.find((call) => call.args.includes('check-attr'));
  assert.deepEqual(
    Buffer.from(attributes.options.input)
      .toString()
      .split('\0')
      .filter(Boolean),
    capture.entries.map((entry) => entry.path),
  );
  const snapshot = snapshotFromCapture(selected, capture, parseYaml);
  assert.deepEqual(
    Buffer.from(snapshot.files['skills/review/payload.dat']),
    raw,
  );
  assert.equal(
    snapshot.lock.files['skills/review/payload.dat'].representation,
    'bytes',
  );
  assert.equal(
    snapshot.lock.files['skills/review/payload.dat'].gitMode,
    '100755',
  );
  assert.equal(
    Buffer.from(snapshot.files['conventions/testing/unit.tpl.md']).toString(),
    'template\n',
  );
  assert.ok(
    Object.keys(snapshot.files).every((path) => !path.startsWith('shared/')),
  );
});

test('selected nonregular Git entries fail before mapped state and missing sources are not looked up elsewhere', () => {
  for (const entry of [
    { path: 'shared/skills/review', type: 'commit', gitMode: '160000' },
    { path: 'shared/skills/review/SKILL.md', gitMode: '120000' },
  ]) {
    const h = harness({
      entries: [
        {
          path: 'agentscli-hub.yml',
          content: 'schemaVersion: 1\nversion: 1.0.0\n',
        },
        entry,
      ],
    });
    const selected = { ...input, skills: ['review'] };
    assert.throws(
      () =>
        snapshotFromCapture(selected, h.capture.capture(selected), parseYaml),
      { code: 'GIT_ENTRY' },
    );
    assert.ok(
      !h.calls.some(
        (call) =>
          call.args.includes('cat-file') &&
          call.args.at(-1) === '2'.padStart(40, '0'),
      ),
    );
  }
  const h = harness({
    entries: [
      {
        path: 'agentscli-hub.yml',
        content: 'schemaVersion: 1\nversion: 1.0.0\n',
      },
      { path: 'conventions/testing.tpl.md', content: 'outside current roots' },
    ],
  });
  const selected = { ...input, conventions: ['testing'] };
  const capture = h.capture.capture(selected);
  assert.deepEqual(
    capture.entries.map((entry) => entry.path),
    ['agentscli-hub.yml'],
  );
  assert.throws(() => snapshotFromCapture(selected, capture, parseYaml), {
    code: 'SOURCE_MISSING',
  });
});
