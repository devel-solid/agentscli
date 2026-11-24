import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve, dirname, basename } from 'node:path';
import { gzipSync } from 'node:zlib';
import {
  checkConvention,
  checkOwnSkill,
  conventionFiles,
  header,
  yaml,
  links,
  monorepo,
} from '../../.agents/skills/agentscli-adm-write-conventions/scripts/lib.mjs';
import * as editContract from '../../.agents/skills/agentscli-adm-edit-agents/scripts/lib.mjs';
import * as publishContract from '../../.agents/skills/agentscli-adm-publish-packages/scripts/lib.mjs';
import { checkEntrypoint } from '../../.agents/skills/agentscli-adm-edit-agents/scripts/check.mjs';
import {
  inspectArchive,
  inspectMetadata,
  readArchive,
} from '../../.agents/skills/agentscli-adm-publish-packages/scripts/candidate.mjs';

const root = resolve('fixture');
const conventions = [
  resolve(root, 'rules/review.md'),
  resolve(root, 'rules/testing.md'),
];
const own = resolve(root, '.agents/skills/agentscli-adm-write-conventions');
const other = resolve(root, '.agents/skills/agentscli-adm-edit-agents');
const ctx = {
  root,
  conventions,
  skillRoots: [own, other],
};
const skill = (body = '', meta = '') =>
  `---\nname: agentscli-adm-write-conventions\ndescription: Maintain rules.\n${meta}---\n${body}`;

function memory(entries) {
  const files = new Map(
    Object.entries(entries).map(([path, value]) => [
      resolve(root, path),
      value,
    ]),
  );
  const dirs = new Set([root]);
  for (const file of files.keys())
    for (let dir = dirname(file); !dirs.has(dir); dir = dirname(dir)) {
      dirs.add(dir);
      if (dirname(dir) === dir) break;
    }
  return {
    existsSync: (path) => files.has(resolve(path)) || dirs.has(resolve(path)),
    readFileSync(path) {
      if (!files.has(resolve(path))) throw new Error('missing file');
      return files.get(resolve(path));
    },
    realpathSync: (path) => resolve(path),
    lstatSync(path) {
      if (!files.has(resolve(path)) && !dirs.has(resolve(path)))
        throw new Error('missing path');
      return {
        isFile: () => files.has(resolve(path)),
        isDirectory: () => dirs.has(resolve(path)),
        isSymbolicLink: () => false,
        nlink: 1,
      };
    },
  };
}

test('administrative YAML rejects duplicates, aliases, malformed frontmatter and nonstandard metadata', () => {
  assert.throws(() => yaml('trigger: one\ntrigger: two'), /DUPLICATE_KEY/);
  assert.throws(
    () => yaml('trigger: @sample_private_value'),
    (error) =>
      error.message.includes('Invalid YAML') &&
      !error.message.includes('sample_private_value'),
  );
  assert.throws(() => yaml('one: &a hello\ntwo: *a'), /aliases/i);
  assert.throws(() => header('---\ntrigger: missing terminator'), /Unclosed/);
  assert.throws(
    () =>
      checkOwnSkill(
        skill('', 'metadata: null\n'),
        resolve(own, 'SKILL.md'),
        ctx,
      ),
    /metadata/,
  );
  assert.throws(
    () =>
      checkOwnSkill(
        skill('', 'unknown: other.yml\n'),
        resolve(own, 'SKILL.md'),
        ctx,
      ),
    /frontmatter/,
  );
});

test('administrative skill metadata stays standard and supports arbitrary string values', () => {
  for (const contract of [{ checkOwnSkill }, editContract, publishContract]) {
    assert.equal(
      contract.checkOwnSkill(
        skill('', 'metadata:\n  purpose: review\n'),
        resolve(own, 'SKILL.md'),
        ctx,
      ).metadata.purpose,
      'review',
    );
    assert.throws(
      () =>
        contract.checkOwnSkill(
          skill('', 'metadata:\n  purpose: 42\n'),
          resolve(own, 'SKILL.md'),
          ctx,
        ),
      /metadata/,
    );
  }
});

test('handwritten rules need no trigger and preserve literal examples plus ordinary/self links', () => {
  assert.deepEqual(
    checkConvention(
      '# Review\n\n[Own](#examples) [Project](../package.json)\n\n```md\n[Testing](testing.md)\n```',
      conventions[0],
      ctx,
    ),
    [],
  );
  assert.throws(
    () =>
      checkConvention(
        '---\ntrigger: Review.\nunknown: []\n---\n# Review',
        conventions[0],
        ctx,
      ),
    /frontmatter/,
  );
  assert.throws(
    () => checkConvention('# Wrong name', conventions[0], ctx),
    /canonical/,
  );
});

