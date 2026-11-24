import {
  GENERATED,
  inlineTrigger,
  validateConvention,
  validateLegacyConvention,
  validateConventionFilename,
} from './markdown.mjs';
import { portableKey } from './paths.mjs';
function notice(source, language) {
  const message =
    language === 'pt-br'
      ? `Arquivo gerado. Edite o template ${source}; alterações diretas serão sobrescritas.`
      : `Generated file. Edit the template ${source}; direct changes will be overwritten.`;
  return `${GENERATED}\n<!-- ${message} -->\n\n`;
}
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
export function render(conventions, language, { legacyLayout = false } = {}) {
  const outputs = new Map();
  const ordered = [...conventions].sort((a, b) => {
    const left = portableKey(a.output),
      right = portableKey(b.output);
    return left < right ? -1 : left > right ? 1 : 0;
  });
  const entries = ordered.map((input) => {
    const authoredSource = input.authoredSource ?? input.source;
    const parsed = legacyLayout
      ? validateLegacyConvention(input.text, authoredSource)
      : validateConvention(input.text, authoredSource);
    if (!legacyLayout) validateConventionFilename(parsed.title, authoredSource);
    outputs.set(input.output, notice(input.source, language) + parsed.body);
    const title = parsed.title
      .replace(/\s+/gu, ' ')
      .replace(/[\\`*{}\[\]<>()!_#|~]/gu, '\\$&');
    const trigger = inlineTrigger(parsed.card);
    return `- [${title}](${link(input.output)}): ${trigger}`;
  });
  outputs.set(
    'AGENTS.md',
    INDEX_HEADER + (entries.length ? '\n' + entries.join('\n') + '\n' : ''),
  );
  return outputs;
}
