import * as fs from 'node:fs';
import { dirname, resolve, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  monorepo,
  context,
  regular,
  links,
  tree,
  walk,
  checkOwnSkill,
  requirements,
  checkConvention,
} from './lib.mjs';

export function parseArgs(args) {
  const options = {};
  for (let at = 0; at < args.length; at++) {
    const flag = args[at];
    if (
      !['--repo-root', '--package', '--archive'].includes(flag) ||
      flag in options ||
      !args[at + 1] ||
      args[at + 1].startsWith('--')
    )
      throw new Error(`Invalid or repeated option: ${flag}`);
    options[flag] = args[++at];
  }
  return options;
}
export function checkOwn(root, io = fs) {
  const own = fileURLToPath(new URL('../', import.meta.url));
  const ctx = context(root, io),
    file = resolve(own, 'SKILL.md');
  const info = checkOwnSkill(io.readFileSync(file, 'utf8'), file, ctx);
  requirements(own, info, ctx, io);
  return ctx;
}

import {
  readArchive,
  inspectArchive,
  inspectMetadata,
  preparedFiles,
} from './candidate.mjs';
export { readArchive, inspectArchive, inspectMetadata };
export function validate(start = process.cwd(), options = {}, io = fs) {
  const root = monorepo(start, io);
  checkOwn(root, io);
  const targets = options.package
    ? [options.package]
    : ['agentscli', 'agentscli-hub'];
  if (targets.some((name) => !['agentscli', 'agentscli-hub'].includes(name)))
    throw new Error('Select agentscli or agentscli-hub.');
  if (options.archive && targets.length !== 1)
    throw new Error('Archive inspection requires one target package.');
  const packages = targets.map((name) => {
    const folder = resolve(root, 'packages', name),
      file = resolve(folder, 'package.json');
    regular(file, io);
    const pkg = JSON.parse(io.readFileSync(file, 'utf8'));
    inspectMetadata(pkg, name);
    regular(resolve(folder, 'README.md'), io);
    regular(resolve(folder, 'LICENSE'), io);
    if (options.archive) {
      regular(resolve(options.archive), io);
      return inspectArchive(
        io.readFileSync(resolve(options.archive)),
        pkg,
        preparedFiles(folder, io),
      );
    }
    return {
      name: pkg.name,
      version: pkg.version,
      tag: `${name}-v${pkg.version}`,
    };
  });
  return { ok: true, root, packages };
}
if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  try {
    const options = parseArgs(process.argv.slice(2));
    console.log(
      JSON.stringify(
        validate(options['--repo-root'], {
          package: options['--package'],
          archive: options['--archive'],
        }),
      ),
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
