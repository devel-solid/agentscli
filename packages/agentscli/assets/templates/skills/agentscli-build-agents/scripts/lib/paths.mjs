import { isAbsolute, relative, resolve, sep } from 'node:path';
import { EngineError } from './manifest.mjs';
export function portableKey(path) {
  return path.replaceAll('\\', '/').normalize('NFC').toLowerCase();
}
export function relativePath(path) {
  const parts = path.replaceAll('\\', '/').split('/');
  if (
    !path.trim() ||
    path !== path.trim() ||
    isAbsolute(path) ||
    /^[A-Za-z]:/u.test(path) ||
    parts.some(
      (part) =>
        !part ||
        part === '.' ||
        part === '..' ||
        /[<>:"|?*\x00-\x1f]/u.test(part) ||
        /[. ]$/u.test(part) ||
        /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(part),
    )
  )
    throw new EngineError(
      'PATH_INVALID',
      `Unsafe relative path: ${path}.`,
      2,
      path,
    );
  return parts.join('/');
}
export function containedPath(root, path) {
  const target = resolve(root, relativePath(path));
  const rel = relative(root, target);
  if (!rel || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel))
    throw new EngineError(
      'PATH_ESCAPE',
      `Path escapes the project: ${path}.`,
      2,
      path,
    );
  return target;
}
export function uniquePaths(paths) {
  const seen = new Map(),
    prefixes = new Map();
  for (const path of paths) {
    const normalized = relativePath(path),
      parts = normalized.split('/');
    for (let index = 1; index <= parts.length; index++) {
      const display = parts.slice(0, index).join('/'),
        prefix = portableKey(display),
        prior = prefixes.get(prefix);
      if (prior && prior !== display)
        throw new EngineError(
          'PATH_COLLISION',
          `Portable directory/path alias: ${prior} and ${display}.`,
          2,
          path,
        );
      prefixes.set(prefix, display);
    }
    const key = portableKey(normalized);
    for (const [other, display] of seen) {
      if (
        key === other ||
        key.startsWith(`${other}/`) ||
        other.startsWith(`${key}/`)
      )
        throw new EngineError(
          'PATH_COLLISION',
          `Equivalent or overlapping paths: ${display} and ${path}.`,
          2,
          path,
        );
    }
    seen.set(key, path);
  }
}
