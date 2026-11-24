import { containedPath } from './paths.mjs';
import { EngineError } from './manifest.mjs';
import {
  checkRoot,
  assertClientContext,
  disk,
  inspect,
  removeFile,
  replaceFile,
} from './io.mjs';
import { loadResources, plan } from './plan.mjs';
import { planMigration } from './migration.mjs';
const diagnostic = (error) => ({
  code: error instanceof EngineError ? error.code : 'IO_FAILURE',
  message: error instanceof Error ? error.message : 'File operation failed.',
  ...(error?.path ? { path: error.path } : {}),
});
export function applyEffects(io, root, effects) {
  const changes = effects.map(({ path, action }) => ({
    path,
    action,
    status: 'pending',
  }));
  let completed = 0;
  try {
    for (const effect of effects) {
      effect.precondition?.(io, root);
      if (effect.action === 'delete') {
        if (effect.directory) {
          if (inspect(io, root, effect.path, 'directory'))
            io.rmdir(containedPath(root, effect.path));
        } else removeFile(io, root, effect.path, effect.previous);
      } else {
        replaceFile(io, root, effect.path, effect.content, effect.previous);
      }
      changes[completed].status = 'completed';
      completed++;
    }
    return { exitCode: 0, ok: true, changes, diagnostics: [] };
  } catch (error) {
    return {
      exitCode: 3,
      ok: false,
      changes,
      diagnostics: [
        diagnostic(error),
        {
          code: 'RETRY_OPERATION',
          message: `${completed} of ${effects.length} effects completed. Fix the error and repeat the same authorized operation; no rollback was performed.`,
        },
      ],
    };
  }
}
export async function execute(command, options, dependencies = {}) {
  const result = {
    schemaVersion: 1,
    command,
    ok: true,
    changes: [],
    diagnostics: [],
  };
  try {
    if (!['apply', 'validate', 'sync'].includes(command))
      throw new EngineError(
        'USAGE',
        'Expected apply or a private validate/sync mode.',
      );
    if (options.migrate && (command !== 'apply' || options.check))
      throw new EngineError('USAGE', '--migrate applies only to apply.');
    const io = dependencies.io ?? disk,
      root = checkRoot(io, options.repoRoot);
    assertClientContext(io, root);
    const resources =
      command === 'apply'
        ? (dependencies.resources ?? loadResources())
        : undefined;
    const effects = options.migrate
      ? planMigration(io, root, resources, options.language)
      : plan(io, root, command, resources, options.language);
    if (command === 'validate') return { exitCode: 0, result };
    if (options.dryRun || options.check) {
      result.changes = effects.map(({ path, action }) => ({
        path,
        action,
        status: 'pending',
      }));
      const exitCode = options.check && effects.length ? 1 : 0;
      result.ok = exitCode === 0;
      return { exitCode, result };
    }
    const applied = applyEffects(io, root, effects);
    if (options.migrate && !applied.ok) {
      const retry = applied.diagnostics.find(
        (d) => d.code === 'RETRY_OPERATION',
      );
      if (retry) {
        retry.code = 'RETRY_MIGRATION';
        retry.message +=
          ' Repeat agentscli apply --migrate with the same options.';
      }
    }
    Object.assign(result, {
      ok: applied.ok,
      changes: applied.changes,
      diagnostics: applied.diagnostics,
    });
    return { exitCode: applied.exitCode, result };
  } catch (error) {
    result.ok = false;
    result.diagnostics.push(diagnostic(error));
    return {
      exitCode: error instanceof EngineError ? error.exitCode : 3,
      result,
    };
  }
}
