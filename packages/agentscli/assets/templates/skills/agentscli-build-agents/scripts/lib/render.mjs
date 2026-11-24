import {
  inlineTrigger,
  validateConvention,
  validateConventionFilename,
} from './markdown.mjs';
import { portableKey } from './paths.mjs';
function link(path) {
  return path
    .split('/')
    .map((part) =>
      encodeURIComponent(part).replace(/[()]/gu, (character) =>
        character === '(' ? '%28' : '%29',
      ),
    )
    .join('/');
}
export const INDEX_HEADER =
  '---\ngeneratedBy: "@devel-solid/agentscli"\n---\n\n# AGENTS.md\n';
export function render(conventions) {
  const outputs = new Map();
  const ordered = [...conventions].sort((a, b) => {
    const left = portableKey(a.path),
      right = portableKey(b.path);
    return left < right ? -1 : left > right ? 1 : 0;
  });
  const entries = ordered.map((input) => {
    const parsed = validateConvention(input.text, input.path);
    validateConventionFilename(parsed.title, input.path);
    const title = parsed.title
      .replace(/\s+/gu, ' ')
      .replace(/[\\`*{}\[\]<>()!_#|~]/gu, '\\$&');
    const trigger = inlineTrigger(parsed.trigger);
    return `- [${title}](${link(input.path)}): ${trigger}`;
  });
  outputs.set(
    'AGENTS.md',
    INDEX_HEADER + (entries.length ? '\n' + entries.join('\n') + '\n' : ''),
  );
  return outputs;
}
