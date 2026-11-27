import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { parseDocument } from 'yaml';
import {
  CONVENTION_ROOT,
  EngineError,
} from '../../agentscli-build-agents/scripts/lib/contracts.mjs';
import {
  assertProjectTarget,
  checkRoot,
  disk,
  inspect,
  replaceFile,
  walk,
} from '../../agentscli-build-agents/scripts/lib/io.mjs';
import {
  containedPath,
  relativePath,
  uniquePaths,
} from '../../agentscli-build-agents/scripts/lib/paths.mjs';
import {
  decode,
  frontmatter,
  normalizeText,
  validateConvention,
} from '../../agentscli-build-agents/scripts/lib/markdown.mjs';
import { validateResources } from '../../agentscli-build-agents/scripts/lib/content.mjs';

// Bump only when review criteria or the review fingerprint contract changes.
// This identity is intentionally independent of the npm package version.
export const REVIEW_POLICY_VERSION = '1';
const HASH = /^[0-9a-f]{64}$/u;
const REVIEW_FIELDS = new Set(['reviewedHash', 'reviewPolicyVersion']);

function conventionPath(value) {
  if (typeof value !== 'string')
    throw new EngineError('USAGE', 'Provide a relative convention path.');
  const path = relativePath(value);
  if (!path.startsWith(`${CONVENTION_ROOT}/`) || !path.endsWith('.md'))
    throw new EngineError(
      'REVIEW_PATH',
      'Select a Markdown convention inside the project convention directory.',
      2,
      path,
    );
  return path;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, item]) => [key, stable(item)]),
  );
}

function inputText(input, path) {
  return typeof input === 'string'
    ? normalizeText(input.replace(/^\uFEFF/u, ''))
    : decode(input, path);
}

export function reviewHash(input, inputPath) {
  const path = conventionPath(inputPath);
  const text = inputText(input, path);
  validateResources({ conventions: [{ path, text }] });
  const header = frontmatter(text, path);
  const fields = Object.fromEntries(
    Object.entries(header.fields).filter(([key]) => !REVIEW_FIELDS.has(key)),
  );
  return createHash('sha256')
    .update(
      JSON.stringify({
        path,
        frontmatter: stable(fields),
        body: header.body,
      }),
    )
    .digest('hex');
}

function resultFor(command) {
  return {
    schemaVersion: 1,
    command,
    ok: true,
    policyVersion: REVIEW_POLICY_VERSION,
    candidates: [],
    skipped: [],
    changes: [],
    diagnostics: [],
  };
}

function diagnostic(error, path) {
  return {
    code: error.code ?? 'REVIEW_OPERATION',
    message: error.message,
    ...(error.path || path ? { path: error.path ?? path } : {}),
  };
}

function failed(result, error, path) {
  result.ok = false;
  result.diagnostics.push(diagnostic(error, path));
  return {
    exitCode: error instanceof EngineError ? error.exitCode : 3,
    result,
  };
}

function project(io, repoRoot) {
  if (typeof repoRoot !== 'string' || !repoRoot.trim())
    throw new EngineError('USAGE', 'Provide --repo-root <directory>.');
  const root = checkRoot(io, repoRoot);
  assertProjectTarget(io, root);
  return root;
}

export function selectConventions({ repoRoot }, { io = disk } = {}) {
  const result = resultFor('select');
  try {
    let exitCode = 0;
    const root = project(io, repoRoot);
    const paths = walk(io, root, CONVENTION_ROOT)
      .filter((path) => path.endsWith('.md'))
      .sort();
    uniquePaths(paths);
    for (const path of paths) {
      try {
        const text = decode(io.read(containedPath(root, path)), path);
        const hash = reviewHash(text, path);
        const parsed = validateConvention(text, path);
        const fields = frontmatter(text, path).fields;
        const reasons = [];
        if (!fields.reviewedHash) reasons.push('missing-reviewed-hash');
        else if (fields.reviewedHash !== hash) reasons.push('content-changed');
        if (!fields.reviewPolicyVersion)
          reasons.push('missing-review-policy-version');
        else if (fields.reviewPolicyVersion !== REVIEW_POLICY_VERSION)
          reasons.push('policy-version-changed');
        const entry = {
          path,
          title: parsed.title,
          trigger: parsed.trigger,
          hash,
          reasons,
        };
        (reasons.length ? result.candidates : result.skipped).push(entry);
      } catch (error) {
        result.ok = false;
        exitCode = Math.max(
          exitCode,
          error instanceof EngineError ? error.exitCode : 3,
        );
        result.candidates.push({ path, reasons: ['invalid-input'] });
        result.diagnostics.push(diagnostic(error, path));
      }
    }
    return { exitCode, result };
  } catch (error) {
    return failed(result, error);
  }
}

