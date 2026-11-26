import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import {
  EngineError,
  CONVENTION_ROOT,
  PRODUCT_SKILLS,
  validPackageVersion,
} from './contracts.mjs';
import { decode, frontmatter } from './markdown.mjs';
import { containedPath, portableKey, uniquePaths } from './paths.mjs';
import { assertProjectTarget, disk, inspect, walk } from './io.mjs';
import { render } from './render.mjs';
import { validateResources } from './content.mjs';
import { validateProductResources } from './resources.mjs';
const compareKeys = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const bytes = (text) => new TextEncoder().encode(text);
export const equalBytes = (a, b) =>
  a.length === b.length && a.every((value, index) => value === b[index]);
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
      `Missing source: ${path}. Verify project resources before retrying.`,
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
    for (const [relative, content] of Object.entries(files).sort(([a], [b]) =>
      a === 'SKILL.md' ? -1 : b === 'SKILL.md' ? 1 : compareKeys(a, b),
    ))
      compare(`${directory}/${relative}`, content, prospective);
  };
  return { effects, compare, tree };
}
function installedIdentity(io, root, id) {
  const path = `.agents/skills/${id}/SKILL.md`;
  if (!inspect(io, root, path, 'file')) return undefined;
  try {
    const fields = frontmatter(
      decode(read(io, root, path), path),
      path,
    )?.fields;
    return (
      fields?.name === id &&
      fields.metadata?.generatedBy === '@devel-solid/agentscli' &&
      validPackageVersion(fields.metadata?.generatorVersion)
    );
  } catch {
    return false;
  }
}
function installSkills(io, root, command, resources, tree) {
  validateProductResources(resources);
  const installed = PRODUCT_SKILLS.map((id) => {
    const path = `.agents/skills/${id}`;
    const exists = inspect(io, root, path, 'directory');
    return {
      id,
      path,
      exists,
      identity: exists ? installedIdentity(io, root, id) : undefined,
    };
  });
  const recognized = installed.some(({ identity }) => identity === true);
  for (const { path, exists, identity } of installed)
    if (
      exists &&
      (identity === false ||
        (identity === undefined &&
          !recognized &&
          io.names(containedPath(root, path)).length))
    )
      throw new EngineError(
        'SKILL_CONFLICT',
        'Skill ownership is ambiguous. Preserve or move this tree before running agentscli init.',
        2,
        path,
      );
  if (command === 'update' && !recognized)
    throw new EngineError(
      'NOT_INITIALIZED',
      'No installed product skill was recognized. Run agentscli init first.',
    );
  for (const { id, path } of installed) tree(path, resources.skills[id]);
}
export function plan(io, root, command, resources) {
  assertProjectTarget(io, root);
  const { effects, compare, tree } = effectBuilder(io, root);
  if (command === 'init' || command === 'update') {
    installSkills(io, root, command, resources, tree);
    if (command === 'init' && !inspect(io, root, CONVENTION_ROOT, 'directory'))
      effects.unshift({
        path: CONVENTION_ROOT,
        action: 'create',
        directory: true,
      });
    return effects;
  }

  const conventions = walk(io, root, CONVENTION_ROOT)
    .filter((path) => path.endsWith('.md'))
    .sort((a, b) => compareKeys(portableKey(a), portableKey(b)))
    .map((path) => ({
      path,
      text: decode(read(io, root, path), path),
    }));
  uniquePaths(conventions.map((c) => c.path));
  const skills = [];
  if (inspect(io, root, '.agents/skills', 'directory'))
    for (const id of io.names(containedPath(root, '.agents/skills')).sort()) {
      const directory = `.agents/skills/${id}`;
      const managed = PRODUCT_SKILLS.includes(id);
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
  // Input validation does not plan or inspect an index replacement.
  if (command === 'validate') return effects;
  const documents = render(conventions);
  for (const [path, text] of documents) {
    const existing = inspect(io, root, path, 'file');
    if (
      path === 'AGENTS.md' &&
      existing &&
      !isGenerated(io.read(containedPath(root, path)))
    )
      throw new EngineError(
        'DOCUMENT_CONFLICT',
        'Root AGENTS.md is not owned by @devel-solid/agentscli. Preserve its content outside the generated index before synchronization.',
        2,
        path,
      );
    compare(path, bytes(text));
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
