import * as fs from 'node:fs';
import { dirname, resolve, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  monorepo,
  context,
  regular,
  checkPath,
  links,
  tree,
  walk,
  checkOwnSkill,
  checkConvention,
} from './lib.mjs';

export function parseArgs(args) {
  const options = {};
  for (let at = 0; at < args.length; at++) {
    const flag = args[at];
    if (
      !['--repo-root', '--package', '--archive', '--file'].includes(flag) ||
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
  checkOwnSkill(io.readFileSync(file, 'utf8'), file, ctx);
  return ctx;
}

export function validate(start = process.cwd(), io = fs, target) {
  const root = monorepo(start, io),
    ctx = checkOwn(root, io);
  if (target) {
    const file = resolve(root, target);
    checkPath(root, file, io);
    regular(file, io);
    if (!ctx.conventions.includes(file)) ctx.conventions.push(file);
  }
  for (const file of ctx.conventions)
    checkConvention(io.readFileSync(file, 'utf8'), file, ctx);
  return {
    ok: true,
    root,
    conventions: ctx.conventions.map((file) => basename(file)),
  };
}
if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options['--package'] || options['--archive'])
      throw new Error('Convention checks accept only --repo-root.');
    console.log(
      JSON.stringify(validate(options['--repo-root'], fs, options['--file'])),
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