test('administrative rule link checker recognizes encoded, reference, image and HTML resource links', () => {
  for (const body of [
    '[Testing](testing.md?view=1#rules)',
    '[Testing][t]\n\n[t]: %74esting.md',
    '![Testing](testing.md)',
    '<a href="testing.md#x">Testing</a>',
    '[Skill](../.agents/skills/agentscli-adm-edit-agents)',
    '[Support](../.agents/skills/agentscli-adm-edit-agents/references/guide.md)',
    '[Script](../.agents/skills/agentscli-adm-edit-agents/scripts/check.mjs)',
  ])
    assert.throws(
      () => checkConvention(`# Review\n\n${body}`, conventions[0], ctx),
      /cannot link/,
    );
  assert.equal(links('<a href=testing.md>x</a>')[0].target, 'testing.md');
});

test('skill guidance allows owned support and identity mentions, rejecting foreign links and commands', () => {
  const file = resolve(own, 'SKILL.md');
  assert.equal(
    checkOwnSkill(
      skill(
        'Use agentscli-adm-edit-agents. [Own](scripts/check.mjs)\n`node scripts/check.mjs`',
      ),
      file,
      ctx,
    ).name,
    basename(own),
  );
  for (const body of [
    '[Rule](../../../rules/testing.md)',
    '[Other](../agentscli-adm-edit-agents/SKILL.md)',
    '```sh\nnode .agents/skills/agentscli-adm-edit-agents/scripts/check.mjs\n```',
  ])
    assert.throws(
      () => checkOwnSkill(skill(body), file, ctx),
      /discover external|hardcoded foreign/,
    );
});

test('tool context checks its workspace identity and ignores unrelated configuration files', () => {
  const entries = {
    'package.json': JSON.stringify({
      private: true,
      workspaces: ['packages/agentscli'],
    }),
    'packages/agentscli/package.json': JSON.stringify({
      name: '@devel-solid/agentscli',
      bin: { agentscli: 'dist/cli.js' },
    }),
  };
  assert.equal(
    monorepo(resolve(root, 'packages/agentscli'), memory(entries)),
    root,
  );
  assert.throws(
    () =>
      monorepo(
        root,
        memory({
          'package.json': JSON.stringify({ private: true, workspaces: [] }),
        }),
      ),
    /Expected/,
  );
  for (const contract of [{ monorepo }, editContract, publishContract]) {
    assert.equal(
      contract.monorepo(
        root,
        memory({
          ...entries,
          '.agentscli/config.yml': 'unreadable unrelated data',
        }),
      ),
      root,
    );
    const obsolete = 'unreadable: [configuration',
      io = memory({ ...entries, 'agentscli-compose.yml': obsolete }),
      read = io.readFileSync;
    io.readFileSync = (file) => {
      assert.notEqual(file, resolve(root, 'agentscli-compose.yml'));
      return read(file);
    };
    assert.equal(contract.monorepo(root, io), root);
    assert.equal(read(resolve(root, 'agentscli-compose.yml')), obsolete);
  }
  const invalid = {
    ...entries,
    'packages/agentscli/package.json': JSON.stringify({
      name: '@devel-solid/agentscli',
      bin: { agentscli: {} },
    }),
  };
  assert.throws(() => monorepo(root, memory(invalid)), /Expected/);
});

test('root discovery permits convention links but rejects missing and escaping targets', () => {
  checkEntrypoint(
    '# AGENTS.md\n[Review](rules/review.md)',
    root,
    memory({ 'rules/review.md': '# Review' }),
  );
  assert.throws(
    () =>
      checkEntrypoint(
        '# AGENTS.md\n[Missing](rules/missing.md)',
        root,
        memory({}),
      ),
    /Missing/,
  );
  assert.throws(
    () =>
      checkEntrypoint(
        '---\ngeneratedBy: "@devel-solid/agentscli"\n---\n\n# AGENTS.md',
        root,
        memory({}),
      ),
    /handwritten/,
  );
  assert.throws(
    () =>
      checkEntrypoint(
        '---\ngeneratedBy: "@devel-solid/agentscli"\ngeneratedBy: other\n---\n\n# AGENTS.md',
        root,
        memory({}),
      ),
    /DUPLICATE_KEY/,
  );
  assert.throws(
    () =>
      checkEntrypoint(
        '---\ngeneratedBy: "@devel-solid/agentscli"',
        root,
        memory({}),
      ),
    /Unclosed/,
  );
});

