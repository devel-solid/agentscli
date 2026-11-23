import * as fs from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { HubImportError, commitId, request } from './contracts.mjs';

const text = (value) => new TextDecoder('utf-8', { fatal: true }).decode(value);

export function parseTree(value) {
  const rows = [];
  const data = Buffer.from(value);
  let start = 0;
  for (let end = 0; end < data.length; end++) {
    if (data[end] !== 0) continue;
    const record = data.subarray(start, end);
    start = end + 1;
    if (!record.length) continue;
    const tab = record.indexOf(9);
    const match = /^(\d{6}) ([a-z]+) ([a-f0-9]+)$/u.exec(
      record.subarray(0, tab).toString('ascii'),
    );
    if (!match)
      throw new HubImportError(
        'GIT_TREE',
        'Git returned an invalid tree record.',
        3,
      );
    const raw = record.subarray(tab + 1);
    let path;
    let invalidPath = false;
    try {
      path = text(raw);
    } catch {
      path = raw.toString('utf8');
      invalidPath = true;
    }
    rows.push({
      gitMode: match[1],
      type: match[2],
      object: match[3],
      path,
      invalidPath,
    });
  }
  if (start !== data.length)
    throw new HubImportError(
      'GIT_TREE',
      'Git returned an unterminated tree record.',
      3,
    );
  return rows;
}

export function parseAttributes(value) {
  const parts = text(value).split('\0');
  if (parts.at(-1) === '') parts.pop();
  if (parts.length % 3 !== 0)
    throw new HubImportError(
      'GIT_ATTRIBUTES',
      'Git returned invalid committed attributes.',
      3,
    );
  const attributes = new Map();
  for (let i = 0; i < parts.length; i += 3) {
    if (parts[i + 1] !== 'text')
      throw new HubImportError(
        'GIT_ATTRIBUTES',
        'Unexpected attribute result.',
        3,
      );
    attributes.set(parts[i], parts[i + 2]);
  }
  return attributes;
}

function cleanEnvironment(base, index) {
  const env = {
    ...base,
    GIT_ATTR_NOSYSTEM: '1',
    GIT_CONFIG_COUNT: '0',
    GIT_INDEX_FILE: index,
  };
  for (const name of [
    'GIT_DIR',
    'GIT_COMMON_DIR',
    'GIT_WORK_TREE',
    'GIT_OBJECT_DIRECTORY',
    'GIT_ALTERNATE_OBJECT_DIRECTORIES',
    'GIT_CONFIG',
    'GIT_CONFIG_PARAMETERS',
    'GIT_ATTR_SOURCE',
  ])
    delete env[name];
  // Native SSH/credential helper settings remain available; none are persisted or printed.
  return env;
}

export function createGitCapture({
  run = spawnSync,
  filesystem = fs,
  temporaryRoot = tmpdir(),
  environment = process.env,
} = {}) {
  return {
    capture(input) {
      const intent = request(input);
      const parent = filesystem.realpathSync(temporaryRoot);
      const scratch = filesystem.mkdtempSync(join(parent, 'agentscli-hub-'));
      const scratchReal = filesystem.realpathSync(scratch);
      const inside = relative(parent, scratchReal);
      if (
        !inside ||
        isAbsolute(inside) ||
        inside === '..' ||
        inside.startsWith(`..${sep}`)
      )
        throw new HubImportError(
          'SCRATCH',
          'Temporary Git storage is outside its intended root.',
          3,
        );
      const bare = join(scratch, 'objects.git');
      const templates = join(scratch, 'empty-templates');
      const attributes = join(scratch, 'empty-attributes');
      const index = join(scratch, 'index');
      filesystem.mkdirSync(templates);
      filesystem.writeFileSync(attributes, '');
      const env = cleanEnvironment(environment, index);
      const policy = [
        '-c',
        `core.hooksPath=${templates}`,
        '-c',
        `core.attributesFile=${attributes}`,
        '-c',
        'protocol.file.allow=never',
        '-c',
        'protocol.ext.allow=never',
        '-c',
        'fetch.recurseSubmodules=false',
        '-c',
        'submodule.recurse=false',
        '-c',
        'core.fsmonitor=false',
      ];
      function git(args, { cwd = bare, input } = {}) {
        const result = run('git', [...policy, ...args], {
          cwd,
          env,
          input,
          encoding: 'buffer',
          maxBuffer: 512 * 1024 * 1024,
          windowsHide: true,
        });
        if (result.error || result.status !== 0)
          throw new HubImportError(
            'GIT',
            'Native Git could not inspect the requested hub. Check the endpoint, revision, and existing authentication.',
            3,
          );
        return Buffer.from(result.stdout ?? '');
      }
      try {
        git(['init', '--bare', `--template=${templates}`, bare], {
          cwd: scratch,
        });
        const revision = intent.commit ?? `refs/tags/${intent.tag}`;
        git([
          'fetch',
          '--no-tags',
          '--no-recurse-submodules',
          '--depth=1',
          '--',
          intent.repository,
          revision,
        ]);
        const commit = commitId(
          text(git(['rev-parse', '--verify', 'FETCH_HEAD^{commit}'])).trim(),
        );
        if (intent.commit && commit !== intent.commit)
          throw new HubImportError(
            'REVISION',
            'Fetched hub commit differs from the requested commit.',
          );
        const tree = parseTree(
          git(['ls-tree', '-r', '-z', '--full-tree', commit]),
        );
        const prefixes = intent.skills.map((id) => `skills/${id}/`);
        const exact = new Set([
          'agentscli-hub.yml',
          ...intent.conventions.map((id) => `conventions/${id}.tpl.md`),
          ...intent.skills.map((id) => `skills/${id}`),
        ]);
        const selected = tree.filter(
          (entry) =>
            exact.has(entry.path) ||
            prefixes.some((prefix) => entry.path.startsWith(prefix)),
        );
        if (selected.some((entry) => entry.invalidPath))
          throw new HubImportError(
            'GIT_TREE',
            'Selected Git paths must be valid UTF-8 without replacement characters.',
          );
        // Index inspection reads committed .gitattributes only; no working tree or filter checkout exists.
        git(['read-tree', commit]);
        const values = parseAttributes(
          git(['check-attr', '--cached', '-z', '--stdin', 'text'], {
            input: Buffer.from(
              selected.map((entry) => entry.path).join('\0') +
                (selected.length ? '\0' : ''),
            ),
          }),
        );
        const entries = selected.map((entry) => ({
          ...entry,
          textAttribute: values.get(entry.path) ?? 'unspecified',
          content:
            entry.type === 'blob' &&
            ['100644', '100755'].includes(entry.gitMode)
              ? new Uint8Array(git(['cat-file', 'blob', entry.object]))
              : new Uint8Array(),
        }));
        return { commit, entries };
      } finally {
        // Verify the exact directory created above before any recursive deletion on Windows.
        const info = filesystem.lstatSync(scratch);
        const actual = filesystem.realpathSync(scratch);
        if (
          !info.isDirectory() ||
          info.isSymbolicLink() ||
          actual !== scratchReal ||
          !resolve(actual).startsWith(`${resolve(parent)}${sep}`)
        )
          throw new HubImportError(
            'SCRATCH',
            'Temporary Git storage changed identity; automatic cleanup was refused.',
            3,
          );
        filesystem.rmSync(scratch, { recursive: true, force: true });
      }
    },
  };
}
