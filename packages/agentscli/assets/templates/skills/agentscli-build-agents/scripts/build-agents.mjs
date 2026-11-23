import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execute } from './lib/index.mjs';
export async function run(args = process.argv.slice(2), dependencies = {}) {
  let command = 'unknown',
    json = args.includes('--json');
  try {
    const { values, positionals, tokens } = parseArgs({
      args,
      allowPositionals: true,
      tokens: true,
      strict: true,
      options: {
        'repo-root': { type: 'string' },
        json: { type: 'boolean' },
        'dry-run': { type: 'boolean' },
        check: { type: 'boolean' },
      },
    });
    const seen = tokens.filter((t) => t.kind === 'option').map((t) => t.name);
    command = positionals[0] ?? 'unknown';
    if (
      positionals.length !== 1 ||
      !['validate', 'sync'].includes(command) ||
      new Set(seen).size !== seen.length ||
      (values['dry-run'] && values.check) ||
      (command === 'validate' && (values['dry-run'] || values.check)) ||
      (values['repo-root'] !== undefined && !values['repo-root'].trim())
    )
      throw new Error(
        'Use validate or sync [--dry-run | --check], with --repo-root and --json.',
      );
    return await execute(
      command,
      {
        repoRoot: resolve(values['repo-root'] ?? '.'),
        dryRun: values['dry-run'],
        check: values.check,
      },
      dependencies,
    );
  } catch (error) {
    return {
      exitCode: 2,
      result: {
        schemaVersion: 1,
        command,
        ok: false,
        changes: [],
        diagnostics: [{ code: 'USAGE', message: error.message }],
      },
    };
  }
}
if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  const response = await run();
  process.stdout.write(JSON.stringify(response.result) + '\n');
  process.exitCode = response.exitCode;
}