test('convention discovery cannot be disabled by removing optional consultation prose', () => {
  const files = {
    'AGENTS.md':
      '# AGENTS.md\n\n[Overview](README.md)\n\n## Conventions\n\n- [Good](rules/good.md) when reviewing.\n- [Bad](rules/bad.md) when testing.\n\n## Checks\n\nRun checks.',
    'README.md': '# Overview',
    'rules/good.md': '# Good\n\nRead when reviewing.',
    'rules/bad.md':
      '# Wrong\n\n[Skill](../.agents/skills/agentscli-adm-edit-agents/SKILL.md)',
  };
  const found = conventionFiles(root, memory(files));
  assert.deepEqual(
    found.map((path) => basename(path)),
    ['bad.md', 'good.md'],
  );
  assert.throws(
    () =>
      checkConvention(files['rules/bad.md'], resolve(root, 'rules/bad.md'), {
        ...ctx,
        conventions: found,
      }),
    /canonical|cannot link/,
  );
});

test('resource links normalize HTML entities, external resource URLs, case and source aliases', () => {
  for (const body of [
    '<a href="te&#115;ting.md">Testing</a>',
    '<a href=TESTING.md>Testing</a>',
    '[Skill](https://example.org/repo/skills/other/SKILL.md?x=1#heading)',
    '[Convention](https://example.org/repo/conventions/testing.tpl.md)',
    '[Skill](skill://other)',
  ])
    assert.throws(
      () => checkConvention(`# Review\n\n${body}`, conventions[0], ctx),
      /cannot link/,
    );
  assert.doesNotThrow(() =>
    checkConvention(
      '# Review\n\n[Docs](https://example.org/guide)',
      conventions[0],
      ctx,
    ),
  );
});

function tar(entries) {
  const parts = [];
  for (const { name, body = '', type = '0', mode = 0o644 } of entries) {
    const payload = Buffer.from(body),
      header = Buffer.alloc(512);
    header.write(name, 0, 100);
    header.write(mode.toString(8).padStart(7, '0') + '\0', 100, 8);
    header.write(payload.length.toString(8).padStart(11, '0') + '\0', 124, 12);
    header.fill(32, 148, 156);
    header[156] = type.charCodeAt(0);
    const sum = header.reduce((a, b) => a + b, 0);
    header.write(sum.toString(8).padStart(6, '0') + '\0 ', 148, 8);
    parts.push(
      header,
      payload,
      Buffer.alloc((512 - (payload.length % 512)) % 512),
    );
  }
  return gzipSync(Buffer.concat([...parts, Buffer.alloc(1024)]));
}

test('candidate metadata and tar parsing reject wrong identities, aliases, duplicate paths and corruption', () => {
  const pkg = {
    name: '@devel-solid/agentscli',
    version: '0.4.0',
    license: 'MIT',
    bin: { agentscli: 'dist/cli.js' },
    files: ['dist'],
    engines: { node: '^22.0.0' },
  };
  inspectMetadata(pkg, 'agentscli');
  assert.throws(
    () => inspectMetadata({ ...pkg, private: true }, 'agentscli'),
    /identity/,
  );
  assert.throws(
    () => inspectMetadata({ ...pkg, name: 'agentscli-monorepo' }, 'agentscli'),
    /identity/,
  );
  assert.equal(
    readArchive(tar([{ name: 'package/README.md', body: 'Hello' }]))
      .get('package/README.md')
      .bytes.toString(),
    'Hello',
  );
  for (const entries of [
    [{ name: 'package/../escaped' }],
    [{ name: 'package/link', type: '2' }],
    [{ name: 'package/A' }, { name: 'package/a' }],
  ])
    assert.throws(() => readArchive(tar(entries)), /Unsafe|Duplicate/);
  const broken = Buffer.from('invalid');
  assert.throws(() => readArchive(broken));
  assert.throws(
    () =>
      inspectArchive(
        tar([{ name: 'package/package.json', body: JSON.stringify(pkg) }]),
        pkg,
      ),
    /Missing delivery/,
  );
});

test('tar PAX paths count UTF-8 bytes rather than JavaScript characters', () => {
  const record = 'path=package/café.md\n';
  let size = Buffer.byteLength(record) + 2;
  while (size !== Buffer.byteLength(record) + String(size).length + 1)
    size = Buffer.byteLength(record) + String(size).length + 1;
  const archive = tar([
    { name: 'PaxHeader', type: 'x', body: `${size} ${record}` },
    { name: 'fallback', body: 'UTF-8' },
  ]);
  assert.equal(
    readArchive(archive).get('package/café.md').bytes.toString(),
    'UTF-8',
  );
});

