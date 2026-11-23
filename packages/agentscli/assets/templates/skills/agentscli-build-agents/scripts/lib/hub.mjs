import { createHash } from 'node:crypto';
import {
  EngineError,
  HUB_ROOT,
  exactKeys,
  parseYaml,
  stringifyYaml,
  validateHubConfig,
  RESERVED_SKILLS,
} from './manifest.mjs';
import { inspect, walk } from './io.mjs';
import {
  containedPath,
  portableKey,
  relativePath,
  uniquePaths,
} from './paths.mjs';
import { decode } from './markdown.mjs';
import { validateResources } from './content.mjs';
const fail = (code, message, path) => {
  throw new EngineError(code, message, 2, path);
};
export function canonicalContent(content, representation, path) {
  if (representation === 'bytes') return new Uint8Array(content);
  if (representation !== 'utf8-lf')
    fail('HUB_REPRESENTATION', 'Unknown content representation.', path);
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(
      content,
    );
  } catch {
    fail(
      'HUB_REPRESENTATION',
      'Invalid UTF-8 for recorded text representation.',
      path,
    );
  }
  if (text.includes('\0') || /\r(?!\n)/u.test(text))
    fail('HUB_REPRESENTATION', 'Recorded text contains NUL or lone CR.', path);
  return new TextEncoder().encode(text.replaceAll('\r\n', '\n'));
}
export const sha256 = (content) =>
  createHash('sha256').update(content).digest('hex');
export function validContentVersion(value) {
  if (typeof value !== 'string') return false;
  const match =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/u.exec(
      value,
    );
  return (
    !!match &&
    (!match[4] ||
      match[4]
        .split('.')
        .every((v) => !/^\d+$/u.test(v) || v === '0' || !v.startsWith('0')))
  );
}
export function parseHubLock(text, path = `${HUB_ROOT}/lock.yml`) {
  const lock = parseYaml(text, path);
  exactKeys(
    lock,
    [
      'schemaVersion',
      'repository',
      'commit',
      'hubVersion',
      'conventions',
      'skills',
      'files',
    ],
    [],
    path,
  );
  if (lock.schemaVersion !== 1 || !validContentVersion(lock.hubVersion))
    fail('HUB_LOCK', 'Invalid lock schema or content version.', path);
  validateHubConfig(
    {
      repository: lock.repository,
      commit: lock.commit,
      conventions: lock.conventions,
      skills: lock.skills,
    },
    path,
  );
  if (
    !lock.files ||
    typeof lock.files !== 'object' ||
    Array.isArray(lock.files)
  )
    fail('HUB_LOCK', 'files must be a descriptor mapping.', path);
  uniquePaths(Object.keys(lock.files));
  for (const [file, d] of Object.entries(lock.files)) {
    if (
      relativePath(file) !== file ||
      file.split('/').some((p) => portableKey(p) === '.git')
    )
      fail('HUB_DESCRIPTOR', 'Unsafe descriptor path.', file);
    exactKeys(d, ['representation', 'sha256', 'gitMode'], [], file);
    if (
      !['utf8-lf', 'bytes'].includes(d.representation) ||
      typeof d.sha256 !== 'string' ||
      !/^[0-9a-f]{64}$/u.test(d.sha256) ||
      !['100644', '100755'].includes(d.gitMode)
    )
      fail('HUB_DESCRIPTOR', 'Invalid file descriptor.', file);
  }
  return lock;
}
export const serializeHubLock = (lock) =>
  stringifyYaml(parseHubLock(stringifyYaml(lock)));
