import {
  GENERATED,
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
    const left = portableKey(a.output),
      right = portableKey(b.output);
    return left < right ? -1 : left > right ? 1 : 0;
  });
  const entries = ordered.map((input) => {
    const parsed = validateConvention(input.text, input.source);
    validateConventionFilename(parsed.title, input.source);
    outputs.set(input.output, `${GENERATED}\n\n${parsed.body}`);
    const title = parsed.title
      .replace(/\s+/gu, ' ')
      .replace(/[\\`*{}\[\]<>()!_#|~]/gu, '\\$&');
    const trigger = inlineTrigger(parsed.trigger);
    return `- [${title}](${link(input.output)}): ${trigger}`;
  });
  outputs.set(
    'AGENTS.md',
    INDEX_HEADER + (entries.length ? '\n' + entries.join('\n') + '\n' : ''),
  );
  return outputs;
}
