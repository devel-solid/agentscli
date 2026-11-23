import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join, resolve } from 'node:path';
import * as engine from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/index.mjs';
import {
  applyReviewed,
  checkLocal,
  planDetach,
  planRemote,
  runCli,
} from '../../assets/templates/skills/agentscli-manage-hub-imports/scripts/hub-imports.mjs';
const bytes = (value) => Buffer.from(value);
const commit = 'a'.repeat(40);
const secondCommit = 'b'.repeat(40);
const endpoint = 'git@example.org:team/hub.git';
const skill =
  '---\nname: review\ndescription: Review requested changes.\n---\n\n# Review\n\nReview the changed files.\n';
const convention =
  '---\ntrigger: Read before changing tests.\n---\n\n# Testing\n\nUse deterministic unit tests.\n';
function memory(files = {}) {
  const root = resolve('hub-import-unit-project'),
    nodes = new Map(),
    writes = [];
  function directory(path) {
    const parent = dirname(path);
    if (parent !== path) directory(parent);
    if (!nodes.has(path))
      nodes.set(path, { kind: 'directory', nlink: 1, mode: 0o755 });
  }
  directory(root);
  function put(path, content, extra = {}) {
    const absolute = join(root, path);
    directory(dirname(absolute));
    nodes.set(absolute, {
      kind: 'file',
      nlink: 1,
      mode: 0o644,
      data: bytes(content),
      ...extra,
    });
  }
  for (const [path, content] of Object.entries({
    '.agentscli/config.yml': 'language: en\n',
    '.agentscli/templates/AGENTS.tpl.md':
      '# Project\n\n<!-- agentscli:conventions -->\n',
    ...files,
  }))
    put(path, content);
  const io = {
    supportsMode: true,
    info: (path) => {
      const n = nodes.get(path);
      return n && { kind: n.kind, nlink: n.nlink, mode: n.mode };
    },
    names: (path) =>
      [...nodes.keys()]
        .filter((p) => p !== path && dirname(p) === path)
        .map((p) => p.slice(path.length + 1)),
    read: (path) => {
      assert.equal(nodes.get(path)?.kind, 'file', path);
      return nodes.get(path).data.slice();
    },
    mkdir: (path) => {
      assert.equal(nodes.has(path), false);
      writes.push(['mkdir', path]);
      nodes.set(path, { kind: 'directory', nlink: 1, mode: 0o755 });
    },
    writeExclusive: (path, content) => {
      assert.equal(nodes.has(path), false);
      writes.push(['write', path]);
      nodes.set(path, {
        kind: 'file',
        nlink: 1,
        mode: 0o644,
        data: content.slice(),
      });
    },
    rename: (from, to) => {
      writes.push(['rename', to]);
      nodes.set(to, nodes.get(from));
      nodes.delete(from);
    },
    unlink: (path) => {
      writes.push(['unlink', path]);
      nodes.delete(path);
    },
    rmdir: (path) => {
      assert.equal(io.names(path).length, 0, path);
      writes.push(['rmdir', path]);
      nodes.delete(path);
    },
    chmod: (path, mode) => {
      writes.push(['chmod', path]);
      nodes.get(path).mode = mode;
    },
  };
  return {
    root,
    io,
    nodes,
    writes,
    put,
    text: (path) => Buffer.from(io.read(join(root, path))).toString('utf8'),
  };
}
function gitFake({ version = '1.0.0', extra = [], fail = false } = {}) {
  const calls = [];
  return {
    calls,
    capture(input) {
      calls.push(input);
      if (fail) throw new Error('network');
      const entries = [
        {
          path: 'agentscli-hub.yml',
          content: bytes(`schemaVersion: 1\nversion: ${version}\n`),
        },
        { path: 'conventions/testing.tpl.md', content: bytes(convention) },
        { path: 'skills/review/SKILL.md', content: bytes(skill) },
        {
          path: 'skills/review/scripts/check.mjs',
          content: bytes('export const check = true;\r\n'),
          gitMode: '100755',
        },
        ...extra,
      ];
      return {
        commit: input.commit ?? commit,
        entries: [
          ...new Map(
            entries.map((entry) => [
              entry.path,
              { type: 'blob', gitMode: '100644', ...entry },
            ]),
          ).values(),
        ],
      };
    },
  };
}
const intent = {
  repository: endpoint,
  tag: 'v1.0.0',
  conventions: ['testing'],
  skills: ['review'],
};
const options = (fs, git, engineOverride = engine) => ({
  repoRoot: fs.root,
  io: fs.io,
  engine: engineOverride,
  git,
});