function reviewDocument(previous, path) {
  let raw;
  try {
    raw = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(
      previous,
    );
  } catch {
    throw new EngineError('SOURCE_UTF8', 'Invalid UTF-8 convention.', 2, path);
  }
  const match =
    /^(\uFEFF?---(\r\n|\n|\r))([\s\S]*?)((?:\r\n|\n|\r)---(?:(?:\r\n|\n|\r)|$))/u.exec(
      raw,
    );
  if (!match)
    throw new EngineError(
      'SOURCE_TRIGGER',
      'Missing leading YAML frontmatter.',
      2,
      path,
    );
  const [, prefix, eol, yaml, closing] = match;
  // Lone CR is a line break in the shared parser. Replace it one-for-one so
  // YAML node offsets still address the original bytes/characters for edits.
  const document = parseDocument(yaml.replace(/\r(?!\n)/gu, '\n'), {
    keepSourceTokens: true,
  });
  return { raw, match, prefix, eol, yaml, closing, document };
}

function finishReviewDocument(parts, edits, hash, path) {
  const { raw, match, prefix, yaml, closing } = parts;
  let updated = yaml;
  for (const edit of edits.sort((a, b) => b.start - a.start))
    updated =
      updated.slice(0, edit.start) + edit.text + updated.slice(edit.end);
  const next = prefix + updated + closing + raw.slice(match[0].length);
  if (reviewHash(next, path) !== hash)
    throw new EngineError(
      'REVIEW_CONTENT_CHANGED',
      'Updating review metadata changed reviewed content; no file was written.',
      3,
      path,
    );
  return next;
}

function lineStart(text, at) {
  return (
    Math.max(text.lastIndexOf('\r', at - 1), text.lastIndexOf('\n', at - 1)) + 1
  );
}

function mappingIndent(yaml, mapping) {
  const firstKey = mapping.items[0].key.range[0];
  return yaml.slice(lineStart(yaml, firstKey), firstKey).match(/^[ \t]*/u)[0];
}

function recordText(previous, hash, path) {
  const parts = reviewDocument(previous, path);
  const { document, yaml, eol } = parts;
  const values = {
    reviewedHash: hash,
    reviewPolicyVersion: REVIEW_POLICY_VERSION,
  };
  const missing = [];
  const edits = [];
  for (const [key, value] of Object.entries(values)) {
    const pair = document.contents.items.find(
      (item) => item.key?.value === key,
    );
    if (!pair) {
      missing.push([key, value]);
      continue;
    }
    const [start, end] = pair.value.range;
    const block = /^BLOCK_/u.test(pair.value.type ?? '');
    const ending = block
      ? (/(?:\r\n|\n|\r)$/u.exec(yaml.slice(start, end))?.[0] ?? '')
      : '';
    edits.push({ start, end, text: JSON.stringify(value) + ending });
  }
  if (missing.length) {
    if (document.contents.flow) {
      const last = document.contents.items.at(-1).value.range[1];
      edits.push({
        start: last,
        end: last,
        text:
          ', ' +
          missing
            .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
            .join(', '),
      });
    } else {
      const at = document.contents.range[1];
      const before = yaml.slice(0, at);
      const after = yaml.slice(at);
      const lead = /(?:\r\n|\n|\r)$/u.test(before) ? '' : eol;
      const indent = mappingIndent(yaml, document.contents);
      edits.push({
        start: at,
        end: at,
        text:
          lead +
          missing
            .map(([key, value]) => `${indent}${key}: ${JSON.stringify(value)}`)
            .join(eol) +
          (after ? eol : ''),
      });
    }
  }
  return new TextEncoder().encode(
    finishReviewDocument(parts, edits, hash, path),
  );
}

