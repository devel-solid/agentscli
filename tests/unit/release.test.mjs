import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve, dirname } from 'node:path';
import { gzipSync } from 'node:zlib';
import {
  packageRoot,
  regular,
  checkPath,
} from '../../.agents/skills/agentscli-publish-packages/scripts/lib.mjs';
import {
  parseArgs,
  validate,
} from '../../.agents/skills/agentscli-publish-packages/scripts/check.mjs';
import {
  inspectArchive,
  inspectMetadata,
  readArchive,
} from '../../.agents/skills/agentscli-publish-packages/scripts/candidate.mjs';

const root = resolve('fixture');
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

test('release discovery verifies the public source root and package executable', () => {
  const entries = {
    'package.json': JSON.stringify({
      name: '@devel-solid/agentscli',
      bin: { agentscli: 'dist/cli.js' },
    }),
    'project-settings.yml': 'unrelated data',
  };
  assert.equal(packageRoot(resolve(root, 'src'), memory(entries)), root);
  for (const pkg of [
    { private: true, workspaces: ['legacy-package'] },
    { name: '@example/other', bin: { agentscli: 'dist/cli.js' } },
    { name: '@devel-solid/agentscli', bin: { agentscli: {} } },
    { name: '@devel-solid/agentscli', bin: { agentscli: 'other.js' } },
    {
      name: '@devel-solid/agentscli',
      bin: { agentscli: 'dist/cli.js' },
      private: true,
    },
    {
      name: '@devel-solid/agentscli',
      bin: { agentscli: 'dist/cli.js' },
      workspaces: [],
    },
  ])
    assert.throws(
      () => packageRoot(root, memory({ 'package.json': JSON.stringify(pkg) })),
      /Expected/,
    );
});

test('release discovery rejects installed packages and aliased metadata', () => {
  const pkg = JSON.stringify({
    name: '@devel-solid/agentscli',
    bin: { agentscli: 'dist/cli.js' },
  });
  for (const location of [
    'node_modules/@devel-solid/agentscli',
    'node_modules/agentscli',
  ]) {
    const io = memory({ [`${location}/package.json`]: pkg });
    assert.throws(
      () => packageRoot(resolve(root, location, 'nested'), io),
      /Expected/,
    );
  }
  const io = memory({ 'package.json': pkg });
  assert.throws(
    () =>
      packageRoot(root, { ...io, realpathSync: () => resolve(root, 'alias') }),
    /Unsafe/,
  );
});

test('candidate validation reads metadata and delivery documents from the public root', () => {
  const io = memory({
    'package.json': JSON.stringify({
      name: '@devel-solid/agentscli',
      version: '0.4.0',
      license: 'MIT',
      bin: { agentscli: 'dist/cli.js' },
      files: ['dist'],
      engines: { node: '^22.0.0' },
    }),
    'README.md': '# Package',
    LICENSE: 'MIT',
  });
  assert.deepEqual(validate(resolve(root, 'src'), {}, io), {
    ok: true,
    root,
    packages: [
      {
        name: '@devel-solid/agentscli',
        version: '0.4.0',
        tag: 'agentscli-v0.4.0',
      },
    ],
  });
  assert.throws(
    () => validate(root, { package: 'other' }, io),
    /Select agentscli/,
  );
});

test('release file inspection rejects escapes, linked files and aliased paths', () => {
  const file = resolve(root, 'README.md');
  const io = memory({ 'README.md': '# Package' });
  assert.equal(checkPath(root, file, io), file);
  assert.throws(
    () => checkPath(root, resolve(root, '../outside'), io),
    /escapes/,
  );
  const linked = {
    ...io,
    lstatSync: (path) => ({ ...io.lstatSync(path), nlink: 2 }),
  };
  assert.throws(() => regular(file, linked), /Unsafe regular/);
  assert.throws(() => checkPath(root, file, linked), /Aliased/);
  assert.throws(
    () =>
      checkPath(root, file, {
        ...io,
        realpathSync: () => resolve(root, 'different'),
      }),
    /Aliased/,
  );
});

test('release argument parsing accepts only unique supported options with values', () => {
  assert.deepEqual(
    parseArgs([
      '--repo-root',
      '.',
      '--package',
      'agentscli',
      '--archive',
      'candidate.tgz',
    ]),
    {
      '--repo-root': '.',
      '--package': 'agentscli',
      '--archive': 'candidate.tgz',
    },
  );
  for (const args of [
    ['--unknown', '.'],
    ['--package'],
    ['--package', '--archive'],
    ['--package', 'agentscli', '--package', 'agentscli'],
  ])
    assert.throws(() => parseArgs(args), /Invalid or repeated/);
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
    'agentscli-build-agents',
    'agentscli-refactor-conventions',
  ]) {
    entries.push({
      name: `package/dist/assets/skills/${id}/SKILL.md`,
      body: `---\nname: ${id}\ndescription: Perform the operation.\nlicense: MIT\nmetadata:\n  generatedBy: "${pkg.name}"\n  generatorVersion: ${pkg.version}\n---\n# Operation\n`,
    });
  }
  return { pkg, entries };
}

test('release inspection requires complete skill trees and compares every prepared byte', () => {
  const { pkg, entries } = consumerArchive();
  assert.throws(
    () => inspectArchive(tar(entries), pkg),
    /Missing runtime closure/,
  );
  for (const path of [
    'agentscli-write-conventions/scripts/check.mjs',
    'agentscli-write-conventions/references/writing-examples.md',
    'agentscli-build-agents/scripts/build-agents.mjs',
    'agentscli-build-agents/scripts/lib/index.mjs',
    'agentscli-refactor-conventions/references/refactoring-examples.md',
    'agentscli-refactor-conventions/scripts/review-conventions.mjs',
  ])
    entries.push({
      name: `package/dist/assets/skills/${path}`,
      body: path.endsWith('.md')
        ? '# Writing examples\n'
        : 'export const valid = true;\n',
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
        tar(
          entries.filter(
            (entry) =>
              entry.name !==
              'package/dist/assets/skills/agentscli-refactor-conventions/scripts/review-conventions.mjs',
          ),
        ),
        pkg,
      ),
    /Missing runtime closure: agentscli-refactor-conventions\/scripts\/review-conventions\.mjs/,
  );
  assert.throws(
    () =>
      inspectArchive(
        tar(
          entries.filter(
            (entry) =>
              entry.name !==
              'package/dist/assets/skills/agentscli-refactor-conventions/SKILL.md',
          ),
        ),
        pkg,
      ),
    /Incorrect operational skill inventory/,
  );
  assert.throws(
    () =>
      inspectArchive(
        tar(
          entries.filter(
            (entry) =>
              entry.name !==
              'package/dist/assets/skills/agentscli-refactor-conventions/references/refactoring-examples.md',
          ),
        ),
        pkg,
      ),
    /Missing runtime closure/,
  );
  assert.throws(
    () =>
      inspectArchive(
        tar([
          ...entries,
          {
            name: 'package/dist/assets/skills/unknown-skill/SKILL.md',
            body: '# Unowned',
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
            name: 'package/dist/assets/extra.md',
            body: '# Unowned',
          },
        ]),
        pkg,
      ),
    /File outside the package delivery inventory/,
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
        tar([
          ...entries,
          {
            name: 'package/dist/assets/skills/agentscli-build-agents/scripts/extra.mjs',
            body: 'extra',
          },
        ]),
        pkg,
        prepared,
      ),
    /Archive inventory differs/,
  );
});
