import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const tests = readdirSync(new URL('../tests/unit/', import.meta.url))
  .filter((name) => name.endsWith('.test.mjs'))
  .sort()
  .map((name) =>
    fileURLToPath(new URL(`../tests/unit/${name}`, import.meta.url)),
  );
if (!tests.length) throw new Error('No hub unit tests found.');
const result = spawnSync(process.execPath, ['--test', ...tests], {
  stdio: 'inherit',
  windowsHide: true,
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
