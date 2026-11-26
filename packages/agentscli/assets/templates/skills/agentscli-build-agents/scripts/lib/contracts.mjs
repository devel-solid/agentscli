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
export const CONVENTION_ROOT = '.agentscli/conventions';
export const PRODUCT_SKILLS = [
  'agentscli-write-conventions',
  'agentscli-build-agents',
  'agentscli-refactor-conventions',
];
export function parseYaml(text, path) {
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
export function exactKeys(value, required, optional = [], path) {
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
export function validPackageVersion(value) {
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
