import { join, dirname, sep } from 'node:path';
import {
  CONVENTION_ROOT,
  EngineError,
  MANIFEST,
  OUTPUT_ROOT,
  parseLegacyManifest,
} from './manifest.mjs';
import { assertClientContext, inspect, walk } from './io.mjs';
import {
  decode,
  convertLegacyConvention,
  hasLegacyCard,
  validateLegacyConvention,
  validateConventionFilename,
} from './markdown.mjs';
import { rebaseLinks } from './migration-links.mjs';
import { containedPath, portableKey, uniquePaths } from './paths.mjs';
import {
  allDirectories,
  equalBytes,
  isGenerated,
  isGeneratedConvention,
  plan,
  read,
} from './plan.mjs';
import { render } from './render.mjs';
import { validateResources } from './content.mjs';
const bytes = (text) => new TextEncoder().encode(text);
function conflict(path, message) {
  throw new EngineError('MIGRATION_CONFLICT', `${path}: ${message}`, 2, path);
}
function raw(content, path) {
  decode(content, path);
  return new TextDecoder('utf-8', {
    fatal: true,
    ignoreBOM: true,
  }).decode(content);
}
function snapshot(io, root, path) {
  return inspect(io, root, path, 'file') ? read(io, root, path) : undefined;
}
function verify(io, root, expected) {
  for (const [path, content] of expected) {
    const current = snapshot(io, root, path);
    if (
      !content !== !current ||
      (content && current && !equalBytes(content, current))
    )
      throw new EngineError(
        'MIGRATION_CHANGED',
        `${path} changed after migration planning. Repeat apply --migrate with the same options.`,
        3,
        path,
      );
  }
}
function ordered(paths) {
  return paths.sort((a, b) =>
    portableKey(a) < portableKey(b)
      ? -1
      : portableKey(a) > portableKey(b)
        ? 1
        : 0,
  );
}
function newSources(io, root) {
  return ordered(
    walk(io, root, CONVENTION_ROOT).filter((path) => path.endsWith('.tpl.md')),
  );
}
function withoutLegacy(io, root) {
  const legacy = containedPath(root, MANIFEST);
  return {
    ...io,
    info: (path) => (path === legacy ? undefined : io.info(path)),
    names: (path) =>
      io.names(path).filter((name) => join(path, name) !== legacy),
  };
}
function prospectiveFiles(io, root, files) {
  const virtual = new Map(
    [...files].map(([file, content]) => [containedPath(root, file), content]),
  );
  return {
    ...io,
    info: (absolute) =>
      virtual.has(absolute)
        ? { kind: 'file', nlink: 1 }
        : (io.info(absolute) ??
          ([...virtual.keys()].some((file) => file.startsWith(absolute + sep))
            ? { kind: 'directory', nlink: 1 }
            : undefined)),
    read: (absolute) => virtual.get(absolute) ?? io.read(absolute),
    names: (absolute) => [
      ...new Set([
        ...(io.info(absolute)?.kind === 'directory' ? io.names(absolute) : []),
        ...[...virtual.keys()]
          .filter((file) => file.startsWith(absolute + sep))
          .map((file) => file.slice(absolute.length + 1).split(sep)[0]),
      ]),
    ],
  };
}
export function planMigration(io, root, resources) {
  assertClientContext(io, root);
  const legacyBytes = snapshot(io, root, MANIFEST);
  if (!legacyBytes) {
    const converted = new Map();
    for (const path of walk(io, root, CONVENTION_ROOT).filter((p) =>
      p.endsWith('.tpl.md'),
    )) {
      const content = read(io, root, path),
        text = decode(content, path);
      if (hasLegacyCard(text, path))
        converted.set(path, bytes(convertLegacyConvention(text, path)));
    }
    if (!converted.size) {
      plan(io, root, 'validate');
      return [];
    }
    const overlay = {
      ...io,
      read: (path) => {
        for (const [relative, content] of converted)
          if (path === containedPath(root, relative)) return content;
        return io.read(path);
      },
    };
    const effects = plan(overlay, root, 'apply', resources);
    // Keep legacy cards until managed effects finish, so interrupted conversion
    // remains explicitly recognizable without an ownership journal.
    return [
      ...effects,
      ...[...converted].map(([path, content]) => ({
        path,
        action: 'update',
        content,
        previous: read(io, root, path),
      })),
    ];
  }
  const legacy = parseLegacyManifest(decode(legacyBytes, MANIFEST));
  const oldMain = `${legacy.templates_dir}/AGENTS.tpl.md`;
  const oldSources = ordered(
    walk(io, root, legacy.templates_dir).filter(
      (path) => path.endsWith('.tpl.md') && path !== oldMain,
    ),
  );
  uniquePaths(oldSources);
  const toNewSource = (source) =>
    `${CONVENTION_ROOT}/${source.slice(legacy.templates_dir.length + 1)}`;
  const toOldSource = (source) =>
    `${legacy.templates_dir}/${source.slice(CONVENTION_ROOT.length + 1)}`;
  const toOldOutput = (source) =>
    `${legacy.conventions_dir}/${source.slice(legacy.templates_dir.length + 1, -7)}.md`;
  const toNewOutput = (source) =>
    `${OUTPUT_ROOT}/${source.slice(CONVENTION_ROOT.length + 1, -7)}.md`;
  const existingNewSources = newSources(io, root);
  const cleaning = existingNewSources.some(
    (source) => !oldSources.includes(toOldSource(source)),
  );
  const inventory = cleaning ? existingNewSources.map(toOldSource) : oldSources;
  const mappings = new Map();
  for (const source of inventory) {
    mappings.set(source, toNewSource(source));
    mappings.set(toOldOutput(source), toNewOutput(toNewSource(source)));
  }
  if (oldSources.some((source) => !inventory.includes(source)))
    conflict(
      legacy.templates_dir,
      'Remaining legacy sources are absent from the published new inventory.',
    );
  const expectedSourceNames = ordered(inventory.map(toNewSource));
  uniquePaths(expectedSourceNames);
  if (
    existingNewSources.some((source) => !expectedSourceNames.includes(source))
  )
    conflict(CONVENTION_ROOT, 'New sources do not belong to this migration.');
  const inputs = new Map([[MANIFEST, legacyBytes]]);
  const transferred = new Map();
  const original = new Map();
  for (const source of oldSources) {
    const content = read(io, root, source);
    original.set(source, content);
    inputs.set(source, content);
    const destination = toNewSource(source);
    validateConventionFilename(
      validateLegacyConvention(decode(content, source), source).title,
      source,
    );
    const rebased = rebaseLinks(
      raw(content, source),
      source,
      toOldOutput(source),
      toNewOutput(destination),
      mappings,
    );
    transferred.set(
      destination,
      bytes(convertLegacyConvention(rebased, destination)),
    );
  }
  if (cleaning) {
    for (const source of existingNewSources) {
      const content = read(io, root, source),
        converted = transferred.get(source);
      if (converted && !equalBytes(content, converted))
        conflict(
          source,
          'The remaining old source does not convert to this new source.',
        );
      transferred.set(source, content);
    }
  }
  const conventions = expectedSourceNames.map((source) => ({
    source,
    authoredSource: source,
    output: toNewOutput(source),
    text: decode(transferred.get(source), source),
  }));
  validateResources({
    conventions: conventions.map((c) => ({
      id: c.source.slice(CONVENTION_ROOT.length + 1, -7),
      source: 'local',
      path: c.source,
      output: c.output,
      text: c.text,
    })),
    skills: [],
  });
  const projected = prospectiveFiles(
    withoutLegacy(io, root),
    root,
    transferred,
  );
  const normalEffects = plan(projected, root, 'apply', resources);
  const documents = render(
    conventions.sort((a, b) =>
      portableKey(a.output) < portableKey(b.output)
        ? -1
        : portableKey(a.output) > portableKey(b.output)
          ? 1
          : 0,
    ),
  );
  const newDocuments = new Map(
    [...documents].map(([path, text]) => [path, bytes(text)]),
  );
  const oldConventions = oldSources.map((source) => ({
    source,
    output: toOldOutput(source),
    text: decode(original.get(source), source),
  }));
  const oldDocuments = render(oldConventions, {
    legacyLayout: true,
  });
  oldDocuments.delete('AGENTS.md');
  const oldOutputFiles = walk(io, root, legacy.conventions_dir);
  for (const path of new Set([
    ...oldOutputFiles,
    ...inventory.map(toOldOutput),
  ])) {
    const content = snapshot(io, root, path);
    if (!content) continue;
    if (oldDocuments.has(path)) {
      const converted = newDocuments.get(mappings.get(path));
      if (
        !isGeneratedConvention(content) ||
        (!equalBytes(content, bytes(oldDocuments.get(path))) &&
          !(converted && equalBytes(content, converted)))
      )
        conflict(
          path,
          'Legacy generated output was edited directly. Reconcile useful content in its template first.',
        );
    }
    if (mappings.has(path) && !isGeneratedConvention(content))
      conflict(path, 'A manual document occupies an expected legacy output.');
    inputs.set(path, content);
  }
  const effects = [];
  const prepared = new Map(transferred);
  for (const [path, content] of newDocuments) prepared.set(path, content);
  for (const [name, files] of Object.entries(resources.skills))
    for (const [relative, content] of Object.entries(files))
      prepared.set(`.agents/skills/${name}/${relative}`, content);
  const skills = normalEffects.filter(
    (effect) => !newDocuments.has(effect.path),
  );
  for (const effect of skills) {
    if (effect.directory) continue;
    if (effect.action !== 'delete') prepared.set(effect.path, effect.content);
    else if (
      !skills.some(
        (other) =>
          other.action !== 'delete' && other.path.startsWith(effect.path + '/'),
      )
    )
      prepared.set(effect.path, undefined);
  }
  function prepare(path, content, rootDocument = false) {
    const previous = snapshot(io, root, path);
    if (previous && !equalBytes(previous, content)) {
      if (!rootDocument || !isGenerated(previous))
        conflict(
          path,
          'Occupied new destination differs from its deterministic migration result.',
        );
    }
    if (!previous || !equalBytes(previous, content))
      effects.push({
        path,
        action: previous ? 'update' : 'create',
        content,
        previous,
      });
  }
  if (cleaning) {
    const drift = plan(withoutLegacy(io, root), root, 'apply', resources);
    if (drift.length)
      conflict(
        drift[0].path,
        'Published migration destinations or managed skills are incomplete or changed.',
      );
  } else {
    for (const [path, content] of transferred) prepare(path, content);
    for (const [path, content] of newDocuments)
      prepare(path, content, path === 'AGENTS.md');
    for (const path of walk(io, root, OUTPUT_ROOT))
      if (
        path.endsWith('.md') &&
        !newDocuments.has(path) &&
        isGeneratedConvention(read(io, root, path))
      )
        conflict(
          path,
          'Unexpected generated output occupies the new client tree.',
        );
    effects.push(...skills);
  }
  inputs.set('AGENTS.md', newDocuments.get('AGENTS.md'));

  const verifyPrepared = (current, currentRoot) => {
    verify(current, currentRoot, prepared);
    const sources = newSources(current, currentRoot);
    if (
      sources.length !== expectedSourceNames.length ||
      sources.some((path, index) => path !== expectedSourceNames[index])
    )
      throw new EngineError(
        'MIGRATION_CHANGED',
        'New source inventory changed after planning.',
        3,
        CONVENTION_ROOT,
      );
    if (
      plan(withoutLegacy(current, currentRoot), currentRoot, 'apply', resources)
        .length
    )
      throw new EngineError(
        'MIGRATION_CHANGED',
        'Prepared client no longer matches the migration plan.',
        3,
        CONVENTION_ROOT,
      );
  };
  const published = new Map([[MANIFEST, legacyBytes]]);
  const cleanupGuard = (current, currentRoot) => {
    verify(current, currentRoot, published);
    verifyPrepared(current, currentRoot);
    for (const [path, content] of inputs) {
      if (path === 'AGENTS.md' || !content) continue;
      const retained = snapshot(current, currentRoot, path);
      if (retained && !equalBytes(retained, content))
        throw new EngineError(
          'MIGRATION_CHANGED',
          `${path} changed during cleanup.`,
          3,
          path,
        );
    }
  };
  const deleted = new Set();
  for (const path of oldOutputFiles) {
    const previous = read(io, root, path);
    if (path.endsWith('.md') && isGeneratedConvention(previous)) {
      effects.push({
        path,
        action: 'delete',
        previous,
        precondition: cleanupGuard,
      });
      deleted.add(path);
    }
  }
  for (const source of oldSources) {
    effects.push({
      path: source,
      action: 'delete',
      previous: original.get(source),
      precondition: cleanupGuard,
    });
    deleted.add(source);
  }
  const directories = [
    ...new Set([
      legacy.templates_dir,
      legacy.conventions_dir,
      ...allDirectories(io, root, legacy.templates_dir),
      ...allDirectories(io, root, legacy.conventions_dir),
    ]),
  ].sort((a, b) => b.split('/').length - a.split('/').length);
  for (const path of directories) {
    if (!inspect(io, root, path, 'directory')) continue;
    if (
      io
        .names(containedPath(root, path))
        .every((name) => deleted.has(`${path}/${name}`))
    ) {
      effects.push({
        path,
        action: 'delete',
        directory: true,
        precondition: cleanupGuard,
      });
      deleted.add(path);
    }
  }
  const removed = new Map(
    [...deleted]
      .filter((path) => !directories.includes(path))
      .map((path) => [path, undefined]),
  );
  effects.push({
    path: MANIFEST,
    action: 'delete',
    previous: legacyBytes,
    precondition: (current, currentRoot) => {
      cleanupGuard(current, currentRoot);
      verify(current, currentRoot, removed);
      if (
        walk(current, currentRoot, legacy.templates_dir).some(
          (path) => path.endsWith('.tpl.md') && path !== oldMain,
        ) ||
        walk(current, currentRoot, legacy.conventions_dir).some(
          (path) =>
            path.endsWith('.md') &&
            isGeneratedConvention(read(current, currentRoot, path)),
        )
      )
        throw new EngineError(
          'MIGRATION_CHANGED',
          'Legacy inventory changed before final manifest removal.',
          3,
          MANIFEST,
        );
    },
  });
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
