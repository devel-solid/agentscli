import * as fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build as bundle } from 'esbuild';
import { stringify } from 'yaml';
import {
  operationalNames,
  parseSkill,
  safeWalk,
  textFile,
  validateHubFiles,
} from '../assets/templates/skills/agentscli-hub-publish/scripts/support.mjs';

export function stampSkill(text, name, metadata) {
  const parsed = parseSkill(text, `${name}/SKILL.md`, name);
  if (
    parsed.data.license !== 'MIT' ||
    parsed.data.compatibility !== 'Requires Node.js >= 22.'
  ) {
    throw new Error(
      `${name}: distributed skill license/compatibility is invalid.`,
    );
  }
  if (
    typeof metadata.name !== 'string' ||
    !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(metadata.version)
  ) {
    throw new Error('Invalid generating package identity/version.');
  }
  for (const field of ['generatedBy', 'generatorVersion']) {
    if (parsed.data.metadata?.[field] !== undefined) {
      throw new Error(
        `${name}: generator stamps belong to derived output, not maintained sources.`,
      );
    }
  }
  const data = {
    ...parsed.data,
    metadata: {
      ...parsed.data.metadata,
      generatedBy: metadata.name,
      generatorVersion: metadata.version,
    },
  };
  return `---\n${stringify(data, { lineWidth: 0 }).trimEnd()}\n---\n${parsed.body.startsWith('\n') ? '' : '\n'}${parsed.body}`;
}

export function collectAssets(root, fsAdapter = fs) {
  const metadata = JSON.parse(
    fsAdapter.readFileSync(path.join(root, 'package.json'), 'utf8'),
  );
  const source = path.join(root, 'assets/templates');
  const skillsRoot = path.join(source, 'skills');
  const directories = fsAdapter.readdirSync(skillsRoot).sort();
  if (directories.join('\0') !== [...operationalNames].sort().join('\0'))
    throw new Error(
      'Expected exactly five independent hub operational skill sources.',
    );
  const files = new Map();
  for (const [file, bytes] of safeWalk(
    path.join(source, 'scaffold'),
    fsAdapter,
    { allowMissing: false },
  ))
    files.set(file, bytes);
  for (const name of operationalNames) {
    const tree = safeWalk(path.join(skillsRoot, name), fsAdapter, {
      allowMissing: false,
    });
    if (
      !tree.has('SKILL.md') ||
      !tree.has('scripts/support.mjs') ||
      !tree.has(
        name === 'agentscli-hub-publish'
          ? 'scripts/release.mjs'
          : 'scripts/validate.mjs',
      )
    )
      throw new Error(`${name}: incomplete standalone skill.`);
    for (const [relative, bytes] of tree)
      files.set(
        `.agents/skills/${name}/${relative}`,
        relative === 'SKILL.md'
          ? Buffer.from(stampSkill(textFile(bytes, relative), name, metadata))
          : bytes,
      );
  }
  validateHubFiles(files);
  return { files, metadata, source, skillsRoot };
}
export async function assembleAssets(
  root,
  { fsAdapter = fs, bundleAdapter = bundle } = {},
) {
  const { files, metadata, skillsRoot } = collectAssets(root, fsAdapter);
  const destination = path.join(root, 'dist/assets');
  fsAdapter.mkdirSync(destination, { recursive: true });
  for (const [relative, bytes] of files) {
    // npm omits .gitignore files even under an explicit files list.
    const absolute = path.join(
      destination,
      relative === '.gitignore' ? 'gitignore.tpl' : relative,
    );
    fsAdapter.mkdirSync(path.dirname(absolute), { recursive: true });
    fsAdapter.writeFileSync(absolute, bytes);
  }
  for (const name of operationalNames) {
    const directory = path.join(skillsRoot, name, 'scripts');
    const scripts = safeWalk(directory, fsAdapter);
    const notices = new Map();
    for (const relative of scripts.keys()) {
      if (!relative.endsWith('.mjs')) continue;
      const result = await bundleAdapter({
        absWorkingDir: root,
        entryPoints: [path.join(directory, relative)],
        outfile: path.join(
          destination,
          '.agents/skills',
          name,
          'scripts',
          relative,
        ),
        bundle: true,
        platform: 'node',
        format: 'esm',
        target: 'node22',
        external: ['./support.mjs'],
        metafile: true,
        legalComments: 'eof',
        banner: {
          js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
        },
        logLevel: 'silent',
      });
      for (const input of Object.keys(result?.metafile?.inputs ?? {})) {
        let current = path.dirname(path.resolve(root, input));
        if (!current.includes(`${path.sep}node_modules${path.sep}`)) continue;
        while (current !== path.dirname(current)) {
          const packageFile = path.join(current, 'package.json');
          if (fsAdapter.existsSync(packageFile)) {
            const dependency = JSON.parse(
              fsAdapter.readFileSync(packageFile, 'utf8'),
            );
            const identity = `${dependency.name}@${dependency.version}`;
            if (!notices.has(identity)) {
              const license = [
                'LICENSE',
                'license',
                'LICENSE.md',
                'license.md',
                'LICENSE.txt',
                'license.txt',
              ].find((file) => fsAdapter.existsSync(path.join(current, file)));
              if (!license)
                throw new Error(
                  `Bundled dependency ${identity} has no available license text.`,
                );
              notices.set(
                identity,
                fsAdapter.readFileSync(path.join(current, license), 'utf8'),
              );
            }
            break;
          }
          current = path.dirname(current);
        }
      }
    }
    fsAdapter.writeFileSync(
      path.join(
        destination,
        '.agents/skills',
        name,
        'scripts/THIRD_PARTY_LICENSES.txt',
      ),
      [...notices]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([identity, license]) => `${identity}\n\n${license.trim()}\n`)
        .join('\n---\n\n'),
    );
  }
  return {
    files: files.size,
    skills: operationalNames.length,
    version: metadata.version,
  };
}

export async function buildPackage(
  root = path.resolve(fileURLToPath(new URL('..', import.meta.url))),
) {
  const destination = path.resolve(root, 'dist');
  if (
    path.dirname(destination) !== path.resolve(root) ||
    path.basename(destination) !== 'dist'
  )
    throw new Error('Unsafe build destination.');
  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(destination, { recursive: true });
  for (const [relative, bytes] of safeWalk(path.join(root, 'src'), fs, {
    allowMissing: false,
  })) {
    const target = path.join(destination, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes);
  }
  return assembleAssets(root);
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  console.log(JSON.stringify(await buildPackage()));
