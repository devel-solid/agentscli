import * as fs from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { EngineError } from './contracts.mjs';
import { containedPath, portableKey, relativePath } from './paths.mjs';
export const disk = {
  info(path) {
    try {
      const stat = fs.lstatSync(path);
      return {
        kind: stat.isSymbolicLink()
          ? 'link'
          : stat.isFile()
            ? 'file'
            : stat.isDirectory()
              ? 'directory'
              : 'other',
        nlink: stat.nlink,
      };
    } catch (error) {
      if (error.code === 'ENOENT') return undefined;
      throw error;
    }
  },
  names: (path) => fs.readdirSync(path),
  read: (path) => fs.readFileSync(path),
  mkdir: (path) => {
    fs.mkdirSync(path);
  },
  writeExclusive: (path, content) => {
    const descriptor = fs.openSync(path, 'wx');
    try {
      fs.writeFileSync(descriptor, content);
    } catch (error) {
      fs.closeSync(descriptor);
      fs.unlinkSync(path);
      throw error;
    }
    fs.closeSync(descriptor);
  },
  rename: (from, to) => {
    fs.renameSync(from, to);
  },
  unlink: (path) => {
    fs.unlinkSync(path);
  },
  rmdir: (path) => {
    fs.rmdirSync(path);
  },
};
export function checkRoot(io, root) {
  const absolute = resolve(root);
  let current = absolute;
  while (true) {
    if (io.info(current)?.kind !== 'directory')
      throw new EngineError(
        'ROOT',
        'Project root and its ancestors must be existing regular directories without links.',
        2,
        current,
      );
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return absolute;
}
function packageIdentity(io, root, path) {
  if (!inspect(io, root, path, 'file')) return undefined;
  try {
    return JSON.parse(
      Buffer.from(io.read(containedPath(root, path))).toString('utf8'),
    );
  } catch {
    return undefined;
  }
}
function toolPackage(value, name, bin) {
  return (
    value?.name === name &&
    (typeof value.bin?.[bin] === 'string' ||
      (typeof value.bin === 'string' && name.split('/').at(-1) === bin))
  );
}
export function assertProjectTarget(io, root) {
  let current = root;
  while (true) {
    const parent = dirname(current);
    const installationParent = basename(parent).startsWith('@')
      ? dirname(parent)
      : parent;
    if (
      basename(installationParent).toLowerCase() === 'node_modules' &&
      toolPackage(
        packageIdentity(io, current, 'package.json'),
        '@devel-solid/agentscli',
        'agentscli',
      )
    )
      throw new EngineError(
        'PACKAGE_TARGET',
        'Project resources cannot target an installed agentscli package or its descendants.',
        2,
        current,
      );
    if (parent === current) break;
    current = parent;
  }
}
export function inspect(io, root, path, expected) {
  checkRoot(io, root);
  const normalized = relativePath(path);
  containedPath(root, normalized);
  let current = root;
  const parts = normalized.split('/');
  for (let index = 0; index < parts.length; index++) {
    const part = parts[index];
    if (io.info(current)?.kind === 'directory') {
      const alias = io
        .names(current)
        .find(
          (name) => portableKey(name) === portableKey(part) && name !== part,
        );
      if (alias)
        throw new EngineError(
          'PATH_ALIAS',
          `Portable path alias: ${path} conflicts with ${alias}.`,
          2,
          path,
        );
    }
    current = join(current, part);
    const info = io.info(current);
    if (!info) return undefined;
    const kind = index === parts.length - 1 ? expected : 'directory';
    if (
      info.kind === 'link' ||
      info.kind === 'other' ||
      (info.kind === 'file' && info.nlink > 1)
    )
      throw new EngineError(
        'PATH_UNSAFE',
        `Unsafe link or special file: ${path}.`,
        2,
        path,
      );
    if (kind && info.kind !== kind)
      throw new EngineError(
        'PATH_TYPE',
        `Expected a ${kind}: ${path}.`,
        2,
        path,
      );
  }
  return io.info(current);
}
export function walk(io, root, directory) {
  if (!inspect(io, root, directory, 'directory')) return [];
  const files = [];
  for (const name of io.names(containedPath(root, directory)).sort()) {
    const path = `${directory}/${name}`;
    const info = inspect(io, root, path);
    if (info?.kind === 'directory') files.push(...walk(io, root, path));
    else if (info?.kind === 'file') files.push(path);
  }
  return files;
}
function parents(io, root, path) {
  const parts = relativePath(path).split('/');
  for (let index = 1; index < parts.length; index++) {
    const parent = parts.slice(0, index).join('/');
    if (!inspect(io, root, parent, 'directory'))
      io.mkdir(containedPath(root, parent));
  }
}
export function createDirectory(io, root, path) {
  if (inspect(io, root, path, 'directory')) return;
  parents(io, root, path);
  io.mkdir(containedPath(root, path));
}
function unchanged(io, root, path, previous) {
  const exists = inspect(io, root, path, 'file');
  const current = exists ? io.read(containedPath(root, path)) : undefined;
  if (
    !current !== !previous ||
    (current &&
      previous &&
      (current.length !== previous.length ||
        current.some((value, index) => value !== previous[index])))
  )
    throw new EngineError(
      'DESTINATION_CHANGED',
      `Destination changed after preflight: ${path}. Run the command again.`,
      3,
      path,
    );
}
export function replaceFile(io, root, path, content, previous) {
  unchanged(io, root, path, previous);
  parents(io, root, path);
  const target = containedPath(root, path);
  const temporary = join(dirname(target), `.agentscli-${randomUUID()}.tmp`);
  let created = false;
  try {
    io.writeExclusive(temporary, content);
    created = true;
    unchanged(io, root, path, previous);
    io.rename(temporary, target);
  } finally {
    if (created && io.info(temporary)) io.unlink(temporary);
  }
}
export function removeFile(io, root, path, previous) {
  unchanged(io, root, path, previous);
  if (inspect(io, root, path, 'file')) io.unlink(containedPath(root, path));
}
