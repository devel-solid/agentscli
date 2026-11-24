import { createHash } from 'node:crypto';

export class HubImportError extends Error {
  constructor(code, message, exitCode = 2, path) {
    super(message);
    this.name = 'HubImportError';
    this.code = code;
    this.exitCode = exitCode;
    if (path) this.path = path;
  }
}

export const HUB_ROOT = '.agentscli/hub';
export const CONFIG_PATH = '.agentscli/config.yml';
export const LOCK_PATH = `${HUB_ROOT}/lock.yml`;
export const RESERVED_SKILLS = new Set([
  'agentscli-adm-write-conventions',
  'agentscli-adm-edit-agents',
  'agentscli-adm-publish-packages',
  'agentscli-write-conventions',
  'agentscli-edit-agents',
  'agentscli-build-agents',
  'agentscli-manage-hub-imports',
  'agentscli-hub-write-conventions',
  'agentscli-hub-edit-agents',
  'agentscli-hub-write-shared-conventions',
  'agentscli-hub-write-shared-skills',
  'agentscli-hub-publish',
  'agentscli-update-agents',
]);

export const key = (value) => value.normalize('NFC').toLowerCase();
export const sha256 = (value) =>
  createHash('sha256').update(value).digest('hex');
export const bytesEqual = (a, b) =>
  a !== undefined && b !== undefined && Buffer.from(a).equals(Buffer.from(b));

