import test from 'node:test';
import assert from 'node:assert/strict';
import { stampSkill, collectAssets } from '../../scripts/build.mjs';
import path from 'node:path';
import { operationalNames } from '../../assets/templates/skills/agentscli-hub-publish/scripts/support.mjs';
import { memoryFs } from './memory-fs.mjs';
import { frontmatter } from '../../assets/templates/skills/agentscli-hub-publish/scripts/support.mjs';

const source =
  '---\nname: agentscli-hub-publish\ndescription: Publish requested hub content.\nlicense: MIT\ncompatibility: Requires Node.js >= 22.\n---\n\n# Publish\n\nOwn content.\n';
test('assembly stamps actual package identity deterministically without changing maintained source', () => {
  const metadata = { name: '@devel-solid/agentscli-hub', version: '0.1.0' };
  const output = stampSkill(source, 'agentscli-hub-publish', metadata);
  assert.equal(output, stampSkill(source, 'agentscli-hub-publish', metadata));
  assert.deepEqual(frontmatter(output).data.metadata, {
    generatedBy: metadata.name,
    generatorVersion: '0.1.0',
  });
  assert.equal(
    frontmatter(output).data.compatibility,
    'Requires Node.js >= 22.',
  );
  assert.equal(frontmatter(source).data.metadata, undefined);
  assert.equal(
    frontmatter(
      stampSkill(source, 'agentscli-hub-publish', {
        ...metadata,
        version: '0.2.0',
      }),
    ).data.metadata.generatorVersion,
    '0.2.0',
  );
});
test('assembly rejects malformed compatibility, stale stamps, wrong identity, and placeholder version', () => {
  const metadata = { name: '@devel-solid/agentscli-hub', version: '0.1.0' };
  assert.throws(() =>
    stampSkill(
      source.replace('>= 22.', '>=22.'),
      'agentscli-hub-publish',
      metadata,
    ),
  );
  assert.throws(() =>
    stampSkill(
      source.replace(
        'license: MIT',
        'license: MIT\nmetadata:\n  generatorVersion: "0.0.1"',
      ),
      'agentscli-hub-publish',
      metadata,
    ),
  );
  assert.throws(() => stampSkill(source, 'wrong-name', metadata));
  assert.throws(() =>
    stampSkill(source, 'agentscli-hub-publish', {
      ...metadata,
      version: 'VERSION',
    }),
  );
});
test('fixed hub discovery retains complete independent trees and excludes external administration', () => {
  const root = path.resolve('unit-package');
  const entries = {
    [path.join(root, 'package.json')]: JSON.stringify({
      name: '@devel-solid/agentscli-hub',
      version: '0.1.0',
    }),
    [path.join(root, 'assets/templates/scaffold/agentscli-hub.yml')]:
      'schemaVersion: 1\nversion: 1.0.0',
    [path.join(root, '.agents/skills/administration/SKILL.md')]:
      'Not a package input',
  };
  for (const name of operationalNames) {
    const directory = path.join(root, 'assets/templates/skills', name);
    entries[path.join(directory, 'SKILL.md')] = source.replaceAll(
      'agentscli-hub-publish',
      name,
    );
    entries[path.join(directory, 'scripts/support.mjs')] =
      'export const independent = true;';
    entries[
      path.join(
        directory,
        name === 'agentscli-hub-publish'
          ? 'scripts/release.mjs'
          : 'scripts/validate.mjs',
      )
    ] = 'export const own = true;';
    entries[path.join(directory, 'assets/binary.dat')] = Buffer.from([0, 255]);
  }
  const fs = memoryFs(entries);
  const { files } = collectAssets(root, fs);
  assert.equal(
    [...files].filter(([file]) => file.endsWith('/SKILL.md')).length,
    5,
  );
  assert.equal(
    [...files.keys()].some((file) => file.includes('administration')),
    false,
  );
  assert.deepEqual(
    files.get(`.agents/skills/${operationalNames[0]}/assets/binary.dat`),
    Buffer.from([0, 255]),
  );
  assert.deepEqual(fs.mutations, []);
  fs.addDirectory(path.join(root, 'assets/templates/skills/unexpected'));
  assert.throws(() => collectAssets(root, fs), /exactly five/);
  fs.entries.delete(path.join(root, 'assets/templates/skills/unexpected'));
  fs.entries.get(
    path.join(root, 'assets/templates/skills', operationalNames[0], 'SKILL.md'),
  ).nlink = 2;
  assert.throws(() => collectAssets(root, fs), { code: 'unsafe-path' });
});