test('remote plan is project-read-only and apply reacquires the exact resolved commit', async () => {
  const fs = memory(),
    git = gitFake(),
    ctx = options(fs, git);
  const review = await planRemote(intent, ctx);
  assert.equal(fs.writes.length, 0);
  assert.equal(review.commit, commit);
  assert.equal(git.calls[0].tag, 'v1.0.0');
  const applied = await applyReviewed(review, ctx);
  assert.equal(applied.exitCode, 0, JSON.stringify(applied));
  assert.equal(git.calls[1].commit, commit);
  assert.equal(git.calls[1].tag, undefined);
  assert.match(fs.text('.agentscli/config.yml'), new RegExp(commit));
  assert.equal(
    fs.text('.agents/skills/review/scripts/check.mjs'),
    'export const check = true;\n',
  );
  assert.equal(
    fs.io.info(join(fs.root, '.agents/skills/review/scripts/check.mjs')).mode,
    0o755,
  );
  assert.ok(applied.result.changes.every((c) => c.status === 'completed'));
  const networkCalls = git.calls.length,
    writes = fs.writes.length;
  const checked = await checkLocal(ctx);
  assert.equal(checked.ok, true);
  assert.deepEqual(checked.changes, []);
  assert.equal(git.calls.length, networkCalls);
  assert.equal(fs.writes.length, writes);
});

test('changed local preconditions block before acquisition or mutation', async () => {
  const fs = memory(),
    git = gitFake(),
    ctx = options(fs, git),
    review = await planRemote(intent, ctx);
  fs.put(
    '.agentscli/templates/AGENTS.tpl.md',
    '# Changed\n\n<!-- agentscli:conventions -->\n',
  );
  await assert.rejects(applyReviewed(review, ctx), { code: 'PRECONDITION' });
  assert.equal(git.calls.length, 1);
  assert.equal(fs.writes.length, 0);
});

test('an unrelated same-byte skill cannot be adopted and missing selected dependencies fail preflight', async () => {
  const fs = memory({ '.agents/skills/review/SKILL.md': skill }),
    git = gitFake();
  await assert.rejects(planRemote(intent, options(fs, git)), {
    code: 'SKILL_COLLISION',
  });
  assert.equal(fs.writes.length, 0);
  const other = memory(),
    missing = gitFake({
      extra: [
        {
          path: 'skills/review/SKILL.md',
          content: bytes(
            skill.replace(
              'description:',
              'metadata:\n  requires: requires.yml\ndescription:',
            ),
          ),
        },
        {
          path: 'skills/review/requires.yml',
          content: bytes(
            'conventions: []\nskills:\n  - id: absent\n    source: hub\n',
          ),
        },
      ],
    });
  await assert.rejects(planRemote(intent, options(other, missing)), {
    code: 'DEPENDENCY_MISSING',
  });
  assert.equal(other.writes.length, 0);
});