function sourceTokens(token) {
  const tokens = [];
  const seen = new Set();
  function visit(value) {
    if (!value || typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    if (value.type && typeof value.offset === 'number') tokens.push(value);
    for (const child of Object.values(value)) {
      if (Array.isArray(child)) child.forEach(visit);
      else visit(child);
    }
  }
  visit(token);
  return tokens;
}

function invalidateText(previous, hash, path) {
  const parts = reviewDocument(previous, path);
  const { yaml, document, eol } = parts;
  const mapping = document.contents;
  const tokens = sourceTokens(mapping.srcToken);
  const comments = tokens.filter((token) => token.type === 'comment');
  const edits = [];
  const indent = mappingIndent(yaml, mapping);
  for (const pair of mapping.items) {
    if (!REVIEW_FIELDS.has(pair.key?.value)) continue;
    const item = mapping.flow
      ? mapping.srcToken.items.find(
          (item) => item.key?.offset === pair.key.range[0],
        )
      : undefined;
    const explicitKey = item?.start?.find(
      (token) => token.type === 'explicit-key-ind',
    );
    const start = mapping.flow
      ? (explicitKey?.offset ?? pair.key.range[0])
      : lineStart(yaml, pair.key.range[0]);
    const end = pair.value.range[2];
    const keptComments = comments.filter(
      (token) => token.offset >= start && token.offset < end,
    );
    const text = keptComments
      .map((token) => {
        const comment = yaml.slice(
          token.offset,
          token.offset + token.source.length,
        );
        const ending =
          /^[ \t]*(\r\n|\n|\r)/u.exec(
            yaml.slice(token.offset + token.source.length),
          )?.[1] ?? eol;
        return (mapping.flow ? ' ' : indent) + comment + ending;
      })
      .join('');
    edits.push({ start, end, text });
  }
  if (mapping.flow) {
    const keptKeys = new Set(
      mapping.items
        .filter((pair) => !REVIEW_FIELDS.has(pair.key?.value))
        .map((pair) => pair.key.range[0]),
    );
    const firstKept = Math.min(...keptKeys);
    for (const item of mapping.srcToken.items)
      for (const token of item.start ?? [])
        if (
          token.type === 'comma' &&
          item.key &&
          (!keptKeys.has(item.key.offset) || item.key.offset === firstKept)
        )
          edits.push({
            start: token.offset,
            end: token.offset + token.source.length,
            text: '',
          });
  }
  const next = finishReviewDocument(parts, edits, hash, path);
  const fields = frontmatter(inputText(next, path), path).fields;
  if ([...REVIEW_FIELDS].some((field) => Object.hasOwn(fields, field)))
    throw new EngineError(
      'REVIEW_STATE',
      'Review metadata was not fully removed; no file was written.',
      3,
      path,
    );
  return new TextEncoder().encode(next);
}

function changeReview(
  command,
  {
    repoRoot,
    path: inputPath,
    expectedHash,
    expectedPolicyVersion,
    dryRun = false,
  },
  { io = disk } = {},
) {
  const result = resultFor(command);
  try {
    const root = project(io, repoRoot);
    const path = conventionPath(inputPath);
    result.path = path;
    if (typeof expectedHash !== 'string' || !HASH.test(expectedHash))
      throw new EngineError(
        'USAGE',
        'Provide --expected-hash as 64 lowercase SHA-256 hexadecimal characters.',
      );
    if (
      typeof expectedPolicyVersion !== 'string' ||
      !/^[1-9][0-9]*$/u.test(expectedPolicyVersion)
    )
      throw new EngineError(
        'USAGE',
        'Provide --expected-policy-version from the selection used for this review-state operation.',
      );
    if (expectedPolicyVersion !== REVIEW_POLICY_VERSION)
      throw new EngineError(
        'STALE_REVIEW_POLICY',
        'Review criteria changed after selection. Inspect the current policy before updating review state.',
        2,
        path,
      );
    if (!inspect(io, root, path, 'file'))
      throw new EngineError(
        'SOURCE_MISSING',
        'The reviewed convention no longer exists.',
        2,
        path,
      );
    const previous = io.read(containedPath(root, path));
    const text = decode(previous, path);
    const hash = reviewHash(text, path);
    result.hash = hash;
    if (hash !== expectedHash)
      throw new EngineError(
        'STALE_REVIEW',
        'Convention content or path changed after selection. Review the current input before updating review state.',
        2,
        path,
      );
    const fields = frontmatter(text, path).fields;
    const alreadyCurrent =
      command === 'record'
        ? fields.reviewedHash === hash &&
          fields.reviewPolicyVersion === REVIEW_POLICY_VERSION
        : [...REVIEW_FIELDS].every((field) => !Object.hasOwn(fields, field));
    if (alreadyCurrent) return { exitCode: 0, result };
    const next =
      command === 'record'
        ? recordText(previous, hash, path)
        : invalidateText(previous, hash, path);
    result.changes.push({ path, action: 'update', status: 'pending' });
    if (dryRun) return { exitCode: 0, result };
    replaceFile(io, root, path, next, previous);
    result.changes[0].status = 'completed';
    return { exitCode: 0, result };
  } catch (error) {
    return failed(result, error, result.path);
  }
}

export function recordReview(options, dependencies) {
  return changeReview('record', options, dependencies);
}

export function invalidateReview(options, dependencies) {
  return changeReview('invalidate', options, dependencies);
}

export function run(args = process.argv.slice(2), dependencies = {}) {
  let command = 'unknown';
  try {
    const { values, positionals, tokens } = parseArgs({
      args,
      strict: true,
      allowPositionals: true,
      tokens: true,
      options: {
        'repo-root': { type: 'string' },
        path: { type: 'string' },
        'expected-hash': { type: 'string' },
        'expected-policy-version': { type: 'string' },
        'dry-run': { type: 'boolean' },
        json: { type: 'boolean' },
      },
    });
    command = positionals[0] ?? 'unknown';
    const seen = tokens
      .filter((token) => token.kind === 'option')
      .map((token) => token.name);
    if (
      positionals.length !== 1 ||
      !['select', 'record', 'invalidate'].includes(command) ||
      new Set(seen).size !== seen.length ||
      (command === 'select' &&
        seen.some((name) =>
          [
            'path',
            'expected-hash',
            'expected-policy-version',
            'dry-run',
          ].includes(name),
        ))
    )
      throw new EngineError(
        'USAGE',
        'Use select --repo-root <root>, or record|invalidate --repo-root <root> --path <convention> --expected-hash <hash> --expected-policy-version <version> [--dry-run], with optional --json.',
      );
    const repoRoot = resolve(values['repo-root'] ?? '.');
    if (values['repo-root'] !== undefined && !values['repo-root'].trim())
      throw new EngineError('USAGE', 'Provide a nonempty --repo-root.');
    return command === 'select'
      ? selectConventions({ repoRoot }, dependencies)
      : (command === 'record' ? recordReview : invalidateReview)(
          {
            repoRoot,
            path: values.path,
            expectedHash: values['expected-hash'],
            expectedPolicyVersion: values['expected-policy-version'],
            dryRun: values['dry-run'],
          },
          dependencies,
        );
  } catch (error) {
    return failed(
      resultFor(command),
      error instanceof EngineError
        ? error
        : new EngineError('USAGE', error.message),
    );
  }
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  const response = run();
  process.stdout.write(JSON.stringify(response.result) + '\n');
  process.exitCode = response.exitCode;
}
