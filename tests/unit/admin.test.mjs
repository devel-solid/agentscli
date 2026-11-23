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
  requirements,
} from '../../.agents/skills/agentscli-adm-write-conventions/scripts/lib.mjs';
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
  localSkills: [own, other],
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
        skill('', 'requires: other.yml\n'),
        resolve(own, 'SKILL.md'),
        ctx,
      ),
    /frontmatter/,
  );
});

test('handwritten rules need no trigger and preserve literal examples plus ordinary/self links', () => {
  assert.deepEqual(
    checkConvention(
      '# Review\n\n[Own](#examples) [Project](../package.json)\n\n```md\n[Testing](testing.md)\n<!-- AGENT-CARD START -->\n```',
      conventions[0],
      ctx,
    ),
    [],
  );
  assert.throws(
    () =>
      checkConvention(
        '---\ntrigger: Review.\nrequires: []\n---\n# Review',
        conventions[0],
        ctx,
      ),
    /frontmatter/,
  );
  assert.throws(
    () => checkConvention('# Wrong name', conventions[0], ctx),
    /canonical/,
  );
  assert.throws(
    () =>
      checkConvention(
        '# Review\n<!-- AGENT-CARD START -->',
        conventions[0],
        ctx,
      ),
    /obsolete/,
  );
});

test('administrative rule link checker recognizes encoded, reference, image and HTML resource links', () => {
  for (const body of [
    '[Testing](testing.md?view=1#rules)',
    '[Testing][t]\n\n[t]: %74esting.md',
    '![Testing](testing.md)',
    '<a href="testing.md#x">Testing</a>',
    '[Skill](../.agents/skills/agentscli-adm-edit-agents)',
    '[Support](../.agents/skills/agentscli-adm-edit-agents/requires.yml)',
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
        'Use agentscli-adm-edit-agents. [Own](scripts/check.mjs) [Requires](requires.yml)\n`node scripts/check.mjs`',
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

test('tool context checks both workspace identities and rejects unrelated private projects and mixed roles', () => {
  const entries = {
    'package.json': JSON.stringify({
      private: true,
      workspaces: ['packages/agentscli', 'packages/agentscli-hub'],
    }),
    'packages/agentscli/package.json': JSON.stringify({
      name: '@devel-solid/agentscli',
      bin: { agentscli: 'dist/cli.js' },
    }),
    'packages/agentscli-hub/package.json': JSON.stringify({
      name: '@devel-solid/agentscli-hub',
      bin: { 'agentscli-hub': 'dist/cli.js' },
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
  assert.throws(
    () =>
      monorepo(
        root,
        memory({ ...entries, 'agentscli-hub.yml': 'schemaVersion: 1' }),
      ),
    /Conflicting/,
  );
  const invalid = {
    ...entries,
    'packages/agentscli/package.json': JSON.stringify({
      name: '@devel-solid/agentscli',
      bin: { agentscli: {} },
    }),
  };
  assert.throws(() => monorepo(root, memory(invalid)), /Expected/);
});

test('admin dependencies stay local and traverse declared cycles without global or asset fallback', () => {
  const req = '.agents/skills/agentscli-adm-write-conventions/requires.yml';
  const base = {
    [req]: 'conventions:\n  - id: testing\n    source: local\nskills: []\n',
  };
  requirements(
    own,
    { metadata: { requires: 'requires.yml' } },
    ctx,
    memory(base),
  );
  for (const text of [
    'conventions: []\nskills: []\nunknown: true',
    'conventions: []\nskills:\n  - id: agentscli-build-agents\n    source: local',
    'conventions:\n  - id: testing\n    source: hub\nskills: []',
    'conventions: []\nskills: []\nskills: []',
  ])
    assert.throws(() =>
      requirements(
        own,
        { metadata: { requires: 'requires.yml' } },
        ctx,
        memory({ [req]: text }),
      ),
    );
  const cyclic = {
    [req]:
      'conventions: []\nskills:\n  - id: agentscli-adm-edit-agents\n    source: local',
    '.agents/skills/agentscli-adm-edit-agents/SKILL.md':
      '---\nname: agentscli-adm-edit-agents\ndescription: Edit entrypoint.\nmetadata:\n  requires: requires.yml\n---\n# Edit',
    '.agents/skills/agentscli-adm-edit-agents/requires.yml':
      'conventions: []\nskills:\n  - id: agentscli-adm-write-conventions\n    source: local',
    '.agents/skills/agentscli-adm-write-conventions/SKILL.md': skill(
      '',
      'metadata:\n  requires: requires.yml\n',
    ),
  };
  requirements(
    own,
    { metadata: { requires: 'requires.yml' } },
    ctx,
    memory(cyclic),
  );
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
        '<!-- agentscli:generated -->\n# AGENTS.md',
        root,
        memory({}),
      ),
    /handwritten/,
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
  for (const id of [
    'agentscli-write-conventions',
    'agentscli-edit-agents',
    'agentscli-build-agents',
    'agentscli-manage-hub-imports',
  ]) {
    entries.push({
      name: `package/dist/assets/skills/${id}/SKILL.md`,
      body: `---\nname: ${id}\ndescription: Perform the operation.\nlicense: MIT\ncompatibility: Requires Node.js >= 22.\nmetadata:\n  generatedBy: "${pkg.name}"\n  generatorVersion: ${pkg.version}\n---\n# Operation\n`,
    });
  }
  for (const language of ['en', 'pt-br'])
    entries.push({
      name: `package/dist/assets/templates/${language}/AGENTS.tpl.md`,
      body: '# Project\n<!-- agentscli:conventions -->\n',
    });
  return { pkg, entries };
}

test('release inspection rejects metadata-only skill trees and incomplete locales, then compares every prepared byte', () => {
  const { pkg, entries } = consumerArchive();
  assert.throws(
    () => inspectArchive(tar(entries), pkg),
    /Missing runtime closure/,
  );
  for (const path of [
    'agentscli-write-conventions/scripts/check.mjs',
    'agentscli-edit-agents/scripts/check.mjs',
    'agentscli-build-agents/scripts/build-agents.mjs',
    'agentscli-build-agents/scripts/lib/index.mjs',
    'agentscli-manage-hub-imports/scripts/hub-imports.mjs',
    'agentscli-manage-hub-imports/scripts/contracts.mjs',
    'agentscli-manage-hub-imports/scripts/git.mjs',
  ])
    entries.push({
      name: `package/dist/assets/skills/${path}`,
      body: 'export const valid = true;\n',
    });
  assert.throws(() => inspectArchive(tar(entries), pkg), /Missing locale/);
  for (const [language, convention, title] of [
    ['en', 'project-context', 'Project context'],
    ['pt-br', 'contexto-do-projeto', 'Contexto do projeto'],
  ])
    entries.push({
      name: `package/dist/assets/templates/${language}/conventions/${convention}.tpl.md`,
      body: `---\ntrigger: Read before working.\n---\n# ${title}\n`,
    });
  const prepared = new Map(
    entries
      .filter((entry) => entry.name !== 'package/package.json')
      .map((entry) => [entry.name, Buffer.from(entry.body)]),
  );
  const artifact = inspectArchive(tar(entries), pkg, prepared);
  assert.equal(artifact.version, '0.4.0');
  assert.match(artifact.integrity, /^sha512-/);
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
