import assert from 'node:assert/strict';
import test from 'node:test';
import { dirname, resolve, sep } from 'node:path';
import {
  collectResources,
  packageAssets,
  stampSkill,
} from '../../scripts/package-assets.mjs';
import { PRODUCT_SKILLS } from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/manifest.mjs';
import { frontmatter } from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/markdown.mjs';

function resourceIO(overrides = {}) {
  const root = resolve('unit-resources');
  const files = new Map();
  function add(path, content) {
    files.set(resolve(root, path), Buffer.from(content));
  }
  for (const name of PRODUCT_SKILLS) {
    const path = `assets/templates/skills/${name}`;
    add(
      `${path}/SKILL.md`,
      `---\nname: ${name}\ndescription: Write useful project instructions.\n---\nBody\n`,
    );
    add(`${path}/references/example.md`, 'Support content\n');
  }
  const writes = [];
  const io = {
    realpathSync: (path) => path,
    lstatSync(path) {
      const file = files.has(path);
      if (
        !file &&
        ![...files.keys()].some((key) => key.startsWith(`${path}${sep}`))
      )
        throw new Error(`Missing mocked resource: ${path}`);
      return {
        isFile: () => file,
        isDirectory: () => !file,
        isSymbolicLink: () => false,
        nlink: 1,
      };
    },
    readFileSync(path, encoding) {
      const content = files.get(path);
      if (!content) throw new Error(`Missing mocked resource: ${path}`);
      return encoding ? content.toString(encoding) : content;
    },
    readdirSync(path) {
      return [
        ...new Set(
          [...files.keys()]
            .filter((key) => key.startsWith(`${path}${sep}`))
            .map((key) => key.slice(path.length + 1).split(sep)[0]),
        ),
      ];
    },
    mkdirSync: () => {},
    writeFileSync: (path, content) => writes.push({ path, content }),
    ...overrides,
  };
  return { root, io, add, writes };
}

test('whole skill trees map without requiring initial convention sources', () => {
  const { root, io } = resourceIO();
  const resources = collectResources(root, io);
  assert.equal(resources.length, 4);
  assert.equal(
    resources
      .find(
        (item) =>
          item.destination ===
          'skills/agentscli-write-conventions/references/example.md',
      )
      .content.toString(),
    'Support content\n',
  );
  assert.ok(resources.every((item) => item.destination.startsWith('skills/')));
  assert.ok(resources.every((item) => !item.destination.includes('release')));
  assert.deepEqual(
    [
      ...new Set(
        resources
          .filter((item) => item.destination.startsWith('skills/'))
          .map((item) => item.destination.split('/')[1]),
      ),
    ].sort(),
    [...PRODUCT_SKILLS].sort(),
  );
});

test('entrypoint metadata must match the directory and include a description', () => {
  const { root, io, add } = resourceIO();
  for (const content of [
    '# Skill',
    '---\nname: wrong\ndescription: useful\n---\n',
    '---\nname: agentscli-write-conventions\ndescription: ""\n---\n',
  ]) {
    add(
      'assets/templates/skills/agentscli-write-conventions/SKILL.md',
      content,
    );
    assert.throws(
      () => collectResources(root, io),
      /name|description|frontmatter/i,
    );
  }
});

test('packaging rejects linked sources, hardlinks, unsafe aliases and missing skill trees', () => {
  const { root, io, add } = resourceIO();
  const original = io.lstatSync;
  for (const field of ['isSymbolicLink', 'nlink']) {
    io.lstatSync = (path) => ({
      ...original(path),
      ...(path.endsWith('example.md')
        ? field === 'nlink'
          ? { nlink: 2 }
          : { isSymbolicLink: () => true }
        : {}),
    });
    assert.throws(() => collectResources(root, io), /Unsafe/);
  }
  io.lstatSync = original;
  add(
    'assets/templates/skills/agentscli-build-agents/references/EXAMPLE.md',
    '# Collision\n',
  );
  assert.throws(
    () => collectResources(root, io),
    /Equivalent|overlapping|alias/,
  );
});
test('packaging rejects sources outside the two operational skills', () => {
  for (const path of [
    'starter/conventions/project.tpl.md',
    'instructions.tpl.md',
  ]) {
    const { root, io, add } = resourceIO();
    add(`assets/templates/${path}`, '# Unexpected template resource\n');
    assert.throws(
      () => collectResources(root, io),
      /only consumer skill sources/,
    );
  }
});
test('derived metadata uses actual CLI identity/version without mutating source', () => {
  const input = Buffer.from(
    '---\nname: agentscli-build-agents\ndescription: Build useful outputs.\nmetadata:\n  category: authoring\n---\n# Build\n',
  );
  const output = stampSkill(
      input,
      { name: '@devel-solid/agentscli', version: '0.9.7' },
      'SKILL.md',
    ),
    fields = frontmatter(output.toString(), 'SKILL.md').fields;
  assert.equal(fields.license, 'MIT');
  assert.equal(fields.compatibility, 'Requires Node.js >= 22.');
  assert.equal(fields.metadata.generatedBy, '@devel-solid/agentscli');
  assert.equal(fields.metadata.generatorVersion, '0.9.7');
  assert.equal(fields.metadata.category, 'authoring');
  assert.doesNotMatch(input.toString(), /generatorVersion/);
});

test('stamping rejects stale, malformed or placeholder provenance instead of silently hiding it', () => {
  const pkg = { name: '@devel-solid/agentscli', version: '0.4.0' };
  const input = (extra) =>
    Buffer.from(
      `---\nname: agentscli-build-agents\ndescription: Build useful outputs.\n${extra}---\n# Build\n`,
    );
  for (const extra of [
    'license: Other\n',
    'compatibility: Requires Node.js.\n',
    'metadata:\n  generatedBy: old-package\n',
    'metadata:\n  generatorVersion: "0.1.0"\n',
    'metadata:\n  generatorVersion: PLACEHOLDER\n',
    'metadata:\n  generatorVersion: 1\n',
  ])
    assert.throws(() => stampSkill(input(extra), pkg, 'SKILL.md'));
  for (const invalid of [
    { ...pkg, name: '@example/other-tool' },
    { ...pkg, version: 'PLACEHOLDER' },
    { ...pkg, version: 0.4 },
  ])
    assert.throws(() => stampSkill(input(''), invalid, 'SKILL.md'));
  const source = input(
      'license: MIT\ncompatibility: Requires Node.js >= 22.\n',
    ),
    before = source.slice();
  assert.deepEqual(
    stampSkill(source, pkg, 'SKILL.md'),
    stampSkill(source, pkg, 'SKILL.md'),
  );
  assert.deepEqual(source, before);
});
