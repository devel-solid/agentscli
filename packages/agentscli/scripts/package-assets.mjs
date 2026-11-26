import * as fs from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { frontmatter } from '../assets/templates/skills/agentscli-build-agents/scripts/lib/markdown.mjs';
import {
  stringifyYaml,
  PRODUCT_SKILLS,
  validPackageVersion,
} from '../assets/templates/skills/agentscli-build-agents/scripts/lib/contracts.mjs';
import { validateProductResources } from '../assets/templates/skills/agentscli-build-agents/scripts/lib/resources.mjs';
import {
  uniquePaths,
  containedPath,
} from '../assets/templates/skills/agentscli-build-agents/scripts/lib/paths.mjs';
export function collectResources(root, io = fs) {
  root = io.realpathSync(root);
  const resources = [];
  function collect(source, destination) {
    const absolute = containedPath(root, source);
    let current = root;
    for (const part of relative(root, absolute).split(sep)) {
      current = resolve(current, part);
      const stat = io.lstatSync(current);
      if (stat.isSymbolicLink() || (stat.isFile() && stat.nlink > 1))
        throw new Error(`Unsafe source ${source}.`);
    }
    const stat = io.lstatSync(absolute);
    if (stat.isDirectory())
      for (const name of io.readdirSync(absolute).sort())
        collect(`${source}/${name}`, `${destination}/${name}`);
    else if (stat.isFile())
      resources.push({ destination, content: io.readFileSync(absolute) });
    else throw new Error(`Nonregular resource ${source}.`);
  }
  if (io.readdirSync(resolve(root, 'assets/templates')).join('\n') !== 'skills')
    throw new Error(
      'Expected only operational skill sources in assets/templates.',
    );
  const names = io.readdirSync(resolve(root, 'assets/templates/skills')).sort();
  if (names.join('\n') !== [...PRODUCT_SKILLS].sort().join('\n'))
    throw new Error('Expected exactly the declared product skill directories.');
  for (const name of PRODUCT_SKILLS)
    collect(`assets/templates/skills/${name}`, `skills/${name}`);
  uniquePaths(resources.map((r) => r.destination));
  const skills = Object.fromEntries(
    PRODUCT_SKILLS.map((id) => [
      id,
      Object.fromEntries(
        resources
          .filter((r) => r.destination.startsWith(`skills/${id}/`))
          .map((r) => [r.destination.slice(`skills/${id}/`.length), r.content]),
      ),
    ]),
  );
  validateProductResources({ skills }, { generated: false });
  return resources;
}
export function stampSkill(content, pkg, path) {
  const header = frontmatter(Buffer.from(content).toString('utf8'), path);
  if (!header) throw new Error(`Missing skill metadata ${path}.`);
  if (
    pkg.name !== '@devel-solid/agentscli' ||
    !validPackageVersion(pkg.version)
  )
    throw new Error(
      'Generator must use the actual package name and semantic version.',
    );
  if (
    header.fields.metadata !== undefined &&
    (!header.fields.metadata ||
      typeof header.fields.metadata !== 'object' ||
      Array.isArray(header.fields.metadata) ||
      Object.values(header.fields.metadata).some((v) => typeof v !== 'string'))
  )
    throw new Error('Skill metadata must contain string values.');
  if (
    Object.hasOwn(header.fields.metadata ?? {}, 'generatedBy') ||
    Object.hasOwn(header.fields.metadata ?? {}, 'generatorVersion')
  )
    throw new Error(
      'Generated provenance belongs only to derived assets, never maintained source stamps or placeholders.',
    );
  if (header.fields.license !== undefined && header.fields.license !== 'MIT')
    throw new Error('Invalid maintained license.');
  const fields = {
    ...header.fields,
    license: 'MIT',
    metadata: {
      ...header.fields.metadata,
      generatedBy: pkg.name,
      generatorVersion: pkg.version,
    },
  };
  return Buffer.from(`---\n${stringifyYaml(fields)}---\n${header.body}`);
}
function packageOf(input) {
  let directory = dirname(resolve(input));
  while (true) {
    const file = resolve(directory, 'package.json');
    if (fs.existsSync(file))
      return {
        root: directory,
        pkg: JSON.parse(fs.readFileSync(file, 'utf8')),
      };
    const parent = dirname(directory);
    if (parent === directory) return;
    directory = parent;
  }
}
export async function packageAssets(
  root,
  { output = resolve(root, 'dist/assets') } = {},
) {
  const resources = collectResources(root),
    pkg = JSON.parse(fs.readFileSync(resolve(root, 'package.json'), 'utf8'));
  for (const { destination, content } of resources) {
    // Unbundled source modules are not an extra operational runtime installation.
    if (
      destination.startsWith('skills/agentscli-build-agents/scripts/lib/') &&
      destination.endsWith('.mjs') &&
      !destination.endsWith('/scripts/lib/index.mjs')
    )
      continue;
    const target = containedPath(output, destination);
    fs.mkdirSync(dirname(target), { recursive: true });
    if (destination.endsWith('/SKILL.md'))
      fs.writeFileSync(target, stampSkill(content, pkg, destination));
    else if (
      destination === 'skills/agentscli-build-agents/scripts/lib/index.mjs' ||
      destination === 'skills/agentscli-write-conventions/scripts/check.mjs' ||
      destination ===
        'skills/agentscli-refactor-conventions/scripts/review-conventions.mjs'
    ) {
      const bundle = await build({
        absWorkingDir: root,
        entryPoints: [resolve(root, 'assets/templates', destination)],
        bundle: true,
        platform: 'node',
        format: 'esm',
        target: 'node22',
        outfile: target,
        metafile: true,
        banner: {
          js: "import { createRequire as __agentscliCreateRequire } from 'node:module'; const require = __agentscliCreateRequire(import.meta.url);",
        },
        legalComments: 'linked',
        logLevel: 'silent',
      });
      const licenses = new Map();
      for (const input of Object.keys(bundle.metafile.inputs))
        if (input.replaceAll('\\', '/').includes('node_modules/')) {
          const owner = packageOf(resolve(root, input));
          if (owner) licenses.set(owner.pkg.name, owner);
        }
      for (const [name, owner] of [...licenses].sort(([a], [b]) =>
        a.localeCompare(b),
      )) {
        for (const filename of fs.readdirSync(owner.root).sort())
          if (/^(?:licen[cs]e|copying|notice)(?:\.|$)/iu.test(filename)) {
            const from = resolve(owner.root, filename),
              stat = fs.lstatSync(from);
            if (!stat.isFile() || stat.isSymbolicLink()) continue;
            const licenseTarget = resolve(
              output,
              'skills',
              destinationSkill(destination),
              'scripts',
              'licenses',
              name.replaceAll('/', '__'),
              filename,
            );
            fs.mkdirSync(dirname(licenseTarget), { recursive: true });
            fs.copyFileSync(from, licenseTarget);
          }
      }
    } else fs.writeFileSync(target, content);
  }
  return resources.length;
}
function destinationSkill(path) {
  return path.split('/')[1];
}
if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
)
  await packageAssets(fileURLToPath(new URL('../', import.meta.url)));
