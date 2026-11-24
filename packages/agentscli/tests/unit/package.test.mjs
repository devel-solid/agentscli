import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve, sep } from 'node:path';
import { collectResources, stampSkill } from '../../scripts/package-assets.mjs';
import { PRODUCT_SKILLS } from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/contracts.mjs';
import { frontmatter } from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/markdown.mjs';
import {
  PRODUCT_SUPPORT,
  validateProductResources,
} from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/resources.mjs';

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
    for (const support of PRODUCT_SUPPORT[name])
      add(`${path}/${support}`, 'export {};\n');
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

test('whole operational skill trees map to package resources', () => {
  const { root, io } = resourceIO();
  const resources = collectResources(root, io);
  assert.equal(resources.length, 7);
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
  for (const path of ['notes/guide.md', 'unowned.mjs']) {
    const { root, io, add } = resourceIO();
    add(`assets/templates/${path}`, 'Unexpected package resource\n');
    assert.throws(
      () => collectResources(root, io),
      /only operational skill sources/,
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
  assert.equal(fields.metadata.generatedBy, '@devel-solid/agentscli');
  assert.equal(fields.metadata.generatorVersion, '0.9.7');
  assert.equal(fields.metadata.category, 'authoring');
  assert.doesNotMatch(input.toString(), /generatorVersion/);
});

test('stamping requires source metadata and valid package provenance', () => {
  const pkg = { name: '@devel-solid/agentscli', version: '0.4.0' };
  const input = (extra) =>
    Buffer.from(
      `---\nname: agentscli-build-agents\ndescription: Build useful outputs.\n${extra}---\n# Build\n`,
    );
  for (const extra of [
    'license: Other\n',
    'metadata:\n  generatedBy: other-tool\n',
    `metadata:\n  generatorVersion: "${pkg.version}"\n`,
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
  const source = input('license: MIT\n'),
    before = source.slice();
  assert.deepEqual(
    stampSkill(source, pkg, 'SKILL.md'),
    stampSkill(source, pkg, 'SKILL.md'),
  );
  assert.deepEqual(source, before);
});

function productResources() {
  const { root, io } = resourceIO();
  const entries = collectResources(root, io);
  return {
    skills: Object.fromEntries(
      PRODUCT_SKILLS.map((id) => [
        id,
        Object.fromEntries(
          entries
            .filter((r) => r.destination.startsWith(`skills/${id}/`))
            .map((r) => [
              r.destination.slice(`skills/${id}/`.length),
              r.destination.endsWith('/SKILL.md')
                ? stampSkill(
                    r.content,
                    { name: '@devel-solid/agentscli', version: '0.6.0' },
                    r.destination,
                  )
                : r.content,
            ]),
        ),
      ]),
    ),
  };
}

test('operational assets require complete nonempty runtime support before installation', () => {
  assert.doesNotThrow(() => validateProductResources(productResources()));
  for (const id of PRODUCT_SKILLS)
    for (const path of PRODUCT_SUPPORT[id])
      for (const content of [
        undefined,
        Buffer.alloc(0),
        Buffer.from(' \n'),
        Buffer.from([0xff]),
      ]) {
        const resources = productResources();
        if (content === undefined) delete resources.skills[id][path];
        else resources.skills[id][path] = content;
        assert.throws(
          () => validateProductResources(resources),
          (error) =>
            error.code === 'PACKAGE_RESOURCE' &&
            error.exitCode === 3 &&
            error.path.endsWith(path),
        );
      }
});

test('derived operational assets validate identities, provenance, and one release version', () => {
  for (const change of [
    (resources) => {
      delete resources.skills['agentscli-build-agents'];
    },
    (resources) => {
      resources.skills.extra = {};
    },
    (resources) => {
      resources.skills['agentscli-write-conventions']['SKILL.md'] = Buffer.from(
        '---\nname: wrong\ndescription: Useful\n---\n',
      );
    },
    (resources) => {
      const files = resources.skills['agentscli-write-conventions'];
      files['SKILL.md'] = Buffer.from(
        files['SKILL.md'].toString().replace('license: MIT', 'license: Other'),
      );
    },
    (resources) => {
      const files = resources.skills['agentscli-write-conventions'];
      files['SKILL.md'] = Buffer.from(
        files['SKILL.md']
          .toString()
          .replace(
            'generatedBy: "@devel-solid/agentscli"',
            'generatedBy: other',
          ),
      );
    },
    (resources) => {
      const files = resources.skills['agentscli-write-conventions'];
      files['SKILL.md'] = Buffer.from(
        files['SKILL.md']
          .toString()
          .replace('generatorVersion: 0.6.0', 'generatorVersion: invalid'),
      );
    },
    (resources) => {
      const files = resources.skills['agentscli-write-conventions'];
      files['SKILL.md'] = Buffer.from(
        files['SKILL.md']
          .toString()
          .replace('generatorVersion: 0.6.0', 'generatorVersion: 0.7.0'),
      );
    },
  ]) {
    const resources = productResources();
    change(resources);
    assert.throws(
      () => validateProductResources(resources),
      (error) => error.code === 'PACKAGE_RESOURCE' && error.exitCode === 3,
    );
  }
});
