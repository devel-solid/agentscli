import {
  GENERATED,
  validateConvention,
  validateLegacyConvention,
  validateConventionFilename,
  validateTemplate,
} from './markdown.mjs';
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
export function render(
  main,
  conventions,
  language,
  { legacyLayout = false } = {},
) {
  const template = validateTemplate(main.text, main.source),
    outputs = new Map();
  const entries = conventions.map((input) => {
    const authoredSource = input.authoredSource ?? input.source;
    const parsed = legacyLayout
      ? validateLegacyConvention(input.text, authoredSource)
      : validateConvention(input.text, authoredSource);
    if (!legacyLayout) validateConventionFilename(parsed.title, authoredSource);
    outputs.set(input.output, notice(input.source, language) + parsed.body);
    const title = (parsed.title || 'Convention').replace(/[\\[\]]/gu, '\\$&');
    return `- [${title}](${link(input.output)})\n${parsed.card
      .split('\n')
      .map((line) => `  ${line}`)
      .join('\n')}`;
  });
  const lines = template.text.split('\n');
  lines.splice(template.insertion, 1, entries.join('\n\n'));
  outputs.set(
    'AGENTS.md',
    notice(main.source, language) + lines.join('\n').trimEnd() + '\n',
  );
  return outputs;
}
