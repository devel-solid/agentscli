import assert from 'node:assert/strict';
import test from 'node:test';
import { join } from 'node:path';
import { validateConvention } from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/markdown.mjs';
import { render } from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/render.mjs';
import { execute } from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/runtime.mjs';
import { memory } from './memory.mjs';

const path = '.agentscli/conventions/test-focus.md';
const body = '\n# Test focus\n\nTest one observable behavior at a time.\n';
const hash = '0123456789abcdef'.repeat(4);
const document = (metadata = '') =>
  `---\ntrigger: Read when defining test cases.\n${metadata}---\n${body}`;
const input = (text) => [{ path, text }];

test('legacy conventions and either optional review field retain the parser result', () => {
  const expected = validateConvention(document(), path);
  for (const metadata of [
    `reviewedHash: '${hash}'\n`,
    "reviewPolicyVersion: '1'\n",
    `reviewedHash: '${hash}'\nreviewPolicyVersion: '2'\n`,
  ]) {
    assert.deepEqual(validateConvention(document(metadata), path), expected);
  }
});

test('review metadata accepts only SHA-256 hex strings and positive decimal version strings', () => {
  for (const metadata of [
    'reviewedHash: null\n',
    'reviewedHash: 123\n',
    'reviewedHash: true\n',
    "reviewedHash: ''\n",
    `reviewedHash: '${'a'.repeat(63)}'\n`,
    `reviewedHash: '${'a'.repeat(65)}'\n`,
    `reviewedHash: '${hash.toUpperCase()}'\n`,
    `reviewedHash: 'sha256:${hash}'\n`,
    `reviewedHash: ['${hash}']\n`,
    'reviewPolicyVersion: 1\n',
    'reviewPolicyVersion: true\n',
    'reviewPolicyVersion: null\n',
    "reviewPolicyVersion: ''\n",
    "reviewPolicyVersion: '0'\n",
    "reviewPolicyVersion: '-1'\n",
    "reviewPolicyVersion: '01'\n",
    "reviewPolicyVersion: '1.0'\n",
    "reviewPolicyVersion: ' 1'\n",
    "reviewPolicyVersion: ['1']\n",
  ]) {
    assert.throws(
      () => validateConvention(document(metadata), path),
      (error) =>
        error.code === 'SOURCE_REVIEW_METADATA' &&
        error.exitCode === 2 &&
        error.path === path,
      metadata,
    );
  }
});

test('tracking metadata does not relax the remaining convention schema or YAML rules', () => {
  for (const metadata of [
    "lastReviewed: '2026-11-26'\n",
    "lastModified: '2026-11-26'\n",
    `reviewedHash: '${hash}'\nreviewedHash: '${hash}'\n`,
    "reviewPolicyVersion: '1'\nreviewPolicyVersion: '2'\n",
    `reviewedHash: &hash '${hash}'\nreviewPolicyVersion: *hash\n`,
    'reviewPolicyVersion: !!str 1\n',
  ])
    assert.throws(() => validateConvention(document(metadata), path), metadata);
  for (const text of [
    document(`reviewedHash: '${hash}'\n`).replace('trigger:', 'unknown:'),
    document("reviewPolicyVersion: '1'\n").replace(
      'Read when defining test cases.',
      '',
    ),
    document(`reviewedHash: '${hash}'\n`) + '\n# Second live title\n',
  ])
    assert.throws(() => validateConvention(text, path));
});

test('recording review metadata does not alter the generated index or authored bytes', async () => {
  const initial = document().replaceAll('\n', '\r\n');
  const reviewed =
    '\uFEFF' +
    document(`reviewedHash: '${hash}'\nreviewPolicyVersion: '1'\n`).replaceAll(
      '\n',
      '\r\n',
    );
  assert.equal(
    render(input(document())).get('AGENTS.md'),
    render(
      input(document(`reviewedHash: '${hash}'\nreviewPolicyVersion: '1'\n`)),
    ).get('AGENTS.md'),
  );
  const state = memory({ [path]: initial });
  const invoke = (command, options = {}) =>
    execute(command, { repoRoot: state.root, ...options }, { io: state.io });
  assert.equal((await invoke('sync')).exitCode, 0);
  const index = state.text('AGENTS.md');
  state.put(path, reviewed);
  const before = state.writes.length;
  assert.equal((await invoke('validate')).exitCode, 0);
  assert.equal(
    (await invoke('sync', { dryRun: true })).result.changes.length,
    0,
  );
  assert.equal((await invoke('sync', { check: true })).exitCode, 0);
  assert.equal((await invoke('sync')).result.changes.length, 0);
  assert.equal(state.writes.length, before);
  assert.equal(state.text('AGENTS.md'), index);
  assert.deepEqual(
    state.io.read(join(state.root, path)),
    new TextEncoder().encode(reviewed),
  );
});

test('malformed review metadata blocks validation and sync before writing an index', async () => {
  const authored = document(
    "reviewedHash: 'broken'\nreviewPolicyVersion: '1'\n",
  );
  const state = memory({ [path]: authored });
  for (const [command, options] of [
    ['validate', {}],
    ['sync', {}],
    ['sync', { dryRun: true }],
    ['sync', { check: true }],
  ]) {
    const response = await execute(
      command,
      { repoRoot: state.root, ...options },
      { io: state.io },
    );
    assert.equal(response.exitCode, 2);
    assert.equal(response.result.diagnostics[0].code, 'SOURCE_REVIEW_METADATA');
    assert.equal(state.writes.length, 0);
    assert.equal(state.text(path), authored);
  }
});
