import assert from 'node:assert/strict';
import { dirname, join, resolve } from 'node:path';
const bytes = (text) => new TextEncoder().encode(text);
export function memory(files = {}) {
  const root = resolve('unit-project');
  const nodes = new Map();
  const writes = [];
  function directory(path) {
    const parent = dirname(path);
    if (parent !== path) directory(parent);
    if (!nodes.has(path)) nodes.set(path, { kind: 'directory', nlink: 1 });
  }
  directory(root);
  function put(path, content, overrides = {}) {
    const absolute = join(root, path);
    directory(dirname(absolute));
    nodes.set(absolute, {
      kind: 'file',
      nlink: 1,
      data: typeof content === 'string' ? bytes(content) : content,
      ...overrides,
    });
  }
  for (const [path, content] of Object.entries(files)) put(path, content);
  const io = {
    info: (path) => {
      const node = nodes.get(path);
      return (
        node && { kind: node.kind, nlink: node.nlink, mode: node.mode ?? 0o644 }
      );
    },
    names: (path) =>
      [...nodes.keys()]
        .filter((key) => key !== path && dirname(key) === path)
        .map((key) => key.slice(path.length + 1)),
    read: (path) => {
      const node = nodes.get(path);
      assert.equal(node?.kind, 'file', path);
      return node.data.slice();
    },
    mkdir: (path) => {
      assert.equal(nodes.get(dirname(path))?.kind, 'directory');
      assert.equal(nodes.has(path), false);
      writes.push(['mkdir', path]);
      nodes.set(path, { kind: 'directory', nlink: 1 });
    },
    writeExclusive: (path, content) => {
      assert.equal(nodes.has(path), false);
      writes.push(['write', path]);
      nodes.set(path, { kind: 'file', nlink: 1, data: content.slice() });
    },
    rename: (from, to) => {
      writes.push(['rename', to]);
      nodes.set(to, nodes.get(from));
      nodes.delete(from);
    },
    unlink: (path) => {
      writes.push(['unlink', path]);
      nodes.delete(path);
    },
    rmdir: (path) => {
      assert.equal(io.names(path).length, 0);
      writes.push(['rmdir', path]);
      nodes.delete(path);
    },
  };
  const text = (path) =>
    Buffer.from(io.read(join(root, path))).toString('utf8');
  return { root, io, nodes, writes, put, text };
}
