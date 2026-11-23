import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { basename, resolve } from 'node:path';
import {
  regular,
  checkPath,
  header,
  links,
  skillConfiguration,
  tree,
  walk,
} from './lib.mjs';
import * as nodeFs from 'node:fs';
import { parseDocument, visit } from 'yaml';

const names = {
  agentscli: [
    'agentscli-write-conventions',
    'agentscli-edit-agents',
    'agentscli-build-agents',
    'agentscli-manage-hub-imports',
  ],
  'agentscli-hub': [
    'agentscli-hub-write-conventions',
    'agentscli-hub-edit-agents',
    'agentscli-hub-write-shared-conventions',
    'agentscli-hub-write-shared-skills',
    'agentscli-hub-publish',
  ],
};
export function inspectMetadata(pkg, name) {
  if (
    !names[name] ||
    pkg.name !== `@devel-solid/${name}` ||
    pkg.private === true ||
    pkg.license !== 'MIT' ||
    typeof pkg.bin?.[name] !== 'string' ||
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u.test(
      pkg.version,
    )
  )
    throw new Error(
      'Invalid target package identity, version, license, or executable.',
    );
  if (!Array.isArray(pkg.files) || !pkg.files.length || !pkg.engines?.node)
    throw new Error('Missing package delivery/runtime contract.');
  return pkg;
}
function string(buffer) {
  return buffer.toString('utf8').replace(/\0.*$/su, '');
}
function octal(buffer) {
  const value = string(buffer).trim();
  if (!/^[0-7]*$/u.test(value))
    throw new Error('Unsupported tar numeric field.');
  return value ? Number.parseInt(value, 8) : 0;
}
function pax(bytes) {
  const result = {};
  let at = 0;
  while (at < bytes.length) {
    const space = bytes.indexOf(32, at),
      size = Number(bytes.subarray(at, space).toString('ascii'));
    if (
      space < at ||
      !Number.isInteger(size) ||
      size <= space - at + 1 ||
      at + size > bytes.length ||
      bytes[at + size - 1] !== 10
    )
      throw new Error('Malformed tar PAX record.');
    const record = new TextDecoder('utf-8', { fatal: true }).decode(
        bytes.subarray(space + 1, at + size - 1),
      ),
      eq = record.indexOf('=');
    if (eq < 1) throw new Error('Malformed tar PAX key.');
    result[record.slice(0, eq)] = record.slice(eq + 1);
    at += size;
  }
  return result;
}
export function readArchive(bytes) {
  const tar = gunzipSync(bytes),
    files = new Map(),
    destinations = new Set();
  let extra = {},
    global = {};
  for (let at = 0; at + 512 <= tar.length;) {
    const block = tar.subarray(at, at + 512);
    at += 512;
    if (block.every((byte) => byte === 0)) break;
    const expected = octal(block.subarray(148, 156));
    let actual = 0;
    for (let n = 0; n < 512; n++) actual += n >= 148 && n < 156 ? 32 : block[n];
    if (actual !== expected) throw new Error('Invalid tar checksum.');
    const size = octal(block.subarray(124, 136)),
      type = String.fromCharCode(block[156] || 48);
    if (at + size > tar.length) throw new Error('Truncated tar payload.');
    const body = tar.subarray(at, at + size);
    at += Math.ceil(size / 512) * 512;
    if (type === 'x' || type === 'g') {
      const data = pax(body);
      if (type === 'g') global = { ...global, ...data };
      else extra = data;
      continue;
    }
    const prefix = string(block.subarray(345, 500));
    const name =
      extra.path ??
      global.path ??
      [prefix, string(block.subarray(0, 100))].filter(Boolean).join('/');
    extra = {};
    if (type === '5') continue;
    if (
      type !== '0' ||
      !name.startsWith('package/') ||
      name.includes('\\') ||
      name.split('/').some((part) => !part || part === '.' || part === '..')
    )
      throw new Error(`Unsafe archive entry: ${name}`);
    const portable = name.normalize('NFC').toLowerCase();
    if (destinations.has(portable))
      throw new Error(`Duplicate archive entry: ${name}`);
    destinations.add(portable);
    files.set(name, {
      bytes: Buffer.from(body),
      mode: octal(block.subarray(100, 108)),
    });
  }
  return files;
}
function frontmatter(bytes) {
  const source = bytes.toString('utf8'),
    match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(source);
  if (!match) throw new Error('Missing skill frontmatter.');
  const doc = parseDocument(match[1], {
    uniqueKeys: true,
    prettyErrors: false,
  });
  if (doc.errors.length)
    throw new Error(`Invalid skill YAML (${doc.errors[0].code}).`);
  visit(doc, {
    Alias() {
      throw new Error('YAML alias in skill metadata.');
    },
  });
  return doc.toJS({ maxAliasCount: 0 });
}
export function preparedFiles(root, io = nodeFs) {
  const result = new Map();
  function collect(relative) {
    const absolute = resolve(root, relative);
    checkPath(root, absolute, io);
    const stat = io.lstatSync(absolute);
    if (stat.isDirectory()) {
      for (const name of io.readdirSync(absolute).sort())
        collect(`${relative}/${name}`);
    } else {
      regular(absolute, io);
      result.set(`package/${relative}`, Buffer.from(io.readFileSync(absolute)));
    }
  }
  collect('dist');
  collect('README.md');
  collect('LICENSE');
  return result;
}
export function inspectArchive(bytes, expected, prepared) {
  const files = readArchive(bytes),
    pkgEntry = files.get('package/package.json');
  if (!pkgEntry) throw new Error('Archive has no package metadata.');
  const pkg = JSON.parse(pkgEntry.bytes.toString('utf8')),
    name = pkg.name?.split('/')[1];
  inspectMetadata(pkg, name);
  if (pkg.name !== expected.name || pkg.version !== expected.version)
    throw new Error('Archive identity does not match the reviewed candidate.');
  const stable = (value) =>
    JSON.stringify(value, function (_key, item) {
      return item && typeof item === 'object' && !Array.isArray(item)
        ? Object.fromEntries(
            Object.entries(item).sort(([a], [b]) => a.localeCompare(b)),
          )
        : item;
    });
  for (const field of [
    'type',
    'imports',
    'exports',
    'bin',
    'engines',
    'dependencies',
    'optionalDependencies',
    'bundleDependencies',
    'bundledDependencies',
    'os',
    'cpu',
    'libc',
    'main',
    'files',
    'publishConfig',
    'license',
    'scripts',
    'private',
  ]) {
    if (stable(pkg[field]) !== stable(expected[field]))
      throw new Error(`Archive runtime/publication metadata differs: ${field}`);
  }
  for (const file of [
    'package/README.md',
    'package/LICENSE',
    `package/${pkg.bin[name]}`,
  ])
    if (!files.has(file)) throw new Error(`Missing delivery file: ${file}`);
  const bin = files.get(`package/${pkg.bin[name]}`);
  if (
    !bin.bytes.toString('utf8').startsWith('#!/usr/bin/env node\n') ||
    (bin.mode & 0o444) === 0 ||
    (bin.mode & 0o7000) !== 0
  )
    throw new Error(
      'Executable shebang/readability or safe archive mode is invalid.',
    );
  // npm bin-links supplies executable permissions and platform shims at install.
  // A native Windows npm tarball may record 0644 even for a declared bin.
  const prefix =
    name === 'agentscli'
      ? 'package/dist/assets/skills/'
      : 'package/dist/assets/.agents/skills/';
  const actual = [...files.keys()]
    .filter(
      (path) =>
        path.startsWith(prefix) &&
        path.slice(prefix.length).split('/').length === 2 &&
        basename(path) === 'SKILL.md',
    )
    .map((path) => path.slice(prefix.length).split('/')[0])
    .sort();
  if (JSON.stringify(actual) !== JSON.stringify([...names[name]].sort()))
    throw new Error('Incorrect operational skill inventory.');
  const dependencies = new Map();
  for (const skill of names[name]) {
    const base = `${prefix}${skill}/`,
      entry = files.get(`${base}SKILL.md`),
      data = frontmatter(entry.bytes);
    if (
      data.name !== skill ||
      !data.description?.trim() ||
      data.license !== 'MIT' ||
      data.compatibility !== 'Requires Node.js >= 22.' ||
      data.metadata?.generatedBy !== pkg.name ||
      data.metadata?.generatorVersion !== pkg.version ||
      Object.values(data.metadata).some((value) => typeof value !== 'string')
    )
      throw new Error(`Invalid or stale generated skill metadata: ${skill}`);
    if (data.requires !== undefined)
      throw new Error('Root skill requires is not standard frontmatter.');
    if (
      Object.hasOwn(data.metadata, 'requires') ||
      files.has(`${base}requires.yml`)
    )
      throw new Error(`Unsupported skill dependency declaration: ${skill}`);
    const config = files.get(`${base}agentscli-skill.yml`);
    const pointer = data.metadata.agentscli;
    if (
      (pointer === undefined && config) ||
      (pointer !== undefined && (pointer !== 'agentscli-skill.yml' || !config))
    )
      throw new Error(
        `Missing or undeclared skill configuration file: ${skill}`,
      );
    dependencies.set(
      skill,
      config
        ? skillConfiguration(config.bytes, `${base}agentscli-skill.yml`)
        : [],
    );
    walk(tree(header(entry.bytes.toString('utf8')).body), (node) => {
      if (node.type === 'html' && /agentscli:requires/u.test(node.value))
        throw new Error(`Obsolete skill dependency comment: ${skill}`);
    });
  }
  const visited = new Set();
  function checkDependencies(skill) {
    if (visited.has(skill)) return;
    visited.add(skill);
    for (const ref of dependencies.get(skill)) {
      if (ref.source !== 'local' || !dependencies.has(ref.id))
        throw new Error(
          `Missing packaged skill dependency: ${skill} requires ${ref.source}:${ref.id}`,
        );
      checkDependencies(ref.id);
    }
  }
  for (const skill of names[name]) checkDependencies(skill);
  const support =
    name === 'agentscli'
      ? {
          'agentscli-write-conventions': ['scripts/check.mjs'],
          'agentscli-edit-agents': ['scripts/check.mjs'],
          'agentscli-build-agents': [
            'scripts/build-agents.mjs',
            'scripts/lib/index.mjs',
          ],
          'agentscli-manage-hub-imports': [
            'scripts/hub-imports.mjs',
            'scripts/contracts.mjs',
            'scripts/git.mjs',
          ],
        }
      : Object.fromEntries(
          names[name].map((skill) => [
            skill,
            [
              'scripts/support.mjs',
              skill === 'agentscli-hub-publish'
                ? 'scripts/release.mjs'
                : 'scripts/validate.mjs',
            ],
          ]),
        );
  for (const [skill, entries] of Object.entries(support))
    for (const entry of entries)
      if (!files.has(`${prefix}${skill}/${entry}`))
        throw new Error(`Missing runtime closure: ${skill}/${entry}`);
  if (name === 'agentscli-hub') {
    for (const file of [
      'package/dist/runtime.js',
      'package/dist/assets/agentscli-hub.yml',
      'package/dist/assets/AGENTS.md',
      'package/dist/assets/docs/conventions/resource-authoring.md',
    ])
      if (!files.has(file))
        throw new Error(`Missing hub scaffold/runtime: ${file}`);
  }
  if (prepared) {
    const expectedPaths = [...prepared.keys(), 'package/package.json'].sort();
    if (
      JSON.stringify([...files.keys()].sort()) !== JSON.stringify(expectedPaths)
    )
      throw new Error(
        'Archive inventory differs from the reviewed prepared package.',
      );
    for (const [file, content] of prepared)
      if (!files.get(file).bytes.equals(content))
        throw new Error(
          `Archive bytes differ from the reviewed prepared package: ${file}`,
        );
  }
  if (name === 'agentscli') {
    for (const [language, convention] of [
      ['en', 'project-context'],
      ['pt-br', 'contexto-do-projeto'],
    ]) {
      const main = files.get(
        `package/dist/assets/templates/${language}/AGENTS.tpl.md`,
      );
      const source = files.get(
        `package/dist/assets/templates/${language}/conventions/${convention}.tpl.md`,
      );
      if (!main || !source)
        throw new Error(`Missing locale templates: ${language}`);
      const parsed = header(source.bytes.toString('utf8'));
      if (
        !parsed.value ||
        Object.keys(parsed.value).join(',') !== 'trigger' ||
        typeof parsed.value.trigger !== 'string' ||
        !parsed.value.trigger.trim() ||
        (parsed.body.match(/^#\s+[^\n]+$/gmu) ?? []).length !== 1
      )
        throw new Error(`Invalid locale convention: ${language}`);
      if (
        (
          main.bytes
            .toString('utf8')
            .match(/^<!-- agentscli:conventions -->$/gmu) ?? []
        ).length !== 1
      )
        throw new Error(`Invalid locale discovery marker: ${language}`);
    }
  }
  for (const path of files.keys()) {
    if (
      /^package\/(?:tests|openspec|\.agents|src)\//u.test(path) ||
      path === 'package/agentscli.yml' ||
      /agentscli-adm-/u.test(path)
    )
      throw new Error(`Repository-only material in archive: ${path}`);
    if (
      path.startsWith(prefix) &&
      /(?:\/node_modules\/|\.ts$|\.map$)/u.test(path)
    )
      throw new Error(`Unclosed or source-only skill support: ${path}`);
  }
  return {
    name: pkg.name,
    version: pkg.version,
    tag: `${name}-v${pkg.version}`,
    files: files.size,
    integrity: `sha512-${createHash('sha512').update(bytes).digest('base64')}`,
  };
}
