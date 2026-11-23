#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { runCli } from './runtime.js';
const metadata = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);
process.exitCode = await runCli(process.argv.slice(2), {
  version: metadata.version,
});
