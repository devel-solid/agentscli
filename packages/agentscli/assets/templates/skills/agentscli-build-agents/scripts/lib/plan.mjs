import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import {
  EngineError,
  TEMPLATE_ROOT,
  CONVENTION_ROOT,
  OUTPUT_ROOT,
  MANIFEST,
  PRODUCT_SKILLS,
} from './manifest.mjs';
import { decode, frontmatter, GENERATED } from './markdown.mjs';
import { containedPath, portableKey, uniquePaths } from './paths.mjs';
import { assertClientContext, disk, inspect, walk } from './io.mjs';
import { render } from './render.mjs';
import { validateResources } from './content.mjs';
const compareKeys = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const bytes = (text) => new TextEncoder().encode(text);
export const equalBytes = (a, b) =>
  a.length === b.length && a.every((value, index) => value === b[index]);
export const isGeneratedConvention = (content) =>
  Buffer.from(content).toString('utf8').split(/\r?\n/u, 1)[0] === GENERATED;
export function isGenerated(content) {
  try {
    const header = frontmatter(decode(content, 'AGENTS.md'), 'AGENTS.md');
    return (
      !!header &&
      Object.keys(header.fields).length === 1 &&
      header.fields.generatedBy === '@devel-solid/agentscli'
    );
  } catch {
    return false;
  }
}
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
  const compare = (path, content, boundary = io) => {
    const existing = inspect(boundary, root, path, 'file');
    const previous = existing
      ? boundary.read(containedPath(root, path))
      : undefined;
    if (!existing || !equalBytes(previous, content))
      effects.push({
        path,
        action: existing ? 'update' : 'create',
        content,
        previous,
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
  const tree = (directory, files) => {
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
      compare(`${directory}/${relative}`, content, prospective);
  };
  return { effects, compare, remove, tree };
}
export function plan(io, root, command, resources) {
  assertClientContext(io, root);
  if (inspect(io, root, MANIFEST, 'file'))
    throw new EngineError(
      'MIGRATION_REQUIRED',
      'Preview agentscli apply --migrate --dry-run, then repeat agentscli apply --migrate.',
      2,
      MANIFEST,
    );
  const applying = command === 'apply';
  inspect(io, root, TEMPLATE_ROOT, 'directory');
  inspect(io, root, OUTPUT_ROOT, 'directory');
  const builder = effectBuilder(io, root),
    { effects, compare, tree, remove } = builder;
  const virtual = new Map();
  for (const path of walk(io, root, CONVENTION_ROOT))
    if (path.endsWith('.tpl.md')) virtual.set(path, read(io, root, path));
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
        'Expected exactly two consumer operational skill assets.',
        3,
      );
  }

  const localConventions = [...virtual]
    .sort(([a], [b]) => compareKeys(portableKey(a), portableKey(b)))
    .map(([path, content]) => ({
      id: path.slice(CONVENTION_ROOT.length + 1, -7),
      source: 'local',
      path,
      output: `${OUTPUT_ROOT}/${path.slice(CONVENTION_ROOT.length + 1, -7)}.md`,
      text: decode(content, path),
    }));
  const conventions = localConventions.sort((a, b) =>
    compareKeys(portableKey(a.output), portableKey(b.output)),
  );
  uniquePaths(conventions.map((c) => c.output));
  const skills = [];
  if (inspect(io, root, '.agents/skills', 'directory'))
    for (const id of io.names(containedPath(root, '.agents/skills')).sort()) {
      const directory = `.agents/skills/${id}`;
      const managed =
        PRODUCT_SKILLS.includes(id) ||
        ['agentscli-update-agents', 'agentscli-edit-agents'].includes(id);
      const entry = inspect(
        io,
        root,
        directory,
        managed ? 'directory' : undefined,
      );
      if (entry?.kind !== 'directory' || managed) continue;
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
  validateResources({ conventions, skills });
  const documents = render(
    conventions.map((c) => ({
      source: c.path,
      output: c.output,
      text: c.text,
    })),
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
        'Root AGENTS.md is not owned by @devel-solid/agentscli. Preserve its content outside the generated index before applying.',
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
    tree('.agents/skills/agentscli-edit-agents', {});
  }
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
