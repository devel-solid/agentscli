import { posix } from 'node:path';
import { EngineError } from './manifest.mjs';
import { CARD_END, CARD_START, parseMarkdown } from './markdown.mjs';
import { portableKey } from './paths.mjs';
export function rebaseLinks(
  text,
  source,
  oldOutput,
  newOutput,
  mapping,
  convention,
) {
  const tree = parseMarkdown(text);
  const portableMapping = new Map(
    [...mapping].map(([before, after]) => [portableKey(before), after]),
  );
  const nodes = [];
  function visit(node) {
    if (['code', 'inlineCode', 'blockquote'].includes(node.type)) return;
    nodes.push(node);
    if ('children' in node) node.children.forEach(visit);
  }
  visit(tree);
  function fail(node, message) {
    const point = node.position?.start;
    throw new EngineError(
      'MIGRATION_LINK',
      `${source}:${point?.line ?? 1}:${point?.column ?? 1}: ${message}`,
      2,
      source,
    );
  }
  const marker = (value) =>
    nodes.find((node) => node.type === 'html' && node.value.trim() === value)
      ?.position?.start.offset;
  const cardStart = convention ? marker(CARD_START) : undefined;
  const cardEnd = convention ? marker(CARD_END) : undefined;
  function inCard(node) {
    const offset = node.position?.start.offset ?? -1;
    return (
      cardStart !== undefined &&
      cardEnd !== undefined &&
      offset > cardStart &&
      offset < cardEnd
    );
  }
  function rewrite(url, card, node) {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\?)/iu.test(url) || !url) return url;
    const suffixAt = url.search(/[?#]/u);
    const pathname = suffixAt < 0 ? url : url.slice(0, suffixAt);
    const suffix = suffixAt < 0 ? '' : url.slice(suffixAt);
    let decoded;
    try {
      if (/%(?:2f|5c)/iu.test(pathname)) throw new Error();
      decoded = decodeURIComponent(pathname);
      if (/%[\da-f]{2}/iu.test(decoded)) throw new Error();
    } catch {
      return fail(node, 'Invalid or ambiguous local URL encoding.');
    }
    if (/^[\/\\]/u.test(decoded) || /[\\\x00-\x1f\x7f]/u.test(decoded))
      return fail(node, 'Expected an unambiguous repository-relative URL.');
    const previous = card ? 'AGENTS.md' : oldOutput;
    const next = card ? 'AGENTS.md' : newOutput;
    const target = posix.normalize(
      posix.join(posix.dirname(previous), decoded),
    );
    if (target === '..' || target.startsWith('../'))
      return fail(node, 'Local URL escapes the repository.');
    const mapped =
      mapping.get(target) ?? portableMapping.get(portableKey(target)) ?? target;
    const relative = posix.relative(posix.dirname(next), mapped) || '.';
    if (mapped === target && posix.dirname(previous) === posix.dirname(next))
      return url;
    return (
      relative
        .split('/')
        .map((segment) =>
          encodeURIComponent(segment).replace(/[()]/gu, (value) =>
            value === '(' ? '%28' : '%29',
          ),
        )
        .join('/') +
      (pathname.endsWith('/') ? '/' : '') +
      suffix
    );
  }
  function destination(node) {
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    if (start === undefined || end === undefined)
      return fail(node, 'Cannot locate the Markdown destination.');
    let index = start + (text[start] === '!' ? 1 : 0);
    if (text[index] !== '[')
      return fail(node, 'Unsupported Markdown destination.');
    let depth = 0;
    for (; index < end; index++) {
      if (text[index] === '\\') {
        index++;
        continue;
      }
      if (text[index] === '`') {
        let length = 1;
        while (text[index + length] === '`') length++;
        const closing = text.indexOf('`'.repeat(length), index + length);
        if (closing >= 0 && closing < end) {
          index = closing + length - 1;
          continue;
        }
      }
      if (text[index] === '[') depth++;
      if (text[index] === ']' && --depth === 0) break;
    }
    if (text[index + 1] !== (node.type === 'definition' ? ':' : '('))
      return fail(node, 'Cannot safely locate the Markdown destination.');
    index += 2;
    while (/\s/u.test(text[index] ?? '') && index < end) index++;
    if (text[index] === '<') {
      const first = ++index;
      while (index < end) {
        if (text[index] === '\\') index += 2;
        else if (text[index] === '>') return [first, index];
        else index++;
      }
    } else {
      const first = index;
      let parentheses = 0;
      while (index < end) {
        const value = text[index];
        if (value === '\\') {
          index += 2;
          continue;
        }
        if (value === '(') parentheses++;
        if (value === ')') {
          if (!parentheses) break;
          parentheses--;
        }
        if (/\s/u.test(value)) break;
        index++;
      }
      return [first, index];
    }
    return fail(node, 'Cannot safely locate the Markdown destination.');
  }
  function characterReference(value) {
    const paragraph = parseMarkdown(value).children[0];
    if (paragraph?.type !== 'paragraph' || paragraph.children.length !== 1)
      return value;
    const child = paragraph.children[0];
    return child?.type === 'text' ? child.value : value;
  }
  function htmlUrl(value, node) {
    return value.replace(
      /&(?:#[xX][\da-fA-F]+|#\d+|[A-Za-z][A-Za-z0-9]*);?/gu,
      (entity, offset) => {
        if (!entity.endsWith(';')) {
          if (
            !entity.startsWith('&#') &&
            /[=A-Za-z0-9]/u.test(value[offset + entity.length] ?? '')
          )
            return entity;
          if (
            entity.startsWith('&#') ||
            characterReference(entity + ';') !== entity + ';'
          )
            return fail(
              node,
              'Ambiguous HTML character reference; write the URL explicitly before migration.',
            );
          return entity;
        }
        return characterReference(entity);
      },
    );
  }
  function suffixOffset(raw) {
    for (let index = 0; index < raw.length; index++) {
      if (
        raw[index] === '\\' &&
        /[!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~]/u.test(raw[index + 1] ?? '')
      ) {
        if (raw[index + 1] === '#' || raw[index + 1] === '?') return index;
        index++;
        continue;
      }
      if (raw[index] === '&') {
        const entity =
          /^&(?:#[xX][\da-fA-F]+|#\d+|[A-Za-z][A-Za-z0-9]*);/u.exec(
            raw.slice(index),
          )?.[0];
        if (entity) {
          const decoded = characterReference(entity);
          if (decoded === '#' || decoded === '?') return index;
          if (decoded !== entity) {
            index += entity.length - 1;
            continue;
          }
        }
      }
      if (raw[index] === '#' || raw[index] === '?') return index;
    }
    return -1;
  }
  const uses = new Map();
  for (const node of nodes) {
    if (node.type !== 'linkReference' && node.type !== 'imageReference')
      continue;
    const contexts = uses.get(node.identifier) ?? new Set();
    contexts.add(inCard(node));
    uses.set(node.identifier, contexts);
  }
  const edits = [];
  for (const node of nodes) {
    if (node.type === 'html') {
      const html = node.value.replace(/<!--[\s\S]*?-->/gu, '');
      for (const tag of html.matchAll(
        /<[A-Za-z][\w:-]*(?:[^"'<>]|"[^"]*"|'[^']*')*>/gu,
      )) {
        const attributes =
          /\s+([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/gy;
        attributes.lastIndex = /^<[A-Za-z][\w:-]*/u.exec(tag[0])[0].length;
        let attribute;
        while ((attribute = attributes.exec(tag[0]))) {
          if (!/^(?:href|src)$/iu.test(attribute[1])) continue;
          const raw = attribute[2] ?? attribute[3] ?? attribute[4];
          if (raw === undefined) continue;
          if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\?)/iu.test(raw)) continue;
          const url = htmlUrl(raw, node);
          const card = inCard(node);
          const movedBase =
            !card && posix.dirname(oldOutput) !== posix.dirname(newOutput);
          const local =
            !!url && !/^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\?)/iu.test(url);
          if (rewrite(url, card, node) !== url || (local && movedBase))
            fail(
              node,
              'Rebase the affected HTML href/src reference explicitly before migration.',
            );
        }
      }
      continue;
    }
    if (
      node.type !== 'link' &&
      node.type !== 'image' &&
      node.type !== 'definition'
    )
      continue;
    const contexts =
      node.type === 'definition'
        ? (uses.get(node.identifier) ?? new Set([inCard(node)]))
        : new Set([inCard(node)]);
    const results = new Set(
      [...contexts].map((card) => rewrite(node.url, card, node)),
    );
    if (results.size !== 1)
      fail(
        node,
        'Shared reference definition needs incompatible card/body URLs.',
      );
    const value = [...results][0];
    if (value === node.url) continue;
    const [start, end] = destination(node);
    const raw = text.slice(start, end);
    const rawSuffix = suffixOffset(raw);
    const valueSuffix = value.search(/[?#]/u);
    if (rawSuffix < 0 !== valueSuffix < 0)
      fail(node, 'Cannot safely preserve the Markdown URL suffix.');
    edits.push({
      start,
      end,
      value:
        rawSuffix >= 0 && valueSuffix >= 0
          ? value.slice(0, valueSuffix) + raw.slice(rawSuffix)
          : value,
    });
  }
  for (const edit of edits.sort((a, b) => b.start - a.start))
    text = text.slice(0, edit.start) + edit.value + text.slice(edit.end);
  return text;
}
