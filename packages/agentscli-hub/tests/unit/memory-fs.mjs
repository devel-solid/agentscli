import path from 'node:path';

export function memoryFs(initial = {}) {
  const entries = new Map();
  const mutations = [];
  const key = (file) => path.resolve(file);
  const addDirectory = (file) => {
    const absolute = key(file);
    if (entries.has(absolute)) return;
    const parent = path.dirname(absolute);
    if (parent !== absolute) addDirectory(parent);
    entries.set(absolute, { type: 'directory' });
  };
  const addFile = (file, value) => {
    addDirectory(path.dirname(key(file)));
    entries.set(key(file), {
      type: 'file',
      bytes: Buffer.from(value),
      nlink: 1,
    });
  };
  for (const [file, value] of Object.entries(initial)) addFile(file, value);
  const api = {
    entries,
    mutations,
    addDirectory,
    addFile,
    existsSync: (file) => entries.has(key(file)),
    lstatSync(file) {
      const entry = entries.get(key(file));
      if (!entry) {
        const error = new Error(`ENOENT ${file}`);
        error.code = 'ENOENT';
        throw error;
      }
      return {
        isFile: () => entry.type === 'file',
        isDirectory: () => entry.type === 'directory',
        isSymbolicLink: () => entry.type === 'link',
        nlink: entry.nlink ?? 1,
      };
    },
    realpathSync: (file) => entries.get(key(file))?.realpath ?? key(file),
    readdirSync(file) {
      const absolute = key(file);
      return [...entries.keys()]
        .filter((item) => item !== absolute && path.dirname(item) === absolute)
        .map((item) => path.basename(item))
        .sort();
    },
    readFileSync(file, encoding) {
      const entry = entries.get(key(file));
      if (!entry || entry.type !== 'file') throw new Error(`ENOENT ${file}`);
      return encoding
        ? entry.bytes.toString(encoding)
        : Buffer.from(entry.bytes);
    },
    mkdirSync(file) {
      mutations.push(['mkdir', key(file)]);
      addDirectory(file);
    },
    writeFileSync(file, bytes) {
      if (api.failWrite?.(key(file))) throw new Error('Injected write failure');
      mutations.push(['write', key(file)]);
      addFile(file, bytes);
    },
    rmdirSync(file) {
      if (api.readdirSync(file).length) throw new Error('Directory not empty');
      mutations.push(['rmdir', key(file)]);
      entries.delete(key(file));
    },
    renameSync(from, to) {
      mutations.push(['rename', key(to)]);
      entries.set(key(to), entries.get(key(from)));
      entries.delete(key(from));
    },
    unlinkSync(file) {
      mutations.push(['unlink', key(file)]);
      entries.delete(key(file));
    },
  };
  return api;
}