function consumerArchive() {
  const pkg = {
    name: '@devel-solid/agentscli',
    version: '0.4.0',
    type: 'module',
    imports: {
      '#engine':
        './dist/assets/skills/agentscli-build-agents/scripts/lib/index.mjs',
    },
    license: 'MIT',
    bin: { agentscli: 'dist/cli.js' },
    files: ['dist'],
    engines: { node: '^22.0.0' },
  };
  const entries = [
    { name: 'package/package.json', body: JSON.stringify(pkg) },
    { name: 'package/README.md', body: '# agentscli' },
    { name: 'package/LICENSE', body: 'MIT' },
    { name: 'package/dist/cli.js', body: '#!/usr/bin/env node\n', mode: 0o755 },
  ];
  for (const id of ['agentscli-write-conventions', 'agentscli-build-agents']) {
    entries.push({
      name: `package/dist/assets/skills/${id}/SKILL.md`,
      body: `---\nname: ${id}\ndescription: Perform the operation.\nlicense: MIT\nmetadata:\n  generatedBy: "${pkg.name}"\n  generatorVersion: ${pkg.version}\n---\n# Operation\n`,
    });
  }
  return { pkg, entries };
}

test('release inspection requires complete skill trees and compares every prepared byte without starter conventions', () => {
  const { pkg, entries } = consumerArchive();
  assert.throws(
    () => inspectArchive(tar(entries), pkg),
    /Missing runtime closure/,
  );
  for (const path of [
    'agentscli-write-conventions/scripts/check.mjs',
    'agentscli-build-agents/scripts/build-agents.mjs',
    'agentscli-build-agents/scripts/lib/index.mjs',
  ])
    entries.push({
      name: `package/dist/assets/skills/${path}`,
      body: 'export const valid = true;\n',
    });
  const prepared = new Map(
    entries
      .filter((entry) => entry.name !== 'package/package.json')
      .map((entry) => [entry.name, Buffer.from(entry.body)]),
  );
  const artifact = inspectArchive(tar(entries), pkg, prepared);
  assert.equal(artifact.version, '0.4.0');
  assert.match(artifact.integrity, /^sha512-/);
  assert.throws(
    () =>
      inspectArchive(
        tar([
          ...entries,
          {
            name: 'package/dist/assets/skills/unknown-skill/SKILL.md',
            body: '# Obsolete',
          },
        ]),
        pkg,
      ),
    /Incorrect operational skill inventory/,
  );
  for (const path of ['unknown-skill/scripts/check.mjs', 'unowned.mjs'])
    assert.throws(
      () =>
        inspectArchive(
          tar([
            ...entries,
            {
              name: `package/dist/assets/skills/${path}`,
              body: 'export const orphan = true;\n',
            },
          ]),
          pkg,
        ),
      /Incorrect operational skill inventory/,
    );
  assert.throws(
    () =>
      inspectArchive(
        tar([
          ...entries,
          {
            name: 'package/dist/assets/templates/conventions/project.tpl.md',
            body: '# Obsolete',
          },
        ]),
        pkg,
      ),
    /Unsupported distributed convention template/,
  );
  const windowsBinMode = entries.map((entry) =>
    entry.name === 'package/dist/cli.js' ? { ...entry, mode: 0o644 } : entry,
  );
  assert.equal(
    inspectArchive(tar(windowsBinMode), pkg, prepared).version,
    '0.4.0',
  );
  for (const changedPackage of [
    { ...pkg, type: 'commonjs' },
    { ...pkg, imports: {} },
    { ...pkg, scripts: { postinstall: 'unreviewed' } },
  ]) {
    const changedMetadata = entries.map((entry) =>
      entry.name === 'package/package.json'
        ? { ...entry, body: JSON.stringify(changedPackage) }
        : entry,
    );
    assert.throws(
      () => inspectArchive(tar(changedMetadata), pkg, prepared),
      /Archive runtime\/publication metadata differs/,
    );
  }
  const changed = entries.map((entry) =>
    entry.name ===
    'package/dist/assets/skills/agentscli-build-agents/scripts/lib/index.mjs'
      ? { ...entry, body: 'changed' }
      : entry,
  );
  assert.throws(
    () => inspectArchive(tar(changed), pkg, prepared),
    /Archive bytes differ/,
  );
  assert.throws(
    () =>
      inspectArchive(
        tar([...entries, { name: 'package/dist/extra.js', body: 'extra' }]),
        pkg,
        prepared,
      ),
    /Archive inventory differs/,
  );
});