export function portablePath(value) {
  if (
    typeof value !== 'string' ||
    !value ||
    value.includes('\\') ||
    /[<>:"|?*\u0000-\u001f\u007f]/u.test(value) ||
    value
      .split('/')
      .some(
        (part) =>
          !part ||
          part === '.' ||
          part === '..' ||
          key(part) === '.git' ||
          /[. ]$/u.test(part) ||
          /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(part),
      )
  )
    throw new HubImportError(
      'PATH_UNSAFE',
      'Expected a contained portable resource path.',
    );
  return value;
}

export function selection(values, type) {
  if (!Array.isArray(values))
    throw new HubImportError(
      'SELECTION',
      `Explicit ${type} selection must be an array.`,
    );
  const seen = new Set();
  for (const value of values) {
    portablePath(value);
    if (
      type === 'skills' &&
      (value.includes('/') || RESERVED_SKILLS.has(value))
    )
      throw new HubImportError(
        'SELECTION',
        'A selected skill ID is nested or reserved.',
      );
    const folded = key(value);
    if (seen.has(folded))
      throw new HubImportError('SELECTION', `Duplicate portable ${type} ID.`);
    if (
      type === 'skills' &&
      [...RESERVED_SKILLS].some((name) => key(name) === folded)
    )
      throw new HubImportError(
        'SELECTION',
        'Operational and retired skill IDs are reserved.',
      );
    seen.add(folded);
  }
  return [...values].sort(
    (a, b) => key(a).localeCompare(key(b), 'en') || a.localeCompare(b, 'en'),
  );
}

export function repository(value) {
  if (
    typeof value !== 'string' ||
    !value ||
    value.startsWith('-') ||
    /^[A-Za-z]:/u.test(value) ||
    value.includes('::') ||
    /[\s\u0000-\u001f\u007f\\`$;&|<>"']/u.test(value)
  )
    throw new HubImportError(
      'REPOSITORY',
      'Use a credential-free native network Git endpoint.',
    );
  if (/^[A-Za-z][A-Za-z0-9+.-]*:\/\//u.test(value)) {
    let parsed;
    try {
      parsed = new URL(value);
    } catch {
      throw new HubImportError('REPOSITORY', 'Invalid network Git endpoint.');
    }
    if (
      !['https:', 'http:', 'ssh:', 'git:'].includes(parsed.protocol) ||
      !parsed.hostname ||
      parsed.hostname.startsWith('-') ||
      parsed.password ||
      (parsed.protocol !== 'ssh:' && parsed.username) ||
      parsed.search ||
      parsed.hash ||
      !parsed.pathname ||
      parsed.pathname === '/'
    )
      throw new HubImportError(
        'REPOSITORY',
        'Use a credential-free native network Git endpoint.',
      );
    try {
      if (/[\u0000-\u001f\u007f]/u.test(decodeURIComponent(value)))
        throw new Error();
    } catch {
      throw new HubImportError(
        'REPOSITORY',
        'Invalid encoded network Git endpoint.',
      );
    }
    return value;
  }
  if (
    !/^(?:[A-Za-z0-9._-]+@)?[A-Za-z0-9][A-Za-z0-9.-]*:[^/][^:]*$/u.test(value)
  )
    throw new HubImportError(
      'REPOSITORY',
      'Local directories, file URLs, and remote helpers are unsupported.',
    );
  return value;
}

export function commitId(value) {
  if (
    typeof value !== 'string' ||
    !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/iu.test(value)
  )
    throw new HubImportError('REVISION', 'Use a full commit object ID.');
  return value.toLowerCase();
}

export function tagName(value) {
  if (
    typeof value !== 'string' ||
    !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u.test(value) ||
    value.includes('..') ||
    value.includes('//') ||
    value.endsWith('/') ||
    value
      .split('/')
      .some(
        (part) =>
          part.startsWith('.') || part.endsWith('.') || part.endsWith('.lock'),
      )
  )
    throw new HubImportError(
      'REVISION',
      'Use an explicit valid tag name, not a tracking branch.',
    );
  return value;
}

export function contentVersion(value) {
  if (
    typeof value !== 'string' ||
    !/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/u.test(
      value,
    ) ||
    value
      .split('+')[0]
      .split('-')
      .slice(1)
      .join('-')
      .split('.')
      .some(
        (part) =>
          /^\d+$/u.test(part) && part.length > 1 && part.startsWith('0'),
      )
  )
    throw new HubImportError(
      'HUB_VERSION',
      'Hub content version must be a valid semantic version.',
    );
  return value;
}

export function request(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new HubImportError(
      'USAGE',
      'An explicit repository, revision, and both resource lists are required.',
    );
  const result = {
    repository: repository(input.repository),
    conventions: selection(input.conventions, 'conventions'),
    skills: selection(input.skills, 'skills'),
  };
  if ((input.commit === undefined) === (input.tag === undefined))
    throw new HubImportError(
      'REVISION',
      'Choose exactly one explicit commit or tag.',
    );
  if (input.commit !== undefined) result.commit = commitId(input.commit);
  else result.tag = tagName(input.tag);
  return result;
}

export function representation(content, forceBytes = false) {
  if (!forceBytes) {
    try {
      const text = new TextDecoder('utf-8', {
        fatal: true,
        ignoreBOM: true,
      }).decode(content);
      if (!text.includes('\0') && !/\r(?!\n)/u.test(text)) return 'utf8-lf';
    } catch {
      // Invalid UTF-8 is opaque data, never decoded permissively.
    }
  }
  return 'bytes';
}

export function canonical(content, kind) {
  if (kind === 'bytes') return new Uint8Array(content);
  if (kind !== 'utf8-lf' || representation(content) !== 'utf8-lf')
    throw new HubImportError(
      'INTEGRITY',
      'Content violates its accepted text representation.',
    );
  return new Uint8Array(
    Buffer.from(Buffer.from(content).toString('utf8').replace(/\r\n/gu, '\n')),
  );
}

export function descriptor(content, gitMode, forceBytes = false) {
  if (!['100644', '100755'].includes(gitMode))
    throw new HubImportError(
      'GIT_ENTRY',
      'Selected resources must be ordinary regular Git blobs.',
    );
  const kind = representation(content, forceBytes);
  const bytes = canonical(content, kind);
  return {
    content: bytes,
    descriptor: { representation: kind, sha256: sha256(bytes), gitMode },
  };
}

function validateInventoryPaths(paths) {
  const prefixes = new Map();
  const files = new Set(paths.map(key));
  for (const path of paths) {
    portablePath(path);
    const segments = path.split('/');
    for (let length = 1; length <= segments.length; length++) {
      const prefix = segments.slice(0, length).join('/');
      const folded = key(prefix);
      if (
        (prefixes.has(folded) && prefixes.get(folded) !== prefix) ||
        (length < segments.length && files.has(folded))
      )
        throw new HubImportError(
          'PATH_ALIAS',
          'Selected directory or file names collide portably.',
        );
      prefixes.set(folded, prefix);
    }
  }
}

export function snapshotFromCapture(input, capture, parseYaml) {
  const intent = request(input);
  const commit = commitId(capture.commit);
  if (intent.commit && intent.commit !== commit)
    throw new HubImportError(
      'REVISION',
      'Git returned a different commit from the requested candidate.',
    );
  const entries = new Map();
  for (const entry of capture.entries) {
    if (entries.has(entry.path))
      throw new HubImportError('GIT_ENTRY', 'Duplicate selected Git entry.');
    entries.set(entry.path, entry);
  }
  const selected = new Set(['agentscli-hub.yml']);
  for (const id of intent.conventions)
    selected.add(`shared/conventions/${id}.tpl.md`);
  for (const id of intent.skills) {
    if (entries.has(`shared/skills/${id}`))
      throw new HubImportError(
        'GIT_ENTRY',
        'Selected skill root must be a regular directory tree.',
      );
    const files = [...entries.keys()].filter((path) =>
      path.startsWith(`shared/skills/${id}/`),
    );
    if (!files.includes(`shared/skills/${id}/SKILL.md`))
      throw new HubImportError(
        'SOURCE_MISSING',
        `Missing selected skill entrypoint: ${id}.`,
      );
    for (const path of files) selected.add(path);
  }
  const files = {};
  const inventory = {};
  const physicalPaths = [...selected].sort();
  const logicalPath = (path) =>
    path === 'agentscli-hub.yml' ? path : path.slice('shared/'.length);
  validateInventoryPaths(physicalPaths);
  validateInventoryPaths(physicalPaths.map(logicalPath));
  for (const path of physicalPaths) {
    const entry = entries.get(path);
    if (!entry)
      throw new HubImportError(
        'SOURCE_MISSING',
        `Missing selected hub source: ${path}.`,
      );
    if (entry.invalidPath)
      throw new HubImportError(
        'GIT_TREE',
        'Selected Git paths must be valid UTF-8 without replacement characters.',
      );
    if (entry.type !== 'blob')
      throw new HubImportError(
        'GIT_ENTRY',
        'Selected symlinks, submodules, and special entries are forbidden.',
      );
    const result = descriptor(
      entry.content,
      entry.gitMode,
      entry.textAttribute === 'unset',
    );
    const target = logicalPath(path);
    files[target] = result.content;
    inventory[target] = result.descriptor;
  }
  let manifest;
  try {
    manifest = parseYaml(
      new TextDecoder('utf-8', { fatal: true }).decode(
        files['agentscli-hub.yml'],
      ),
      'agentscli-hub.yml',
    );
  } catch {
    throw new HubImportError(
      'HUB_MANIFEST',
      'Invalid hub manifest YAML or UTF-8.',
    );
  }
  if (
    !manifest ||
    typeof manifest !== 'object' ||
    Array.isArray(manifest) ||
    Object.keys(manifest).sort().join(',') !== 'schemaVersion,version' ||
    manifest.schemaVersion !== 1
  )
    throw new HubImportError(
      'HUB_MANIFEST',
      'Hub manifest must contain exactly schemaVersion: 1 and content version.',
    );
  const hubVersion = contentVersion(manifest.version);
  let releaseTag = false;
  if (intent.tag?.startsWith('v')) {
    try {
      contentVersion(intent.tag.slice(1));
      releaseTag = true;
    } catch {
      /* Non-release tag names are allowed. */
    }
  }
  if (releaseTag && intent.tag !== `v${hubVersion}`)
    throw new HubImportError(
      'HUB_VERSION',
      'Requested content release tag disagrees with the manifest version.',
    );
  return {
    lock: {
      schemaVersion: 1,
      repository: intent.repository,
      commit,
      hubVersion,
      conventions: intent.conventions,
      skills: intent.skills,
      files: inventory,
    },
    files,
  };
}

export function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.keys(value)
      .sort()
      .map((name) => `${JSON.stringify(name)}:${stable(value[name])}`)
      .join(',')}}`;
  return JSON.stringify(value);
}

export const snapshotHash = (snapshot) =>
  sha256(stable(snapshot?.lock ?? null));

export function summarizeEffects(effects) {
  return effects.map(
    ({ path, action, content, previous, directory, gitMode }) => ({
      path,
      action,
      ...(directory ? { directory: true } : {}),
      ...(content !== undefined ? { sha256: sha256(content) } : {}),
      ...(previous !== undefined ? { previousSha256: sha256(previous) } : {}),
      ...(gitMode !== undefined ? { gitMode } : {}),
    }),
  );
}
