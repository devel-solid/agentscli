import * as fs from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { packageRoot, regular } from './lib.mjs';

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

import {
  readArchive,
  inspectArchive,
  inspectMetadata,
  preparedFiles,
} from './candidate.mjs';
export { readArchive, inspectArchive, inspectMetadata };
export function validate(start = process.cwd(), options = {}, io = fs) {
  const root = packageRoot(start, io);
  const targets = options.package ? [options.package] : ['agentscli'];
  if (targets.some((name) => name !== 'agentscli'))
    throw new Error('Select agentscli.');
  if (options.archive && targets.length !== 1)
    throw new Error('Archive inspection requires one target package.');
  const packages = targets.map((name) => {
    const file = resolve(root, 'package.json');
    regular(file, io);
    const pkg = JSON.parse(io.readFileSync(file, 'utf8'));
    inspectMetadata(pkg, name);
    regular(resolve(root, 'README.md'), io);
    regular(resolve(root, 'LICENSE'), io);
    if (options.archive) {
      regular(resolve(options.archive), io);
      return inspectArchive(
        io.readFileSync(resolve(options.archive)),
        pkg,
        preparedFiles(root, io),
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