test('updates replace installed drift, remove extras, and preserve unrelated authored files', async () => {
  const fs = memory(),
    git = gitFake(),
    ctx = options(fs, git);
  assert.equal(
    (await applyReviewed(await planRemote(intent, ctx), ctx)).exitCode,
    0,
  );
  fs.put('.agents/skills/review/SKILL.md', 'damaged');
  fs.put('.agents/skills/review/extra.bin', 'extra');
  fs.put(
    '.agents/skills/personal/SKILL.md',
    '---\nname: personal\ndescription: Personal workflow.\n---\n# Personal\n',
  );
  const next = { ...intent, tag: undefined, commit: secondCommit };
  const review = await planRemote(next, ctx);
  assert.ok(
    review.changes.some(
      (c) => c.path.endsWith('/extra.bin') && c.action === 'delete',
    ),
  );
  assert.equal((await applyReviewed(review, ctx)).exitCode, 0);
  assert.equal(fs.text('.agents/skills/review/SKILL.md'), skill);
  assert.ok(fs.nodes.has(join(fs.root, '.agents/skills/personal/SKILL.md')));
});

test('detach blocks local authored dependencies then removes only accepted hub resources', async () => {
  const fs = memory(),
    git = gitFake(),
    ctx = options(fs, git);
  assert.equal(
    (await applyReviewed(await planRemote(intent, ctx), ctx)).exitCode,
    0,
  );
  fs.put(
    '.agents/skills/personal/SKILL.md',
    '---\nname: personal\ndescription: Personal workflow.\nmetadata:\n  requires: requires.yml\n---\n# Personal\n',
  );
  fs.put(
    '.agents/skills/personal/requires.yml',
    'conventions: []\nskills:\n  - id: review\n    source: hub\n',
  );
  const writes = fs.writes.length;
  await assert.rejects(planDetach(ctx), { code: 'DEPENDENCY_MISSING' });
  assert.equal(fs.writes.length, writes);
  fs.put(
    '.agents/skills/personal/requires.yml',
    'conventions: []\nskills: []\n',
  );
  const result = await applyReviewed(await planDetach(ctx), ctx);
  assert.equal(result.exitCode, 0, JSON.stringify(result));
  assert.equal(fs.io.info(join(fs.root, '.agentscli/hub')), undefined);
  assert.equal(
    fs.io.info(join(fs.root, '.agents/skills/review/SKILL.md')),
    undefined,
  );
  assert.ok(fs.io.info(join(fs.root, '.agents/skills/personal/SKILL.md')));
  assert.equal(fs.text('.agentscli/config.yml'), 'language: en\n');
});

test('partial failure leaves accepted state unpublished and reports exact intent and remaining effects', async () => {
  const fs = memory(),
    git = gitFake();
  let calls = 0;
  const failing = {
    ...engine,
    applyEffects(io, root, effects) {
      calls++;
      if (calls === 2)
        return {
          exitCode: 3,
          ok: false,
          changes: effects.map(({ path, action }) => ({
            path,
            action,
            status: 'pending',
          })),
          diagnostics: [{ code: 'IO_FAILURE', message: 'Injected failure.' }],
        };
      return engine.applyEffects(io, root, effects);
    },
  };
  const ctx = options(fs, git, failing),
    review = await planRemote(intent, ctx),
    result = await applyReviewed(review, ctx);
  assert.equal(result.exitCode, 3);
  assert.equal(result.result.commit, commit);
  assert.ok(result.result.changes.some((c) => c.status === 'completed'));
  assert.ok(result.result.changes.some((c) => c.status === 'pending'));
  assert.equal(fs.text('.agentscli/config.yml'), 'language: en\n');
  assert.equal(fs.io.info(join(fs.root, '.agentscli/hub/lock.yml')), undefined);
  assert.match(
    result.result.diagnostics.at(-1).message,
    /same selection\/operation/u,
  );
  await assert.rejects(planRemote({ ...intent, tag: undefined, commit }, ctx), {
    code: 'STATE_AMBIGUOUS',
  });
});

