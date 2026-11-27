import { containedPath } from './paths.mjs';
import { EngineError } from './contracts.mjs';
import {
  checkRoot,
  assertProjectTarget,
  createDirectory,
  disk,
  inspect,
  removeFile,
  replaceFile,
} from './io.mjs';
import { loadResources, plan } from './plan.mjs';
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
      if (effect.action === 'delete') {
        if (effect.directory) {
          if (inspect(io, root, effect.path, 'directory'))
            io.rmdir(containedPath(root, effect.path));
        } else removeFile(io, root, effect.path, effect.previous);
      } else if (effect.directory) {
        createDirectory(io, root, effect.path);
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
    if (!['init', 'update', 'validate', 'sync'].includes(command))
      throw new EngineError(
        'USAGE',
        'Expected init, update, or a private validate/sync mode.',
      );
    const io = dependencies.io ?? disk,
      root = checkRoot(io, options.repoRoot);
    assertProjectTarget(io, root);
    const resources =
      command === 'init' || command === 'update'
        ? (dependencies.resources ?? loadResources())
        : undefined;
    const effects = plan(io, root, command, resources);
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
