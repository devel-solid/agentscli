import { parseDocument, stringify, visit, isAlias } from 'yaml';
import { portableKey, relativePath } from './paths.mjs';
export class EngineError extends Error {
  constructor(code, message, exitCode = 2, path) {
    super(message);
    this.code = code;
    this.exitCode = exitCode;
    this.path = path;
  }
}
export const CONFIG_PATH = '.agentscli/config.yml',
  TEMPLATE_ROOT = '.agentscli/templates',
  CONVENTION_ROOT = `${TEMPLATE_ROOT}/conventions`,
  OUTPUT_ROOT = '.agentscli/conventions',
  HUB_ROOT = '.agentscli/hub',
  MANIFEST = 'agentscli-compose.yml';
export const PRODUCT_SKILLS = [
  'agentscli-write-conventions',
  'agentscli-edit-agents',
  'agentscli-build-agents',
  'agentscli-manage-hub-imports',
];
export const RESERVED_SKILLS = [
  ...PRODUCT_SKILLS,
  'agentscli-update-agents',
  'agentscli-adm-write-conventions',
  'agentscli-adm-edit-agents',
  'agentscli-adm-publish-packages',
  'agentscli-hub-write-conventions',
  'agentscli-hub-edit-agents',
  'agentscli-hub-write-shared-conventions',
  'agentscli-hub-write-shared-skills',
  'agentscli-hub-publish',
];
export function language(value = 'en') {
  if (
    typeof value !== 'string' ||
    !['en', 'pt-br'].includes(value.toLowerCase())
  )
    throw new EngineError('LANGUAGE', 'Supported languages are en and pt-br.');
  return value.toLowerCase();
}
export const defaultManifest = (value) => ({ language: language(value) });
export function parseYaml(text, path = CONFIG_PATH) {
  const document = parseDocument(text, {
    uniqueKeys: true,
    strict: true,
    prettyErrors: false,
  });
  if (document.errors.length || document.warnings.length)
    throw new EngineError(
      'YAML',
      `Invalid YAML (${(document.errors[0] ?? document.warnings[0]).code}).`,
      2,
      path,
    );
  visit(document, (_key, node) => {
    if (isAlias(node) || node?.tag)
      throw new EngineError(
        'YAML',
        'YAML aliases and explicit tags are not supported.',
        2,
        path,
      );
  });
  let value;
  try {
    value = document.toJS({ maxAliasCount: 0 });
  } catch {
    throw new EngineError('YAML', 'YAML aliases are not supported.', 2, path);
  }
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new EngineError('YAML_FIELDS', 'Expected a YAML mapping.', 2, path);
  return value;
}
export const stringifyYaml = (value) => stringify(value);
export function exactKeys(value, required, optional = [], path = CONFIG_PATH) {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    required.some((key) => !Object.hasOwn(value, key)) ||
    Object.keys(value).some((key) => ![...required, ...optional].includes(key))
  )
    throw new EngineError(
      'FIELDS',
      `Expected fields: ${required.join(', ')}${optional.length ? `; optional: ${optional.join(', ')}` : ''}.`,
      2,
      path,
    );
}
export function resourceId(value, type, path) {
  if (typeof value !== 'string' || !value)
    throw new EngineError(
      'RESOURCE_ID',
      'Resource IDs must be nonempty strings.',
      2,
      path,
    );
  relativePath(value);
  if (
    value.includes('\\') ||
    value.split('/').some((part) => portableKey(part) === '.git')
  )
    throw new EngineError(
      'RESOURCE_ID',
      'Resource IDs must use contained portable paths without Git metadata.',
      2,
      path,
    );
  if (
    type === 'skills' &&
    (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value) || value.length > 64)
  )
    throw new EngineError(
      'RESOURCE_ID',
      `Invalid skill ID: ${value}.`,
      2,
      path,
    );
  return value;
}
export function uniqueIds(values, type, path) {
  if (!Array.isArray(values))
    throw new EngineError(
      'RESOURCE_IDS',
      `${type} must be an explicit ID list.`,
      2,
      path,
    );
  const seen = new Set();
  return values.map((value) => {
    resourceId(value, type, path);
    const key = portableKey(value);
    if (seen.has(key))
      throw new EngineError(
        'RESOURCE_IDS',
        `Duplicate ${type} ID: ${value}.`,
        2,
        path,
      );
    seen.add(key);
    return value;
  });
}
export function validateRepository(value, path = CONFIG_PATH) {
  if (
    typeof value !== 'string' ||
    !value ||
    /[\s\x00-\x1f]/u.test(value) ||
    value.startsWith('-') ||
    value.includes('::')
  )
    throw new EngineError(
      'HUB_REPOSITORY',
      'Use a safe network Git endpoint without credentials.',
      2,
      path,
    );
  if (/^[a-z][a-z0-9+.-]*:\/\//iu.test(value)) {
    let url;
    try {
      url = new URL(value);
    } catch {
      throw new EngineError('HUB_REPOSITORY', 'Invalid Git endpoint.', 2, path);
    }
    if (
      !['https:', 'http:', 'ssh:', 'git:'].includes(url.protocol) ||
      !url.hostname ||
      url.password ||
      (['https:', 'http:', 'git:'].includes(url.protocol) && url.username) ||
      url.search ||
      url.hash
    )
      throw new EngineError(
        'HUB_REPOSITORY',
        'Use native SSH/SCP or HTTP(S)/Git endpoints without embedded credentials.',
        2,
        path,
      );
  } else if (
    !/^(?:[A-Za-z0-9._-]+@)?[A-Za-z0-9][A-Za-z0-9.-]*:[^/\\][^\\]*$/u.test(
      value,
    ) ||
    /^[a-z]:/iu.test(value)
  )
    throw new EngineError(
      'HUB_REPOSITORY',
      'Local paths and executable Git helpers are not supported.',
      2,
      path,
    );
  return value;
}
export function validateHubConfig(hub, path = CONFIG_PATH) {
  exactKeys(hub, ['repository', 'commit', 'conventions', 'skills'], [], path);
  const repository = validateRepository(hub.repository, path);
  if (
    typeof hub.commit !== 'string' ||
    !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/u.test(hub.commit)
  )
    throw new EngineError(
      'HUB_COMMIT',
      'Pin a full lowercase Git commit object ID.',
      2,
      path,
    );
  const conventions = uniqueIds(hub.conventions, 'conventions', path),
    skills = uniqueIds(hub.skills, 'skills', path);
  if (skills.some((id) => RESERVED_SKILLS.includes(id)))
    throw new EngineError(
      'HUB_RESERVED',
      'Operational and retired product skill names cannot be imported.',
      2,
      path,
    );
  return { repository, commit: hub.commit, conventions, skills };
}
export function parseManifest(text) {
  const fields = parseYaml(text, CONFIG_PATH);
  exactKeys(fields, ['language'], ['hub'], CONFIG_PATH);
  if (!['en', 'pt-br'].includes(fields.language))
    throw new EngineError(
      'LANGUAGE',
      'Stored language must be lowercase en or pt-br.',
      2,
      CONFIG_PATH,
    );
  return {
    language: fields.language,
    ...(fields.hub === undefined ? {} : { hub: validateHubConfig(fields.hub) }),
  };
}
export function parseLegacyManifest(text) {
  const fields = parseYaml(text, MANIFEST);
  exactKeys(
    fields,
    ['language', 'templates_dir', 'conventions_dir'],
    [],
    MANIFEST,
  );
  if (!['en', 'pt-br'].includes(fields.language))
    throw new EngineError(
      'LANGUAGE',
      'Stored language must be lowercase en or pt-br.',
      2,
      MANIFEST,
    );
  const a = rootDirectory(fields.templates_dir),
    b = rootDirectory(fields.conventions_dir);
  if (
    portableKey(a) === portableKey(b) ||
    portableKey(a).startsWith(`${portableKey(b)}/`) ||
    portableKey(b).startsWith(`${portableKey(a)}/`)
  )
    throw new EngineError(
      'ROOT_OVERLAP',
      'Legacy roots must not overlap.',
      2,
      MANIFEST,
    );
  return { language: fields.language, templates_dir: a, conventions_dir: b };
}
function rootDirectory(value) {
  const normalized = relativePath(value);
  if (
    portableKey(normalized) === '.agentscli' ||
    portableKey(normalized).startsWith('.agentscli/') ||
    normalized
      .split('/')
      .some((part) =>
        ['.git', '.agents', '.cache', 'node_modules'].includes(
          portableKey(part),
        ),
      ) ||
    ['agents.md', MANIFEST].includes(portableKey(normalized.split('/')[0]))
  )
    throw new EngineError(
      'ROOT_RESERVED',
      `Reserved legacy directory: ${value}.`,
      2,
      MANIFEST,
    );
  return normalized;
}
export const serializeManifest = (manifest) => stringify(manifest);
