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

const starterConventions = [
  ['en', 'project-context', 'Project context', 'Replace this comment'],
  [
    'pt-br',
    'contexto-do-projeto',
    'Contexto do projeto',
    'Substitua este comentário',
  ],
];

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
  for (const [language, basename, title, hint] of starterConventions) {
    add(
      `assets/templates/${language}/conventions/${basename}.tpl.md`,
      `---\ntrigger: Read before working.\n---\n\n# ${title}\n\n<!-- ${hint}. -->\n`,
    );
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

test('whole skill trees and both document locales map without duplicated sources', () => {
  const { root, io } = resourceIO();
  const resources = collectResources(root, io);
  assert.equal(resources.length, 6);
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
  assert.ok(
    resources
      .filter((item) => item.destination.startsWith('templates/'))
      .every((item) =>
        /^templates\/(en|pt-br)\/conventions\/.+\.tpl\.md$/u.test(
          item.destination,
        ),
      ),
  );
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
  for (const [language, basename, title, hint] of starterConventions) {
    const resource = resources.find(
      (item) =>
        item.destination ===
        `templates/${language}/conventions/${basename}.tpl.md`,
    );
    assert.ok(resource);
    assert.ok(resource.content.toString().startsWith('---\ntrigger:'));
    assert.ok(resource.content.toString().includes(hint));
    assert.equal(
      resource.content.toString(),
      io.readFileSync(
        resolve(
          root,
          `assets/templates/${language}/conventions/${basename}.tpl.md`,
        ),
        'utf8',
      ),
    );
    assert.ok(
      !resources.some(
        (item) =>
          item.destination === `templates/${language}/${basename}.tpl.md`,
      ),
    );
  }
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
    'assets/templates/pt-br/conventions/CONTEXTO-DO-PROJETO.tpl.md',
    '# Collision\n',
  );
  assert.throws(
    () => collectResources(root, io),
    /Equivalent|overlapping|alias/,
  );
});
test('locale assets reject files outside convention templates', () => {
  for (const path of ['instructions.tpl.md', 'conventions/readme.txt']) {
    const { root, io, add } = resourceIO();
    add(`assets/templates/en/${path}`, '# Unexpected locale resource\n');
    assert.throws(
      () => collectResources(root, io),
      /only convention templates/,
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
