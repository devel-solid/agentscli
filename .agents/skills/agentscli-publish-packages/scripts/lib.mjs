import * as fs from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

const key = (value) => value.normalize('NFC').toLowerCase();
export function regular(path, io = fs) {
  const stat = io.lstatSync(path);
  if (
    !stat.isFile() ||
    stat.isSymbolicLink() ||
    stat.nlink > 1 ||
    key(io.realpathSync(path)) !== key(resolve(path))
  )
    throw new Error(`Unsafe regular file: ${path}`);
  return stat;
}
export function checkPath(root, path, io = fs) {
  const absolute = resolve(path),
    rel = relative(root, absolute);
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel))
    throw new Error(`Path escapes project: ${path}`);
  let at = root;
  for (const part of rel.split(sep).filter(Boolean)) {
    at = resolve(at, part);
    const stat = io.lstatSync(at);
    if (
      stat.isSymbolicLink() ||
      (stat.isFile() && stat.nlink > 1) ||
      key(io.realpathSync(at)) !== key(at)
    )
      throw new Error(`Aliased path: ${at}`);
  }
  return absolute;
}
export function monorepo(start, io = fs) {
  let at = resolve(start);
  for (;;) {
    const file = resolve(at, 'package.json');
    if (io.existsSync(file)) {
      regular(file, io);
      const pkg = JSON.parse(io.readFileSync(file, 'utf8'));
      if (pkg.private === true && Array.isArray(pkg.workspaces)) {
        const identities = new Map();
        for (const workspace of pkg.workspaces) {
          if (typeof workspace !== 'string' || workspace.includes('*'))
            continue;
          const path = resolve(at, workspace, 'package.json');
          if (!io.existsSync(path)) continue;
          checkPath(at, path, io);
          regular(path, io);
          const child = JSON.parse(io.readFileSync(path, 'utf8'));
          identities.set(child.name, child);
        }
        if (
          pkg.workspaces.length === 1 &&
          identities.size === 1 &&
          typeof identities.get('@devel-solid/agentscli')?.bin?.agentscli ===
            'string'
        ) {
          return at;
        }
      }
    }
    const parent = dirname(at);
    if (parent === at)
      throw new Error(
        'Expected the private agentscli tool monorepo and verified workspace identity.',
      );
    at = parent;
  }
}
