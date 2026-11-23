import { validate as conventions } from '../.agents/skills/agentscli-adm-write-conventions/scripts/check.mjs';
import { validate as entrypoint } from '../.agents/skills/agentscli-adm-edit-agents/scripts/check.mjs';
import { validate as packages } from '../.agents/skills/agentscli-adm-publish-packages/scripts/check.mjs';
import { readdirSync, lstatSync } from 'node:fs';
import { resolve } from 'node:path';

const base = resolve('.agents/skills');
const expected = [
  'agentscli-adm-edit-agents',
  'agentscli-adm-publish-packages',
  'agentscli-adm-write-conventions',
];
const actual = readdirSync(base)
  .filter((name) => name.startsWith('agentscli-'))
  .sort();
if (JSON.stringify(actual) !== JSON.stringify(expected)) {
  throw new Error(
    'Expected exactly three independent administrative skill sources.',
  );
}
for (const name of actual) {
  const stat = lstatSync(resolve(base, name));
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error(`Unsafe administrative skill source: ${name}`);
  }
}

for (const validate of [conventions, entrypoint, packages]) {
  console.log(JSON.stringify(validate()));
}
