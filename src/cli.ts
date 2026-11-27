#!/usr/bin/env node
import { readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import type {
  execute,
  PublicCommand as Command,
  ExecuteOptions,
  RuntimeResult,
} from '#engine';

const version = (
  JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  ) as {
    version: string;
  }
).version;

export function helpText(packageVersion = version): string {
  return `agentscli ${packageVersion} — install project convention skills

Usage:
  agentscli init [--dry-run]
  agentscli update [--dry-run]
  agentscli --help
  agentscli --version

Common options: --repo-root <directory>, --json.

init creates .agentscli/conventions/ if needed and installs the three product skills.
update refreshes all product skills from this CLI version; it requires at least one
installed product SKILL.md with matching name, generator identity and valid version.
Missing skill files are repaired; ambiguous existing entries require manual recovery.
Both commands replace managed skill trees and remove obsolete files. Conventions,
AGENTS.md, local skills, Git state and unrelated files stay preserved. --dry-run
previews without writes. Repeat init safely to prepare an existing project.
The former agentscli-refactor-conventions tree is preserved; remove it manually
after installing agentscli-optimize-conventions with init or update.
Use agentscli-write-conventions to create or edit conventions, then
agentscli-build-agents to validate them and generate/check AGENTS.md.
Use agentscli-optimize-conventions to audit conventions and propose a reorganization.
Approval is required for content or structural changes. During review, the skill
may record or invalidate review metadata; instructions to write no files prevent
those metadata writes too.
After partial failure repeat the same authorized operation; there is no rollback.
Exit codes: 0 success; 2 usage/validation/conflict; 3 operational failure.
`;
}

type ParsedArguments =
  | { action: 'help' | 'version'; json: boolean }
  | {
      action: 'execute';
      command: Command;
      options: ExecuteOptions;
      json: boolean;
    };

export function parseArguments(
  args: string[],
  cwd = process.cwd(),
): ParsedArguments {
  const { values, positionals, tokens } = parseArgs({
    args,
    strict: true,
    allowPositionals: true,
    tokens: true,
    options: {
      'repo-root': { type: 'string' },
      json: { type: 'boolean' },
      help: { type: 'boolean' },
      version: { type: 'boolean' },
      'dry-run': { type: 'boolean' },
    },
  });
  const seen = new Set<string>();
  for (const token of tokens) {
    if (token.kind !== 'option') continue;
    if (seen.has(token.name))
      throw new Error(`Repeated option: --${token.name}.`);
    seen.add(token.name);
  }
  const json = values.json === true;
  if (values.version) {
    if (positionals.length || seen.size !== 1)
      throw new Error('Use --version by itself.');
    return { action: 'version', json: false };
  }
  if (positionals.length > 1)
    throw new Error('Expected one command: init or update.');
  const command = positionals[0];
  if (command && !['init', 'update'].includes(command))
    throw new Error(`Unknown command: ${command}. Use agentscli --help.`);
  if (!command && !values.help)
    throw new Error('Choose init or update. Use agentscli --help.');
  const allowed: Record<string, string[]> = {
    init: ['dry-run'],
    update: ['dry-run'],
  };
  for (const name of seen) {
    if (['repo-root', 'json', 'help'].includes(name)) continue;
    if (!command || !allowed[command]!.includes(name))
      throw new Error(`--${name} does not apply to ${command ?? 'help'}.`);
  }
  for (const name of ['repo-root'] as const) {
    if (values[name] !== undefined && !values[name]!.trim())
      throw new Error(`Provide a nonempty value for --${name}.`);
  }
  if (values.help) return { action: 'help', json };
  return {
    action: 'execute',
    command: command as Command,
    json,
    options: {
      repoRoot: resolve(cwd, values['repo-root'] ?? '.'),
      ...(values['dry-run'] ? { dryRun: true } : {}),
    },
  };
}

interface CliDependencies {
  execute?: typeof execute;
  cwd?: string;
  version?: string;
}
interface CliResponse {
  exitCode: number;
  stdout: string;
  stderr: string;
}

function describeResult(
  result: RuntimeResult,
  preview: boolean,
): Omit<CliResponse, 'exitCode'> {
  const lines = result.changes.map(
    (change) => `${change.status} ${change.action}: ${change.path}`,
  );
  if (result.ok && !result.changes.length)
    lines.unshift('Everything is up to date.');
  else if (preview) lines.unshift('Planned changes; no files written.');
  const diagnostics = result.diagnostics.map(
    (item) =>
      `${item.code}: ${item.path ? `${item.path}: ` : ''}${item.message}`,
  );
  return {
    stdout: lines.length ? lines.join('\n') + '\n' : '',
    stderr: diagnostics.length ? diagnostics.join('\n') + '\n' : '',
  };
}

function failure(
  command: string,
  code: string,
  message: string,
  json: boolean,
  exitCode: number,
): CliResponse {
  const result = {
    schemaVersion: 1,
    command,
    ok: false,
    changes: [],
    diagnostics: [{ code, message }],
  };
  return json
    ? { exitCode, stdout: JSON.stringify(result) + '\n', stderr: '' }
    : { exitCode, stdout: '', stderr: `${code}: ${message}\n` };
}

export async function runCli(
  args: string[],
  dependencies: CliDependencies = {},
): Promise<CliResponse> {
  let parsed: ParsedArguments;
  try {
    parsed = parseArguments(args, dependencies.cwd);
  } catch (error) {
    return failure(
      args.find((arg) => ['init', 'update'].includes(arg)) ?? 'unknown',
      'USAGE',
      error instanceof Error ? error.message : 'Invalid arguments.',
      args.includes('--json'),
      2,
    );
  }
  if (parsed.action !== 'execute') {
    const text =
      parsed.action === 'version'
        ? (dependencies.version ?? version) + '\n'
        : helpText(dependencies.version);
    return {
      exitCode: 0,
      stdout: parsed.json
        ? JSON.stringify({
            schemaVersion: 1,
            command: parsed.action,
            ok: true,
            changes: [],
            diagnostics: [],
            text,
          }) + '\n'
        : text,
      stderr: '',
    };
  }
  try {
    const engine = dependencies.execute ?? (await import('#engine')).execute;
    const { exitCode, result } = await engine(parsed.command, parsed.options);
    return parsed.json
      ? { exitCode, stdout: JSON.stringify(result) + '\n', stderr: '' }
      : {
          exitCode,
          ...describeResult(result, parsed.options.dryRun === true),
        };
  } catch (error) {
    return failure(
      parsed.command,
      'OPERATION_FAILED',
      error instanceof Error ? error.message : 'Operation failed.',
      parsed.json,
      3,
    );
  }
}

function isEntryPoint(): boolean {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
}

if (isEntryPoint()) {
  const response = await runCli(process.argv.slice(2));
  process.stdout.write(response.stdout);
  process.stderr.write(response.stderr);
  process.exitCode = response.exitCode;
}
