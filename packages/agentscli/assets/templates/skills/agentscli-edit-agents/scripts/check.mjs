import * as nodeFs from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { parseDocument, visit, isAlias } from 'yaml';
const identity = 'agentscli-build-agents';
const fold = (value) => value.normalize('NFC').toLowerCase();
function yaml(text) {
  const document = parseDocument(text, {
    strict: true,
    uniqueKeys: true,
    prettyErrors: false,
  });
  if (document.errors.length || document.warnings.length)
    throw new Error('Invalid YAML metadata/configuration.');
  visit(document, (_key, node) => {
    if (isAlias(node) || node?.tag)
      throw new Error('Aliases and explicit YAML tags are not supported.');
  });
  const value = document.toJS({ maxAliasCount: 0 });
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected YAML mapping.');
  return value;
}
export function isBuildIdentity(text) {
  const match = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(text);
  if (!match) return false;
  const fields = yaml(match[1]);
  return (
    fields.name === identity &&
    typeof fields.description === 'string' &&
    !!fields.description.trim() &&
    fields.license === 'MIT' &&
    fields.compatibility === 'Requires Node.js >= 22.' &&
    fields.metadata?.generatedBy === '@devel-solid/agentscli' &&
    typeof fields.metadata?.generatorVersion === 'string' &&
    /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/u.test(
      fields.metadata.generatorVersion,
    )
  );
}
function safe(file, fs, kind) {
  const absolute = resolve(file),
    chain = [];
  let current = absolute;
  while (true) {
    chain.unshift(current);
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  for (let i = 0; i < chain.length; i++) {
    const path = chain[i],
      stat = fs.lstatSync(path),
      leaf = i === chain.length - 1;
    if (
      stat.isSymbolicLink() ||
      (!leaf && !stat.isDirectory()) ||
      (leaf && (kind === 'file' ? !stat.isFile() : !stat.isDirectory())) ||
      (stat.isFile() && stat.nlink > 1)
    )
      throw new Error(
        'Unsafe linked, aliased, or nonregular skill/configuration path.',
      );
    if (i) {
      const actual = path.slice(chain[i - 1].length).replace(/^[/\\]/u, '');
      if (
        fs
          .readdirSync(chain[i - 1])
          .some((name) => fold(name) === fold(actual) && name !== actual)
      )
        throw new Error(
          'Portable path alias in skill/configuration discovery.',
        );
    }
  }
  return absolute;
}
export function discoverEngine(root, { fs = nodeFs } = {}) {
  root = safe(root, fs, 'directory');
  const directory = safe(join(root, '.agents', 'skills'), fs, 'directory');
  const names = fs.readdirSync(directory);
  if (
    !names.includes(identity) ||
    names.some((name) => fold(name) === identity && name !== identity)
  )
    throw new Error(
      'Restore the canonical local build skill with agentscli apply.',
    );
  const tree = safe(join(directory, identity), fs, 'directory');
  const entry = safe(join(tree, 'SKILL.md'), fs, 'file');
  if (!isBuildIdentity(fs.readFileSync(entry, 'utf8')))
    throw new Error(
      'The local build skill lacks its canonical leading identity and generated provenance; restore it with agentscli apply.',
    );
  return safe(join(tree, 'scripts', 'lib', 'index.mjs'), fs, 'file');
}
export async function check(
  args = process.argv.slice(2),
  { fs = nodeFs, load = (file) => import(pathToFileURL(file).href) } = {},
) {
  try {
    const { values, tokens, positionals } = parseArgs({
      args,
      strict: true,
      allowPositionals: true,
      tokens: true,
      options: { 'repo-root': { type: 'string' }, json: { type: 'boolean' } },
    });
    const names = tokens.filter((t) => t.kind === 'option').map((t) => t.name);
    if (
      positionals.length ||
      new Set(names).size !== names.length ||
      (values['repo-root'] !== undefined && !values['repo-root'].trim())
    )
      throw new Error('Use --repo-root <directory> and optional --json.');
    const root = safe(resolve(values['repo-root'] ?? '.'), fs, 'directory');
    const config = yaml(
      fs.readFileSync(
        safe(join(root, '.agentscli', 'config.yml'), fs, 'file'),
        'utf8',
      ),
    );
    if (
      !['en', 'pt-br'].includes(config.language) ||
      Object.keys(config).some((key) => key !== 'language')
    )
      throw new Error(
        'A valid consumer configuration is required before authoring.',
      );
    for (let current = root; ; current = dirname(current)) {
      for (const marker of ['agentscli-compose.yml']) {
        try {
          fs.lstatSync(join(current, marker));
          throw new Error(
            'Legacy context is incompatible with consumer authoring.',
          );
        } catch (error) {
          if (error.code !== 'ENOENT') throw error;
        }
      }
      const parent = dirname(current);
      if (parent === current) break;
    }
    const engine = await load(discoverEngine(root, { fs }));
    return await engine.execute('validate', { repoRoot: root });
  } catch (error) {
    return {
      exitCode: 2,
      result: {
        schemaVersion: 1,
        command: 'validate',
        ok: false,
        changes: [],
        diagnostics: [{ code: 'AUTHOR_CHECK', message: error.message }],
      },
    };
  }
}
if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  const response = await check();
  process.stdout.write(JSON.stringify(response.result) + '\n');
  process.exitCode = response.exitCode;
}
