import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import {
  EngineError,
  CONFIG_PATH,
  TEMPLATE_ROOT,
  CONVENTION_ROOT,
  OUTPUT_ROOT,
  MANIFEST,
  PRODUCT_SKILLS,
  defaultManifest,
  language,
  parseManifest,
  serializeManifest,
} from './manifest.mjs';
import { decode, GENERATED } from './markdown.mjs';
import { containedPath, portableKey, uniquePaths } from './paths.mjs';
import { assertClientContext, disk, inspect, walk } from './io.mjs';
import { render } from './render.mjs';
import { loadHub, validateHubSnapshot, hubResources } from './hub.mjs';
import { validateResources } from './content.mjs';
const compareKeys = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const bytes = (text) => new TextEncoder().encode(text);
export const equalBytes = (a, b) =>
  a.length === b.length && a.every((value, index) => value === b[index]);
export const isGenerated = (content) =>
  Buffer.from(content).toString('utf8').split(/\r?\n/u, 1)[0] === GENERATED;
export function loadResources() {
  // The CLI resolves its own installed asset engine, never a mutable project copy.
  const root = fileURLToPath(new URL('../../../../', import.meta.url));
  function tree(directory) {
    if (!inspect(disk, root, directory, 'directory'))
      throw new EngineError(
        'PACKAGE_RESOURCE',
        `Missing package resource: ${directory}.`,
        3,
      );
    return Object.fromEntries(
      walk(disk, root, directory).map((path) => [
        path.slice(directory.length + 1),
        disk.read(containedPath(root, path)),
      ]),
    );
  }
  return {
    templates: { en: tree('templates/en'), 'pt-br': tree('templates/pt-br') },
    skills: Object.fromEntries(
      PRODUCT_SKILLS.map((name) => [name, tree(`skills/${name}`)]),
    ),
  };
}
export function read(io, root, path) {
  if (!inspect(io, root, path, 'file'))
    throw new EngineError(
      'SOURCE_MISSING',
      `Missing source: ${path}. Use agentscli apply to restore setup.`,
      2,
      path,
    );
  return io.read(containedPath(root, path));
}
export function directoryPaths(files) {
  const paths = new Set();
  for (const file of files) {
    const parts = file.split('/');
    for (let i = 1; i < parts.length; i++)
      paths.add(parts.slice(0, i).join('/'));
  }
  return paths;
}
export function allDirectories(io, root, directory) {
  if (!inspect(io, root, directory, 'directory')) return [];
  const result = [];
  for (const name of io.names(containedPath(root, directory))) {
    const path = `${directory}/${name}`;
    if (inspect(io, root, path)?.kind === 'directory')
      result.push(...allDirectories(io, root, path), path);
  }
  return result;
}
function effectBuilder(io, root) {
  const effects = [];
  const compare = (path, content, preserve = false, gitMode, boundary = io) => {
    const existing = inspect(boundary, root, path, 'file');
    if (existing && preserve) return;
    const previous = existing
      ? boundary.read(containedPath(root, path))
      : undefined;
    const modeDrift =
      existing &&
      gitMode &&
      io.supportsMode &&
      (existing.mode & 0o111) !== (gitMode === '100755' ? 0o111 : 0);
    if (!existing || !equalBytes(previous, content) || modeDrift)
      effects.push({
        path,
        action: existing ? 'update' : 'create',
        content,
        previous,
        ...(gitMode
          ? { gitMode, ...(existing ? { previousMode: existing.mode } : {}) }
          : {}),
      });
  };
  const remove = (path) => {
    if (inspect(io, root, path, 'file'))
      effects.push({
        path,
        action: 'delete',
        previous: io.read(containedPath(root, path)),
      });
  };
  const tree = (directory, files, descriptors = {}) => {
    uniquePaths(Object.keys(files));
    const rootInfo = inspect(io, root, directory);
    const expected = new Set(
      Object.keys(files).map((p) => `${directory}/${p}`),
    );
    const existingFiles =
      rootInfo?.kind === 'file' ? [directory] : walk(io, root, directory);
    const existingDirectories =
      rootInfo?.kind === 'directory'
        ? [...allDirectories(io, root, directory), directory]
        : [];
    const expectedDirectories = directoryPaths([...expected]);
    const removedFiles = existingFiles.filter((p) => !expected.has(p));
    const removedDirectories = existingDirectories.filter(
      (p) => !expectedDirectories.has(p),
    );
    for (const path of removedFiles) remove(path);
    for (const path of removedDirectories)
      effects.push({ path, action: 'delete', directory: true });
    const removed = new Set(
      [...removedFiles, ...removedDirectories].map((p) =>
        containedPath(root, p),
      ),
    );
    const hidden = (absolute) =>
      [...removed].some(
        (p) =>
          absolute === p ||
          absolute.startsWith(p + '/') ||
          absolute.startsWith(p + '\\'),
      );
    const prospective = {
      ...io,
      info: (absolute) => (hidden(absolute) ? undefined : io.info(absolute)),
      names: (absolute) =>
        io.names(absolute).filter((name) => !hidden(join(absolute, name))),
    };
    for (const [relative, content] of Object.entries(files))
      compare(
        `${directory}/${relative}`,
        content,
        false,
        descriptors[relative]?.gitMode,
        prospective,
      );
  };
  return { effects, compare, remove, tree };
}
export function plan(
  io,
  root,
  command,
  resources,
  selectedLanguage,
  overrides = {},
) {
  assertClientContext(io, root);
  if (inspect(io, root, MANIFEST, 'file'))
    throw new EngineError(
      'MIGRATION_REQUIRED',
      'Preview agentscli apply --migrate --dry-run, then repeat agentscli apply --migrate.',
      2,
      MANIFEST,
    );
  const applying = command === 'apply';
  const stored = inspect(io, root, CONFIG_PATH, 'file')
    ? parseManifest(decode(read(io, root, CONFIG_PATH), CONFIG_PATH))
    : undefined;
  if (!applying && !stored && !overrides.manifest) read(io, root, CONFIG_PATH);
  const manifest =
    overrides.manifest ??
    (selectedLanguage === undefined
      ? (stored ?? defaultManifest())
      : { ...stored, ...defaultManifest(selectedLanguage) });
  // Overrides are accepted only after the same strict configuration validation.
  parseManifest(serializeManifest(manifest));
  const accepted = Object.hasOwn(overrides, 'hub')
    ? overrides.hub
      ? validateHubSnapshot(manifest, overrides.hub)
      : undefined
    : loadHub(io, root, manifest);
  if (!!manifest.hub !== !!accepted)
    throw new EngineError(
      'HUB_CONFIG',
      'Hub configuration requires its validated snapshot.',
    );
  const previous = Object.hasOwn(overrides, 'previousHub')
    ? overrides.previousHub
    : accepted;
  const managedOld = new Set(previous?.lock.skills ?? []);
  inspect(io, root, TEMPLATE_ROOT, 'directory');
  inspect(io, root, OUTPUT_ROOT, 'directory');
  const builder = effectBuilder(io, root),
    { effects, compare, tree, remove } = builder;
  const virtual = new Map();
  for (const path of walk(io, root, CONVENTION_ROOT))
    if (path.endsWith('.tpl.md')) virtual.set(path, read(io, root, path));
  const main = `${TEMPLATE_ROOT}/AGENTS.tpl.md`;
  if (inspect(io, root, main, 'file')) virtual.set(main, read(io, root, main));
  const initialized = !!stored || virtual.has(main);
  if (applying) {
    if (!resources)
      throw new EngineError(
        'PACKAGE_RESOURCE',
        'Apply requires installed package assets.',
        3,
      );
    if (
      Object.keys(resources.skills).sort().join('\n') !==
      [...PRODUCT_SKILLS].sort().join('\n')
    )
      throw new EngineError(
        'PACKAGE_RESOURCE',
        'Expected exactly four consumer operational skill assets.',
        3,
      );
    const defaults = resources.templates[manifest.language];
    if (!defaults?.['AGENTS.tpl.md'])
      throw new EngineError('PACKAGE_RESOURCE', 'Missing main template.', 3);
    for (const [relative, content] of Object.entries(defaults).sort(
      ([a], [b]) => compareKeys(a, b),
    )) {
      const path = `${TEMPLATE_ROOT}/${relative}`;
      if ((path === main || !initialized) && !virtual.has(path)) {
        inspect(io, root, path, 'file');
        virtual.set(path, content);
        compare(path, content);
      }
    }
  }
  if (!virtual.has(main))
    throw new EngineError(
      'SOURCE_MISSING',
      `Missing main template: ${main}.`,
      2,
      main,
    );
  const localConventions = [...virtual]
    .filter(([path]) => path !== main)
    .sort(([a], [b]) => compareKeys(portableKey(a), portableKey(b)))
    .map(([path, content]) => ({
      id: path.slice(CONVENTION_ROOT.length + 1, -7),
      source: 'local',
      path,
      output: `${OUTPUT_ROOT}/${path.slice(CONVENTION_ROOT.length + 1, -7)}.md`,
      text: decode(content, path),
    }));
  const shared = accepted
    ? hubResources(accepted)
    : { conventions: [], skills: [] };
  const conventions = [...localConventions, ...shared.conventions].sort(
    (a, b) => compareKeys(portableKey(a.output), portableKey(b.output)),
  );
  uniquePaths(conventions.map((c) => c.output));
  const skills = [];
  if (inspect(io, root, '.agents/skills', 'directory'))
    for (const id of io.names(containedPath(root, '.agents/skills')).sort()) {
      const directory = `.agents/skills/${id}`;
      inspect(io, root, directory, 'directory');
      if (
        PRODUCT_SKILLS.includes(id) ||
        id === 'agentscli-update-agents' ||
        managedOld.has(id)
      )
        continue;
      const files = Object.fromEntries(
        walk(io, root, directory).map((p) => [
          p.slice(directory.length + 1),
          read(io, root, p),
        ]),
      );
      if (files['SKILL.md'])
        skills.push({ id, source: 'local', path: directory, files });
    }
  if (applying)
    for (const id of PRODUCT_SKILLS)
      skills.push({
        id,
        source: 'local',
        path: `.agents/skills/${id}`,
        files: resources.skills[id],
      });
  else
    for (const id of PRODUCT_SKILLS)
      if (inspect(io, root, `.agents/skills/${id}/SKILL.md`, 'file'))
        skills.push({
          id,
          source: 'local',
          path: `.agents/skills/${id}`,
          files: {
            'SKILL.md': bytes(
              `---\nname: ${id}\ndescription: Installed operational resource.\n---\n`,
            ),
          },
        });
  for (const skill of shared.skills) {
    if (!managedOld.has(skill.id) && inspect(io, root, skill.installedPath))
      throw new EngineError(
        'SKILL_COLLISION',
        `Unrelated destination occupies imported skill ${skill.id}.`,
        2,
        skill.installedPath,
      );
    skills.push(skill);
  }
  validateResources({ conventions, skills });
  const documents = render(
    { source: main, text: decode(virtual.get(main), main) },
    conventions.map((c) => ({
      source: c.path,
      output: c.output,
      text: c.text,
    })),
    manifest.language,
  );
  for (const [path, text] of documents) {
    const existing = inspect(io, root, path, 'file');
    if (
      path === 'AGENTS.md' &&
      existing &&
      !isGenerated(io.read(containedPath(root, path)))
    )
      throw new EngineError(
        'DOCUMENT_CONFLICT',
        'A handwritten root AGENTS.md must be preserved in its template before applying.',
        2,
        path,
      );
    compare(path, bytes(text));
  }
  for (const path of walk(io, root, OUTPUT_ROOT))
    if (!documents.has(path)) remove(path);
  if (applying) {
    for (const id of PRODUCT_SKILLS)
      tree(`.agents/skills/${id}`, resources.skills[id]);
    tree('.agents/skills/agentscli-update-agents', {});
  }
  for (const skill of shared.skills) {
    const prefix = `skills/${skill.id}/`;
    const descriptors = Object.fromEntries(
      Object.entries(accepted.lock.files)
        .filter(([p]) => p.startsWith(prefix))
        .map(([p, d]) => [p.slice(prefix.length), d]),
    );
    tree(skill.installedPath, skill.files, descriptors);
  }
  for (const id of managedOld)
    if (!shared.skills.some((s) => s.id === id))
      tree(`.agents/skills/${id}`, {});
  if (
    applying &&
    !overrides.manifest &&
    (!stored || stored.language !== manifest.language)
  )
    compare(CONFIG_PATH, bytes(serializeManifest(manifest)));
  uniquePaths(
    effects
      .filter((e) => !e.directory && e.action !== 'delete')
      .map((e) => e.path),
  );
  uniquePaths(
    effects
      .filter((e) => !e.directory && e.action === 'delete')
      .map((e) => e.path),
  );
  return effects;
}
export function managedSkillEffects(io, root, resources) {
  const builder = effectBuilder(io, root);
  for (const [id, files] of Object.entries(resources.skills))
    builder.tree(`.agents/skills/${id}`, files);
  return builder.effects;
}
