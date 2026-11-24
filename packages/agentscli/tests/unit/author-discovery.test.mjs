import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { memory } from './memory.mjs';
import * as author from '../../assets/templates/skills/agentscli-write-conventions/scripts/check.mjs';
const entry =
  '---\nname: agentscli-build-agents\ndescription: Build requested instructions.\nlicense: MIT\ncompatibility: Requires Node.js >= 22.\nmetadata:\n  generatedBy: "@devel-solid/agentscli"\n  generatorVersion: "0.4.0"\n---\n# Build\n';
const base = '.agents/skills/agentscli-build-agents';
function fixture(files = {}) {
  const state = memory({
    '.agentscli/config.yml': 'language: en\n',
    [`${base}/SKILL.md`]: entry,
    [`${base}/scripts/lib/index.mjs`]: 'export const local = true;\n',
    ...files,
  });
  const fs = {
    lstatSync(path) {
      const n = state.nodes.get(path);
      if (!n) {
        const e = new Error('Missing path');
        e.code = 'ENOENT';
        throw e;
      }
      return {
        isFile: () => n.kind === 'file',
        isDirectory: () => n.kind === 'directory',
        isSymbolicLink: () => n.kind === 'link',
        nlink: n.nlink ?? 1,
      };
    },
    readdirSync: (path) => state.io.names(path),
    readFileSync: (path, encoding) =>
      encoding
        ? state.text(path.slice(state.root.length + 1))
        : state.io.read(path),
  };
  return { ...state, fs };
}
test(`conventions discovery parses only leading canonical metadata and ignores body examples`, () => {
  assert.equal(author.isBuildIdentity(entry), true);
  assert.equal(
    author.isBuildIdentity(
      '---\nname: shared-example\ndescription: Example.\n---\n```yaml\n' +
        entry +
        '\n```',
    ),
    false,
  );
  assert.equal(author.isBuildIdentity('# Example\n' + entry), false);
  assert.equal(
    author.isBuildIdentity(
      entry.replace('name: agentscli-build-agents', 'name: other'),
    ),
    false,
  );
});
test(`conventions never imports a shared body-example impostor when the genuine engine is missing`, async () => {
  const fs = fixture();
  for (const path of [...fs.nodes.keys()])
    if (path.startsWith(join(fs.root, base))) fs.nodes.delete(path);
  fs.put(
    '.agents/skills/shared-example/SKILL.md',
    '---\nname: shared-example\ndescription: Teach skill syntax.\n---\n```yaml\n' +
      entry +
      '\n```',
  );
  fs.put(
    '.agents/skills/shared-example/scripts/lib/index.mjs',
    'throw new Error("downloaded code");',
  );
  let loaded = false;
  const response = await author.check(['--repo-root', fs.root], {
    fs: fs.fs,
    load: async () => {
      loaded = true;
      throw new Error('must not load');
    },
  });
  assert.equal(response.exitCode, 2);
  assert.equal(loaded, false);
});
test(`conventions rejects linked and hardlinked entries, indexes, ancestors, and portable aliases before import`, async () => {
  for (const [path, override] of [
    [`${base}/SKILL.md`, { kind: 'link' }],
    [`${base}/scripts/lib/index.mjs`, { nlink: 2 }],
    [`${base}/scripts`, { kind: 'link' }],
  ]) {
    const fs = fixture(),
      node = fs.nodes.get(join(fs.root, path));
    Object.assign(node, override);
    let loaded = false;
    const response = await author.check(['--repo-root', fs.root], {
      fs: fs.fs,
      load: async () => {
        loaded = true;
        return {};
      },
    });
    assert.equal(response.exitCode, 2, path);
    assert.equal(loaded, false, path);
  }
  const fs = fixture();
  fs.put('.agents/skills/AGENTSCLI-BUILD-AGENTS/extra.txt', 'alias');
  assert.throws(
    () => author.discoverEngine(fs.root, { fs: fs.fs }),
    /canonical|alias/,
  );
});
test(`conventions loads only the verified local engine and requests read-only validation`, async () => {
  const fs = fixture(),
    calls = [];
  const response = await author.check(['--repo-root', fs.root], {
    fs: fs.fs,
    load: async (path) => {
      assert.equal(path, join(fs.root, base, 'scripts/lib/index.mjs'));
      return {
        execute: async (...args) => {
          calls.push(args);
          return { exitCode: 0, result: { ok: true } };
        },
      };
    },
  });
  assert.equal(response.exitCode, 0);
  assert.deepEqual(calls, [['validate', { repoRoot: fs.root }]]);
});
