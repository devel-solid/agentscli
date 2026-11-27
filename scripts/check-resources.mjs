import * as fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { packageAssets } from './package-assets.mjs';
import {
  disk,
  execute,
  PRODUCT_SKILLS,
  walk,
} from '../assets/templates/skills/agentscli-build-agents/scripts/lib/index.mjs';
import { validate } from '../.agents/skills/agentscli-publish-package/scripts/check.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = fs.mkdtempSync(join(tmpdir(), 'agentscli-resources-'));
try {
  await packageAssets(root, {
    output: temporary,
  });
  const resources = {
    skills: Object.fromEntries(
      PRODUCT_SKILLS.map((id) => {
        const directory = `skills/${id}`;
        return [
          id,
          Object.fromEntries(
            walk(disk, temporary, directory).map((path) => [
              path.slice(directory.length + 1),
              fs.readFileSync(resolve(temporary, path)),
            ]),
          ),
        ];
      }),
    ),
  };
  const { exitCode, result } = await execute(
    'update',
    { repoRoot: root, dryRun: true },
    { resources },
  );
  console.log(JSON.stringify(result));
  if (exitCode || result.changes.length) {
    if (result.changes.length)
      console.error(
        'Managed resources differ. Run pnpm run dogfood and review the diff.',
      );
    process.exitCode = exitCode || 1;
  }
  const index = await execute('sync', { repoRoot: root, check: true });
  console.log(JSON.stringify(index.result));
  if (index.exitCode) {
    process.exitCode = Math.max(process.exitCode ?? 0, index.exitCode);
    if (index.exitCode === 1)
      console.error(
        'Generated index differs. Run pnpm run dogfood and review the diff.',
      );
  }
  console.log(JSON.stringify(validate(root)));
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
