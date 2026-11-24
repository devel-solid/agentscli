import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { EngineError, parseYaml, exactKeys } from './contracts.mjs';
export const GENERATED = '<!-- agentscli:generated -->';
export const normalizeText = (text) => text.replace(/\r\n?/gu, '\n');
export const inlineTrigger = (text) =>
  normalizeText(text)
    .trim()
    .replace(/\s*\n\s*/gu, ' ');
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
    tree = parseMarkdown(text);
  const headings = [];
  function visit(node) {
    if (
      node.type === 'code' ||
      node.type === 'inlineCode' ||
      node.type === 'blockquote'
    )
      return;
    if (node.type === 'heading' && node.depth === 1) headings.push(node);
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
  return {
    text,
    title,
  };
}
export function validateConventionFilename(title, path) {
  const basename = title
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/gu, '')
    .normalize('NFC');
  if (!basename)
    throw new EngineError(
      'SOURCE_FILENAME',
      `${path}: H1 ${JSON.stringify(title)} cannot form a filename. Use a title containing letters or numbers.`,
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
export function frontmatter(input, path) {
  const text = normalizeText(input);
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)/u.exec(text);
  if (!match) return undefined;
  return {
    fields: parseYaml(match[1], path),
    body: text.slice(match[0].length),
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
export function validateConvention(input, path) {
  const header = frontmatter(input, path);
  if (!header) {
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
  if (
    activeNodes('Discovery: ' + inlineTrigger(header.fields.trigger)).some(
      (node) => node.type === 'html' && /<!--/u.test(node.value),
    )
  )
    throw new EngineError(
      'SOURCE_TRIGGER',
      `${path}: trigger cannot contain HTML comments.`,
      2,
      path,
    );
  const parsed = structure(header.body, path);
  return {
    title: parsed.title,
    trigger: header.fields.trigger,
    body: parsed.text.trimEnd() + '\n',
  };
}
