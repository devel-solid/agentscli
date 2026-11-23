import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('../tests/unit/', import.meta.url);
const files = readdirSync(root)
  .filter((file) => file.endsWith('.test.mjs'))
  .sort()
  .map((file) => fileURLToPath(new URL(file, root)));
if (!files.length) throw new Error('No root unit tests found.');
const result = spawnSync(process.execPath, ['--test', ...files], {
  stdio: 'inherit',
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
