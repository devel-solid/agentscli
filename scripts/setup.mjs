import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const major = Number(process.versions.node.split('.')[0]);
if (![22, 24, 26].includes(major)) {
  console.error('Install Node.js 22, 24, or 26, then run pnpm run setup.');
  process.exit(2);
}
if (spawnSync('git', ['--version'], { stdio: 'inherit' }).status !== 0) {
  console.error('Install Git and make its executable available on PATH.');
  process.exit(2);
}
const root = fileURLToPath(new URL('../', import.meta.url));
const configured = spawnSync(
  'git',
  ['-C', root, 'config', '--get', 'core.hooksPath'],
  { encoding: 'utf8' },
);
if (configured.status !== 0 && configured.status !== 1) {
  console.error('Unable to read the Git hooks configuration.');
  process.exit(configured.status ?? 1);
}
if (configured.status === 0 && configured.stdout.trim() !== '.githooks') {
  console.error(
    'A custom core.hooksPath is already configured. Resolve it before running setup; it was not changed.',
  );
  process.exit(2);
}
const result = spawnSync(
  'git',
  ['-C', root, 'config', '--local', 'core.hooksPath', '.githooks'],
  { stdio: 'inherit' },
);
if (result.error) console.error('Unable to configure the Git pre-push hook.');
process.exitCode = result.status ?? 1;
if (result.status === 0)
  console.log('Git pre-push hook configured in .githooks.');
