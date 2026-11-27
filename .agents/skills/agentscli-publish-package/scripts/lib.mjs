import * as fs from 'node:fs';
import {
  basename,
  dirname,
  isAbsolute,
  relative,
  resolve,
  sep,
} from 'node:path';

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
export function packageRoot(start, io = fs) {
  let at = resolve(start);
  for (;;) {
    const file = resolve(at, 'package.json');
    if (io.existsSync(file)) {
      regular(file, io);
      const pkg = JSON.parse(io.readFileSync(file, 'utf8'));
      if (pkg.name === '@devel-solid/agentscli') {
        const parent = dirname(at);
        const installationParent = basename(parent).startsWith('@')
          ? dirname(parent)
          : parent;
        if (
          pkg.private !== true &&
          !Object.hasOwn(pkg, 'workspaces') &&
          pkg.bin?.agentscli === 'dist/cli.js' &&
          basename(installationParent).toLowerCase() !== 'node_modules'
        ) {
          return at;
        }
        throw new Error(
          'Expected the public agentscli source package without workspaces.',
        );
      }
    }
    const parent = dirname(at);
    if (parent === at)
      throw new Error(
        'Expected the public agentscli source package and verified executable identity.',
      );
    at = parent;
  }
}