test('CLI reviewed dry-run revalidates current state and cannot apply a changed saved plan', async () => {
  const fs = memory(),
    git = gitFake(),
    ctx = options(fs, git),
    review = await planRemote(intent, ctx);
  fs.put(
    '.agentscli/templates/AGENTS.tpl.md',
    '# Changed\n\n<!-- agentscli:conventions -->\n',
  );
  const result = await runCli(
    ['apply', '--plan-file', 'plan.json', '--dry-run'],
    { ...ctx, readPlan: () => JSON.stringify(review) },
  );
  assert.equal(result.exitCode, 2);
  assert.equal(fs.writes.length, 0);
});

test('the reviewed human-facing changes cannot be replaced while retaining a valid effects hash', async () => {
  const fs = memory(),
    git = gitFake(),
    ctx = options(fs, git),
    review = await planRemote(intent, ctx);
  await assert.rejects(applyReviewed({ ...review, changes: [] }, ctx), {
    code: 'PRECONDITION',
  });
  assert.equal(fs.writes.length, 0);
});

test('offline check reports installed byte/mode drift as exit 1 and never contacts Git', async () => {
  const fs = memory(),
    git = gitFake(),
    ctx = options(fs, git);
  assert.equal(
    (await applyReviewed(await planRemote(intent, ctx), ctx)).exitCode,
    0,
  );
  fs.put('.agents/skills/review/scripts/check.mjs', 'edited\r\n', {
    mode: 0o644,
  });
  const calls = git.calls.length,
    writes = fs.writes.length;
  const checked = await runCli(['check'], ctx);
  assert.equal(checked.exitCode, 1);
  assert.equal(checked.result.ok, false);
  assert.ok(
    checked.result.changes.some(
      (c) => c.path.endsWith('check.mjs') && c.action === 'update',
    ),
  );
  assert.equal(git.calls.length, calls);
  assert.equal(fs.writes.length, writes);
});

test('tampered accepted bytes block acquisition and checks instead of being repaired remotely', async () => {
  const fs = memory(),
    git = gitFake(),
    ctx = options(fs, git);
  assert.equal(
    (await applyReviewed(await planRemote(intent, ctx), ctx)).exitCode,
    0,
  );
  fs.put('.agentscli/hub/skills/review/scripts/check.mjs', 'tampered');
  const calls = git.calls.length,
    writes = fs.writes.length;
  await assert.rejects(
    planRemote({ ...intent, tag: undefined, commit: secondCommit }, ctx),
    { code: 'HUB_INTEGRITY' },
  );
  await assert.rejects(checkLocal(ctx), { code: 'HUB_INTEGRITY' });
  assert.equal(git.calls.length, calls);
  assert.equal(fs.writes.length, writes);
});

test('switch to an explicitly empty selection removes old managed resources and keeps one accepted hub', async () => {
  const fs = memory(),
    git = gitFake(),
    ctx = options(fs, git);
  assert.equal(
    (await applyReviewed(await planRemote(intent, ctx), ctx)).exitCode,
    0,
  );
  const next = {
    repository: 'ssh://git@other.example.org/team/hub.git',
    commit: secondCommit,
    conventions: [],
    skills: [],
  };
  const result = await applyReviewed(await planRemote(next, ctx), ctx);
  assert.equal(result.exitCode, 0, JSON.stringify(result));
  assert.equal(fs.io.info(join(fs.root, '.agents/skills/review')), undefined);
  assert.equal(
    fs.io.info(join(fs.root, '.agentscli/conventions/testing.md')),
    undefined,
  );
  assert.equal(fs.io.info(join(fs.root, '.agentscli/hub/skills')), undefined);
  assert.match(fs.text('.agentscli/config.yml'), /other\.example\.org/u);
  const lock = engine.parseYaml(fs.text('.agentscli/hub/lock.yml'));
  assert.deepEqual(Object.keys(lock.files), ['agentscli-hub.yml']);
  assert.deepEqual(lock.skills, []);
  assert.equal(lock.commit, secondCommit);
});
