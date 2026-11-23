import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { inspectHub } from './support.mjs';
export function validate(root, options = {}) {
  return inspectHub(root, { ...options, scope: 'shared-skills' });
}
export function main(args, { log = console.log, error = console.error } = {}) {
  if (args.length !== 2 || args[0] !== '--repo-root' || !args[1]) {
    error('Usage: validate.mjs --repo-root <hub>');
    return 2;
  }
  try {
    const result = validate(path.resolve(args[1]));
    log(
      JSON.stringify({
        ok: true,
        scope: 'shared-skills',
        conventions: result.conventions.size,
        skills: result.skills.size,
      }),
    );
    return 0;
  } catch (cause) {
    error(
      JSON.stringify({
        ok: false,
        code: cause.code ?? 'operation',
        file: cause.file ?? '',
        message: cause.message,
      }),
    );
    return cause.code ? 2 : 3;
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
)
  process.exitCode = main(process.argv.slice(2));
