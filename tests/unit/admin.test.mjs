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
  skillConfiguration,
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
        'Use agentscli-adm-edit-agents. [Own](scripts/check.mjs) [Configuration](agentscli-skill.yml)\n`node scripts/check.mjs`',
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
  const req =
    '.agents/skills/agentscli-adm-write-conventions/agentscli-skill.yml';
  const info = { metadata: { agentscli: 'agentscli-skill.yml' } };
  requirements(own, info, ctx, memory({ [req]: 'requires: []' }));
  for (const text of [
    'requires: []\nunknown: true',
    'requires:\n  - id: agentscli-build-agents\n    source: local',
    'requires:\n  - id: testing\n    source: local',
    'requires:\n  - id: agentscli-adm-edit-agents\n    source: hub',
    'requires: []\nrequires: []',
  ])
    assert.throws(() => requirements(own, info, ctx, memory({ [req]: text })));
  const cyclic = {
    [req]: 'requires:\n  - id: agentscli-adm-edit-agents\n    source: local',
    '.agents/skills/agentscli-adm-edit-agents/SKILL.md':
      '---\nname: agentscli-adm-edit-agents\ndescription: Edit entrypoint.\nmetadata:\n  agentscli: agentscli-skill.yml\n---\n# Edit',
    '.agents/skills/agentscli-adm-edit-agents/agentscli-skill.yml':
      'requires:\n  - id: agentscli-adm-write-conventions\n    source: local',
    '.agents/skills/agentscli-adm-write-conventions/SKILL.md': skill(
      '',
      'metadata:\n  agentscli: agentscli-skill.yml\n',
    ),
  };
  requirements(own, info, ctx, memory(cyclic));
});

test('all administrative configuration parsers enforce the general skill-only schema', () => {
  const parsers = [
    skillConfiguration,
    editContract.skillConfiguration,
    publishContract.skillConfiguration,
  ];
  for (const parse of parsers) {
    assert.deepEqual(parse('{}', 'agentscli-skill.yml'), []);
    assert.deepEqual(parse('requires: []', 'agentscli-skill.yml'), []);
    assert.deepEqual(
      parse(
        'requires:\n  - id: inspect-code\n    source: hub',
        'agentscli-skill.yml',
      ),
      [{ id: 'inspect-code', source: 'hub' }],
    );
    for (const input of [
      '',
      'null',
      '[]',
      'requires: null',
      'requires: "[]"',
      'conventions: []',
      'conventions: []\nskills: []',
      'requires: []\nrequires: []',
      'requires: !!seq []',
      'requires: &items []\nother: *items',
      'requires: [{id: inspect-code, source: global}]',
      'requires: [{id: ../inspect-code, source: local}]',
      'requires: [{id: inspect-code, source: local, type: convention}]',
      'requires: [{id: inspect-code, source: local}, {id: inspect-code, source: local}]',
      Buffer.from([0xc3, 0x28]),
    ])
      assert.throws(() => parse(input, 'agentscli-skill.yml'));
  }
});

