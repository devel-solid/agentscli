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

export function checkEntrypoint(source, root, io = fs) {
  if (source.startsWith('<!-- agentscli:generated -->'))
    throw new Error('Root AGENTS must remain handwritten.');
  const headings = [];
  walk(tree(source), (node) => {
    if (node.type === 'heading' && node.depth === 1) headings.push(node);
  });
  if (headings.length !== 1) throw new Error('Root AGENTS requires one H1.');
  for (const { target } of links(source)) {
    if (/^[a-z][a-z0-9+.-]*:/iu.test(target) || target.startsWith('#'))
      continue;
    const file = resolve(root, decodeURIComponent(target.split(/[?#]/u)[0]));
    if (!io.existsSync(file))
      throw new Error(`Missing discovery target: ${target}`);
    checkPath(root, file, io);
    regular(file, io);
  }
}
export function validate(start = process.cwd(), io = fs) {
  const root = monorepo(start, io);
  checkOwn(root, io);
  checkEntrypoint(
    io.readFileSync(resolve(root, 'AGENTS.md'), 'utf8'),
    root,
    io,
  );
  return { ok: true, root, file: 'AGENTS.md' };
}
if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options['--package'] || options['--archive'])
      throw new Error('Entrypoint checks accept only --repo-root.');
    console.log(JSON.stringify(validate(options['--repo-root'])));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
