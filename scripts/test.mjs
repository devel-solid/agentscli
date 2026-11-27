import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const tests = readdirSync(new URL('../tests/unit/', import.meta.url))
  .filter((file) => file.endsWith('.test.mjs'))
  .sort()
  .map((file) => new URL(`../tests/unit/${file}`, import.meta.url));
if (!tests.length) throw new Error('No unit tests found in tests/unit.');
const result = spawnSync(
  process.execPath,
  ['--test', ...tests.map(fileURLToPath)],
  {
    stdio: 'inherit',
  },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
