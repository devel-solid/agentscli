import * as fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { packageAssets } from '../packages/agentscli/scripts/package-assets.mjs';
import {
  disk,
  execute,
  PRODUCT_SKILLS,
  walk,
} from '../packages/agentscli/assets/templates/skills/agentscli-build-agents/scripts/lib/index.mjs';
import { validate } from '../.agents/skills/agentscli-publish-packages/scripts/check.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = fs.mkdtempSync(join(tmpdir(), 'agentscli-resources-'));
try {
  await packageAssets(resolve(root, 'packages/agentscli'), {
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
    'apply',
    { repoRoot: root, dryRun: true },
    { resources },
  );
  console.log(JSON.stringify(result));
  if (exitCode || result.changes.length) {
    if (result.changes.length)
      console.error(
        'Managed resources differ. Run npm run dogfood and review the diff.',
      );
    process.exitCode = exitCode || 1;
  } else console.log(JSON.stringify(validate(root)));
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
