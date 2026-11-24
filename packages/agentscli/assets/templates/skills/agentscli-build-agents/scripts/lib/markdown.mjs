import { unified } from 'unified';
import remarkParse from 'remark-parse';
import {
  EngineError,
  parseYaml,
  exactKeys,
  stringifyYaml,
} from './manifest.mjs';
export const CARD_START = '<!-- AGENT-CARD START -->';
export const CARD_END = '<!-- AGENT-CARD END -->';
export const INSERTION = '<!-- agentscli:conventions -->';
export const GENERATED = '<!-- agentscli:generated -->';
export const normalizeText = (text) => text.replace(/\r\n?/gu, '\n');
export function decode(bytes, path) {
  try {
    return normalizeText(
      new TextDecoder('utf-8', {
        fatal: true,
      }).decode(bytes),
    );
  } catch {
    throw new EngineError('SOURCE_UTF8', `Invalid UTF-8: ${path}.`, 2, path);
  }
}
export function parseMarkdown(text) {
  return unified().use(remarkParse).parse(text);
}
function structure(input, path) {
  const text = normalizeText(input),
    tree = parseMarkdown(text),
    lines = text.split('\n');
  const headings = [];
  const html = [];
  function visit(node) {
    if (
      node.type === 'code' ||
      node.type === 'inlineCode' ||
      node.type === 'blockquote'
    )
      return;
    if (node.type === 'heading' && node.depth === 1) headings.push(node);
    if (node.type === 'html') {
      const value = text.slice(
        node.position.start.offset,
        node.position.end.offset,
      );
      if ([CARD_START, CARD_END, INSERTION].includes(value.trim()))
        html.push([node.position.start.offset, node.position.end.offset]);
    }
    for (const child of node.children ?? []) visit(child);
  }
  visit(tree);
  if (headings.length !== 1)
    throw new EngineError(
      'SOURCE_H1',
      `${path}:1: Expected exactly one H1 outside examples.`,
      2,
      path,
    );
  function inlineText(node) {
    return (
      node.value ??
      (node.children ?? []).map((child) => inlineText(child)).join('')
    );
  }
  const title = inlineText(headings[0]).trim();
  function markers(marker) {
    let offset = 0;
    const found = [];
    lines.forEach((line, index) => {
      const start = offset + line.length - line.trimStart().length;
      if (
        line.trim() === marker &&
        html.some(([a, b]) => start >= a && start < b)
      )
        found.push(index);
      offset += line.length + 1;
    });
    return found;
  }
  return {
    text,
    title,
    lines,
    markers,
  };
}
export function validateTemplate(text, path) {
  const parsed = structure(text, path),
    found = parsed.markers(INSERTION);
  if (found.length !== 1)
    throw new EngineError(
      'TEMPLATE_MARKER',
      `${path}:1: Expected exactly one full-line ${INSERTION} outside examples.`,
      2,
      path,
    );
  return {
    text: parsed.text,
    insertion: found[0],
  };
}
export function validateConventionFilename(title, path) {
  const basename = title
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[A-Z]/gu, (letter) => letter.toLowerCase())
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-|-$/gu, '');
  if (!basename)
    throw new EngineError(
      'SOURCE_FILENAME',
      `${path}: H1 ${JSON.stringify(title)} cannot form a filename. Use a title with letters or digits that normalize to ASCII.`,
      2,
      path,
    );
  const expected = `${basename}.tpl.md`;
  if (path.slice(path.lastIndexOf('/') + 1) !== expected)
    throw new EngineError(
      'SOURCE_FILENAME',
      `${path}: Expected filename ${expected} for H1 ${JSON.stringify(title)}.`,
      2,
      path,
    );
}
export function validateLegacyConvention(text, path) {
  const parsed = structure(text, path),
    starts = parsed.markers(CARD_START),
    ends = parsed.markers(CARD_END);
  if (starts.length !== 1 || ends.length !== 1 || starts[0] >= ends[0])
    throw new EngineError(
      'SOURCE_CARD',
      `${path}:1: Expected one complete AGENT-CARD outside examples.`,
      2,
      path,
    );
  const start = starts[0],
    end = ends[0],
    card = parsed.lines
      .slice(start + 1, end)
      .join('\n')
      .trim();
  if (!card)
    throw new EngineError(
      'SOURCE_CARD',
      `${path}:${start + 1}: AGENT-CARD must not be empty.`,
      2,
      path,
    );
  const body =
    [...parsed.lines.slice(0, start), ...parsed.lines.slice(end + 1)]
      .join('\n')
      .trimEnd() + '\n';
  return {
    title: parsed.title,
    card,
    body,
  };
}

export function frontmatter(input, path) {
  const text = normalizeText(input);
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)/u.exec(text);
  if (!match) return undefined;
  return {
    fields: parseYaml(match[1], path),
    body: text.slice(match[0].length),
    offset: match[0].length,
  };
}
export function activeNodes(text) {
  const result = [];
  function visit(node) {
    if (['code', 'inlineCode', 'blockquote'].includes(node.type)) return;
    result.push(node);
    for (const child of node.children ?? []) visit(child);
  }
  visit(parseMarkdown(text));
  return result;
}
export function hasLegacyCard(input, path) {
  try {
    const parsed = structure(frontmatter(input, path)?.body ?? input, path);
    return (
      parsed.markers(CARD_START).length > 0 ||
      parsed.markers(CARD_END).length > 0
    );
  } catch {
    return activeNodes(input).some(
      (node) =>
        node.type === 'html' &&
        [CARD_START, CARD_END].includes(node.value.trim()),
    );
  }
}
export function validateConvention(input, path) {
  const header = frontmatter(input, path);
  if (!header) {
    if (hasLegacyCard(input, path))
      throw new EngineError(
        'MIGRATION_REQUIRED',
        `${path}: Convert legacy discovery cards with agentscli apply --migrate --dry-run, then agentscli apply --migrate.`,
        2,
        path,
      );
    throw new EngineError(
      'SOURCE_TRIGGER',
      `${path}: Expected leading YAML frontmatter with a nonempty trigger.`,
      2,
      path,
    );
  }
  exactKeys(header.fields, ['trigger'], [], path);
  if (
    typeof header.fields.trigger !== 'string' ||
    !header.fields.trigger.trim()
  )
    throw new EngineError(
      'SOURCE_TRIGGER',
      `${path}: trigger must be nonempty text.`,
      2,
      path,
    );
  const parsed = structure(header.body, path);
  if (parsed.markers(CARD_START).length || parsed.markers(CARD_END).length)
    throw new EngineError(
      'SOURCE_METADATA',
      `${path}: Conventions cannot contain old operational discovery comments.`,
      2,
      path,
    );
  return {
    title: parsed.title,
    trigger: header.fields.trigger,
    card: header.fields.trigger,
    body: parsed.text.trimEnd() + '\n',
    bodyOffset: header.offset,
  };
}
export function convertLegacyConvention(input, path) {
  if (frontmatter(input, path)) {
    validateConvention(input, path);
    return normalizeText(input);
  }
  const parsed = validateLegacyConvention(input, path);
  return `---\n${stringifyYaml({ trigger: parsed.card })}---\n\n${parsed.body}`;
}