export function validateHubSnapshot(config, snapshot) {
  const hub = config.hub ?? config;
  validateHubConfig(hub);
  if (!snapshot?.lock || !snapshot.files)
    fail('HUB_SNAPSHOT', 'An accepted hub snapshot is required.', HUB_ROOT);
  const lock = parseHubLock(stringifyYaml(snapshot.lock));
  for (const key of ['repository', 'commit'])
    if (hub[key] !== lock[key])
      fail(
        'HUB_CONFIG',
        'Configuration and accepted hub lock disagree.',
        HUB_ROOT,
      );
  for (const key of ['conventions', 'skills'])
    if (
      JSON.stringify([...hub[key]].sort()) !==
      JSON.stringify([...lock[key]].sort())
    )
      fail('HUB_CONFIG', `Configuration and lock ${key} disagree.`, HUB_ROOT);
  const files = snapshot.files;
  uniquePaths(Object.keys(files));
  if (
    Object.keys(files).sort().join('\n') !==
    Object.keys(lock.files).sort().join('\n')
  )
    fail(
      'HUB_INVENTORY',
      'Accepted snapshot inventory differs from its lock.',
      HUB_ROOT,
    );
  const canonical = {};
  for (const [path, content] of Object.entries(files)) {
    const allowed =
      path === 'agentscli-hub.yml' ||
      hub.conventions.some((id) => path === `conventions/${id}.tpl.md`) ||
      hub.skills.some((id) => path.startsWith(`skills/${id}/`));
    if (!allowed)
      fail(
        'HUB_INVENTORY',
        `Unexpected or unselected snapshot file: ${path}.`,
        HUB_ROOT,
      );
    canonical[path] = canonicalContent(
      content,
      lock.files[path].representation,
      path,
    );
    if (sha256(canonical[path]) !== lock.files[path].sha256)
      fail(
        'HUB_INTEGRITY',
        `Accepted source integrity differs: ${path}.`,
        `${HUB_ROOT}/${path}`,
      );
  }
  if (!canonical['agentscli-hub.yml'])
    fail('HUB_MANIFEST', 'Missing accepted hub manifest.', HUB_ROOT);
  const manifest = parseYaml(
    decode(canonical['agentscli-hub.yml'], 'agentscli-hub.yml'),
    'agentscli-hub.yml',
  );
  exactKeys(manifest, ['schemaVersion', 'version'], [], 'agentscli-hub.yml');
  if (manifest.schemaVersion !== 1 || manifest.version !== lock.hubVersion)
    fail(
      'HUB_VERSION',
      'Hub manifest and lock content versions disagree.',
      HUB_ROOT,
    );
  const resources = hubResources({ lock, files: canonical });
  validateResources(resources);
  return { lock, files: canonical };
}
export function hubResources(snapshot) {
  const conventions = snapshot.lock.conventions.map((id) => {
    const path = `conventions/${id}.tpl.md`,
      content = snapshot.files[path];
    if (!content)
      fail('HUB_SOURCE', `Missing selected convention ${id}.`, path);
    return {
      id,
      source: 'hub',
      path: `${HUB_ROOT}/${path}`,
      output: `.agentscli/conventions/${id}.md`,
      text: decode(content, path),
    };
  });
  const skills = snapshot.lock.skills.map((id) => ({
    id,
    source: 'hub',
    path: `${HUB_ROOT}/skills/${id}`,
    installedPath: `.agents/skills/${id}`,
    files: Object.fromEntries(
      Object.entries(snapshot.files)
        .filter(([p]) => p.startsWith(`skills/${id}/`))
        .map(([p, b]) => [p.slice(`skills/${id}/`.length), b]),
    ),
  }));
  return { conventions, skills };
}
export function loadHub(io, root, config) {
  const paths = walk(io, root, HUB_ROOT);
  if (!config.hub) {
    if (paths.length)
      fail(
        'HUB_CONFIG',
        'A snapshot exists without configured hub state.',
        HUB_ROOT,
      );
    return undefined;
  }
  const lockPath = `${HUB_ROOT}/lock.yml`;
  if (!inspect(io, root, lockPath, 'file'))
    fail(
      'HUB_SNAPSHOT',
      'Missing accepted hub lock; use explicit hub import.',
      lockPath,
    );
  const lock = parseHubLock(
    decode(io.read(containedPath(root, lockPath)), lockPath),
  );
  const files = Object.fromEntries(
    paths
      .filter((p) => p !== lockPath)
      .map((p) => [
        p.slice(HUB_ROOT.length + 1),
        io.read(containedPath(root, p)),
      ]),
  );
  return validateHubSnapshot(config, { lock, files });
}