test('all administrative readers reject obsolete, missing, orphaned and unsafe configuration', () => {
  const file =
    '.agents/skills/agentscli-adm-write-conventions/agentscli-skill.yml';
  const info = { metadata: { agentscli: 'agentscli-skill.yml' } };
  for (const contract of [
    { requirements, checkOwnSkill },
    editContract,
    publishContract,
  ]) {
    assert.doesNotThrow(() => contract.requirements(own, {}, ctx, memory({})));
    assert.throws(
      () => contract.requirements(own, {}, ctx, memory({ [file]: '{}' })),
      /declare metadata.agentscli/,
    );
    assert.throws(
      () => contract.requirements(own, info, ctx, memory({})),
      /missing declared/,
    );
    assert.throws(
      () =>
        contract.requirements(
          own,
          { metadata: { agentscli: '../agentscli-skill.yml' } },
          ctx,
          memory({}),
        ),
      /must point/,
    );
    assert.throws(
      () =>
        contract.requirements(
          own,
          { metadata: { requires: 'requires.yml' } },
          ctx,
          memory({}),
        ),
      /unsupported/,
    );
    assert.throws(
      () =>
        contract.requirements(
          own,
          {},
          ctx,
          memory({
            '.agents/skills/agentscli-adm-write-conventions/requires.yml':
              'conventions: []\nskills: []',
          }),
        ),
      /unsupported/,
    );
    assert.throws(
      () =>
        contract.checkOwnSkill(
          skill('', 'metadata:\n  requires: requires.yml\n'),
          resolve(own, 'SKILL.md'),
          ctx,
        ),
      /unsupported/,
    );
    assert.throws(
      () =>
        contract.checkOwnSkill(
          skill('<!-- agentscli:requires {} -->'),
          resolve(own, 'SKILL.md'),
          ctx,
        ),
      /obsolete/,
    );
    assert.doesNotThrow(() =>
      contract.checkOwnSkill(
        skill('```markdown\n<!-- agentscli:requires {} -->\n```'),
        resolve(own, 'SKILL.md'),
        ctx,
      ),
    );
    for (const mode of ['hardlink', 'symlink', 'realpath']) {
      const io = memory({ [file]: '{}' }),
        stat = io.lstatSync;
      io.lstatSync = (path) => ({
        ...stat(path),
        nlink:
          mode === 'hardlink' && resolve(path) === resolve(root, file) ? 2 : 1,
        isSymbolicLink: () =>
          mode === 'symlink' && resolve(path) === resolve(root, file),
      });
      if (mode === 'realpath')
        io.realpathSync = (path) =>
          resolve(path) === resolve(root, file)
            ? resolve(root, 'escaped.yml')
            : resolve(path);
      assert.throws(
        () => contract.requirements(own, info, ctx, io),
        /Aliased|Unsafe/,
      );
    }
    assert.throws(
      () =>
        contract.requirements(
          own,
          info,
          ctx,
          memory({ [file]: 'requires:\n  - id: testing\n    source: local' }),
        ),
      /missing skills dependency/,
    );
  }
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
      body: `---\nname: ${id}\ndescription: Perform the operation.\nlicense: MIT\ncompatibility: Requires Node.js >= 22.\nmetadata:\n  generatedBy: "${pkg.name}"\n  generatorVersion: ${pkg.version}\n${id === 'agentscli-build-agents' ? '' : '  agentscli: agentscli-skill.yml\n'}---\n# Operation\n`,
    });
    if (id !== 'agentscli-build-agents')
      entries.push({
        name: `package/dist/assets/skills/${id}/agentscli-skill.yml`,
        body: 'requires:\n  - id: agentscli-build-agents\n    source: local\n',
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
  const configuration =
    'package/dist/assets/skills/agentscli-write-conventions/agentscli-skill.yml';
  assert.throws(
    () =>
      inspectArchive(
        tar(entries.filter((entry) => entry.name !== configuration)),
        pkg,
      ),
    /configuration file/,
  );
  assert.throws(
    () =>
      inspectArchive(
        tar([
          ...entries,
          {
            name: 'package/dist/assets/skills/agentscli-build-agents/agentscli-skill.yml',
            body: '{}',
          },
        ]),
        pkg,
      ),
    /configuration file/,
  );
  assert.throws(
    () =>
      inspectArchive(
        tar([
          ...entries,
          {
            name: 'package/dist/assets/skills/agentscli-build-agents/requires.yml',
            body: 'conventions: []\nskills: []',
          },
        ]),
        pkg,
      ),
    /Unsupported skill dependency/,
  );
  for (const declaration of [
    'conventions: []\nskills: []',
    'requires: null',
    'requires: !!seq []',
    'requires: [{id: agentscli-build-agents, source: hub}]',
    'requires: [{id: absent-skill, source: local}]',
  ]) {
    const changed = entries.map((entry) =>
      entry.name === configuration ? { ...entry, body: declaration } : entry,
    );
    assert.throws(() => inspectArchive(tar(changed), pkg));
  }
  const obsolete = entries.map((entry) =>
    entry.name === 'package/dist/assets/skills/agentscli-build-agents/SKILL.md'
      ? {
          ...entry,
          body: entry.body.replace(
            'metadata:\n',
            'metadata:\n  requires: requires.yml\n',
          ),
        }
      : entry,
  );
  assert.throws(
    () => inspectArchive(tar(obsolete), pkg),
    /Unsupported skill dependency/,
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
