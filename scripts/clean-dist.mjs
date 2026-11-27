import { existsSync, lstatSync, realpathSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { basename, dirname, resolve } from 'node:path';
const root = realpathSync(fileURLToPath(new URL('../', import.meta.url)));
const target = resolve(root, 'dist');
if (dirname(target) !== root || basename(target) !== 'dist')
  throw new Error('Build destination is outside the project.');
if (
  existsSync(target) &&
  (lstatSync(target).isSymbolicLink() || dirname(realpathSync(target)) !== root)
)
  throw new Error('The dist directory must not use an alias.');
rmSync(target, { recursive: true, force: true });
