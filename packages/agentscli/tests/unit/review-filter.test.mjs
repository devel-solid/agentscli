import assert from 'node:assert/strict';
import test from 'node:test';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { memory } from './memory.mjs';
import {
  recordReview,
  invalidateReview,
  reviewHash,
  REVIEW_POLICY_VERSION,
  run,
  selectConventions,
} from '../../assets/templates/skills/agentscli-refactor-conventions/scripts/review-conventions.mjs';
import {
  frontmatter,
  normalizeText,
  parseMarkdown,
  validateConvention,
} from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/markdown.mjs';

const path = '.agentscli/conventions/test-focus.md';
const source =
  '---\ntrigger: Read when changing tests.\n---\n\n# Test focus\n\nOne behavior per test.\n';
const hash = reviewHash(source, path);
const otherPolicy = String(BigInt(REVIEW_POLICY_VERSION) + 1n);
const receipt = (
  text,
  file = path,
  policy = REVIEW_POLICY_VERSION,
  fingerprint = reviewHash(text, file),
) =>
  text.replace(
    '\n---\n',
    `\nreviewedHash: "${fingerprint}"\nreviewPolicyVersion: "${policy}"\n---\n`,
  );
const select = (state) =>
  selectConventions({ repoRoot: state.root }, { io: state.io });
const record = (state, options = {}) =>
  recordReview(
    {
      repoRoot: state.root,
      path,
      expectedHash: hash,
      expectedPolicyVersion: REVIEW_POLICY_VERSION,
      ...options,
    },
    { io: state.io },
  );
const invalidate = (state, options = {}) =>
  invalidateReview(
    {
      repoRoot: state.root,
      path,
      expectedHash: hash,
      expectedPolicyVersion: REVIEW_POLICY_VERSION,
      ...options,
    },
    { io: state.io },
  );

test('review hashes cover semantic frontmatter, body, examples and project-relative path while excluding receipt presentation', () => {
  const stamped = receipt(source);
  assert.equal(reviewHash(stamped, path), hash);
  assert.equal(
    reviewHash(
      stamped
        .replace(
          `reviewPolicyVersion: "${REVIEW_POLICY_VERSION}"`,
          `reviewPolicyVersion: "${otherPolicy}"`,
        )
        .replace(`"${hash}"`, `"${'0'.repeat(64)}"`),
      path,
    ),
    hash,
  );
  assert.equal(
    reviewHash('\uFEFF' + stamped.replaceAll('\n', '\r\n'), path),
    hash,
  );
  assert.equal(
    reviewHash(
      stamped.replace(
        'trigger: Read when changing tests.',
        "trigger: 'Read when changing tests.'",
      ),
      path,
    ),
    hash,
  );
  assert.equal(reviewHash(source, path.replaceAll('/', '\\')), hash);
  assert.notEqual(
    reviewHash(source.replace('changing tests', 'writing tests'), path),
    hash,
  );
  assert.notEqual(
    reviewHash(source.replace('# Test focus', '# **Test focus**'), path),
    hash,
  );
  assert.notEqual(
    reviewHash(
      source + '\nFor example, separate rejection from success.\n',
      path,
    ),
    hash,
  );
  assert.notEqual(
    reviewHash(source, '.agentscli/conventions/team/test-focus.md'),
    hash,
  );
});

test('selection is read-only and only matching content plus policy receipts are skipped', () => {
  const fixtures = [
    [
      'missing-both',
      source,
      ['missing-reviewed-hash', 'missing-review-policy-version'],
    ],
    [
      'missing-policy',
      receipt(source).replace(/^reviewPolicyVersion:.*\n/mu, ''),
      ['missing-review-policy-version'],
    ],
    [
      'missing-hash',
      receipt(source).replace(/^reviewedHash:.*\n/mu, ''),
      ['missing-reviewed-hash'],
    ],
    [
      'changed-policy',
      receipt(source, path, otherPolicy),
      ['policy-version-changed'],
    ],
    [
      'changed-content',
      receipt(source, path, REVIEW_POLICY_VERSION, '0'.repeat(64)),
      ['content-changed'],
    ],
    ['matching', receipt(source), []],
  ];
  for (const [name, text, reasons] of fixtures) {
    const state = memory({ [path]: text, 'AGENTS.md': '# Handwritten root\n' });
    const result = select(state);
    assert.equal(result.exitCode, 0, name);
    const entries = reasons.length
      ? result.result.candidates
      : result.result.skipped;
    assert.equal(entries.length, 1, name);
    assert.deepEqual(entries[0].reasons, reasons, name);
    assert.equal(entries[0].hash, hash, name);
    assert.equal(state.writes.length, 0);
    assert.equal(state.text(path), text);
  }
});

test('invalid input or receipt fields are candidates with diagnostics and can never be skipped', () => {
  for (const text of [
    source.replace('trigger:', 'unknown: true\ntrigger:'),
    source.replace('trigger: Read when changing tests.', 'trigger: []'),
    receipt(source).replace(`"${hash}"`, 'null'),
    receipt(source).replace(`"${hash}"`, '"invalid"'),
    receipt(source).replace(
      'reviewPolicyVersion: "1"',
      'reviewPolicyVersion: 1',
    ),
    receipt(source).replace(
      'reviewPolicyVersion: "1"',
      'reviewPolicyVersion: ""',
    ),
    new Uint8Array([255]),
  ]) {
    const state = memory({ [path]: text });
    const result = select(state);
    assert.equal(result.exitCode, 2);
    assert.deepEqual(result.result.candidates, [
      { path, reasons: ['invalid-input'] },
    ]);
    assert.equal(result.result.skipped.length, 0);
    assert.equal(result.result.diagnostics.length, 1);
    assert.equal(state.writes.length, 0);
  }
});

test('record preserves BOM, CRLF, trigger comments, body bytes and unrelated files; repeat is idempotent', () => {
  const original =
    '\uFEFF---\r\n# intro\r\ntrigger: "Read when changing tests." # retain this\r\n# tail\r\n---\r\n\r\n# Test focus\r\n\r\nOne behavior per test.\r\n';
  const state = memory({ [path]: original, 'notes/other.md': 'Unrelated\r\n' });
  const expectedHash = reviewHash(original, path);
  const preview = record(state, { expectedHash, dryRun: true });
  assert.equal(preview.exitCode, 0);
  assert.equal(preview.result.changes[0].status, 'pending');
  assert.equal(state.writes.length, 0);
  const applied = record(state, { expectedHash });
  assert.equal(applied.exitCode, 0, JSON.stringify(applied.result));
  assert.equal(applied.result.changes[0].status, 'completed');
  const updated = state.text(path);
  assert.equal(
    updated
      .replace(/^reviewedHash:.*\r\n/mu, '')
      .replace(/^reviewPolicyVersion:.*\r\n/mu, ''),
    original,
  );
  assert.equal(reviewHash(updated, path), expectedHash);
  assert.equal(state.text('notes/other.md'), 'Unrelated\r\n');
  assert.equal(select(state).result.skipped.length, 1);
  const writes = state.writes.length;
  assert.deepEqual(record(state, { expectedHash }).result.changes, []);
  assert.equal(state.writes.length, writes);
  assert.equal(state.text(path), updated);
});

test('flow mappings, block triggers and existing receipt comments survive recording without content changes', () => {
  for (const original of [
    '---\n{trigger: "Read when changing tests."}\n---\n\n# Test focus\n\nOne behavior per test.\n',
    '---\n{trigger: "Read when changing tests.", reviewedHash: "' +
      '0'.repeat(64) +
      '",}\n---\n\n# Test focus\n',
    '---\ntrigger: >-\n  Read when changing\n  tests.\n# trailing comment\n... # document end\n---\n\n# Test focus\n',
    '---\ntrigger: Read when changing tests.\nreviewedHash: "' +
      '0'.repeat(64) +
      '" # fingerprint note\nreviewPolicyVersion: |-\n  2\n# policy note\n---\n\n# Test focus\n',
  ]) {
    const state = memory({ [path]: original });
    const expectedHash = reviewHash(original, path);
    const result = record(state, { expectedHash });
    assert.equal(result.exitCode, 0, JSON.stringify(result.result));
    const updated = state.text(path);
    assert.equal(reviewHash(updated, path), expectedHash);
    assert.equal(
      frontmatter(normalizeText(updated), path).body,
      frontmatter(normalizeText(original), path).body,
    );
    for (const comment of [
      '# trailing comment',
      '# document end',
      '# fingerprint note',
      '# policy note',
    ])
      if (original.includes(comment))
        assert.ok(updated.includes(comment), comment);
    assert.equal(select(state).result.skipped.length, 1);
  }
});

test('recording updates existing review fields with bare CR and mixed line endings without changing other bytes', () => {
  for (const original of [
    '---\rtrigger: Read when changing tests.\rreviewPolicyVersion: "2"\r---\r\r# Test focus\r\rBody.\r',
    '\uFEFF---\rtrigger: Read when changing tests. # keep\rreviewedHash: "' +
      '0'.repeat(64) +
      '"\rreviewPolicyVersion: "2"\r---\r\r# Test focus\r\rBody.\r',
    '---\ntrigger: Read when changing tests.\rreviewPolicyVersion: "2" # keep\r---\n\n# Test focus\rBody.\n',
    '---\n  trigger: Read when changing tests.\n---\n\n# Test focus\n\nBody.\n',
    '---\n trigger: |-\n  Read when changing tests.\n---\n\n# Test focus\n',
  ]) {
    const state = memory({ [path]: original });
    const expectedHash = reviewHash(original, path);
    const response = record(state, { expectedHash });
    assert.equal(response.exitCode, 0, JSON.stringify(response.result));
    const updated = state.text(path);
    assert.equal(reviewHash(updated, path), expectedHash);
    assert.equal(
      frontmatter(normalizeText(updated.replace(/^\uFEFF/u, '')), path).body,
      frontmatter(normalizeText(original.replace(/^\uFEFF/u, '')), path).body,
    );
    assert.equal(select(state).result.skipped.length, 1);
    if (original.includes('# keep')) assert.ok(updated.includes('# keep'));
    assert.equal(updated.startsWith('\uFEFF'), original.startsWith('\uFEFF'));
  }
});

test('explicit invalidation reopens a matching receipt without changing the reviewed content', () => {
  const state = memory({
    [path]: receipt(source),
    'notes/unrelated.md': 'Keep.',
  });
  const selection = select(state).result;
  assert.equal(selection.skipped.length, 1);
  const expectedHash = selection.skipped[0].hash;
  const expectedPolicyVersion = selection.policyVersion;
  const preview = invalidate(state, {
    expectedHash,
    expectedPolicyVersion,
    dryRun: true,
  });
  assert.equal(preview.exitCode, 0);
  assert.equal(preview.result.command, 'invalidate');
  assert.equal(preview.result.changes[0].status, 'pending');
  assert.equal(state.writes.length, 0);
  assert.equal(select(state).result.skipped.length, 1);
  const applied = invalidate(state, { expectedHash, expectedPolicyVersion });
  assert.equal(applied.exitCode, 0, JSON.stringify(applied.result));
  assert.equal(applied.result.changes[0].status, 'completed');
  const updated = state.text(path);
  assert.equal(reviewHash(updated, path), hash);
  const fields = frontmatter(updated, path).fields;
  assert.ok(!Object.hasOwn(fields, 'reviewedHash'));
  assert.ok(!Object.hasOwn(fields, 'reviewPolicyVersion'));
  assert.deepEqual(select(state).result.candidates[0].reasons, [
    'missing-reviewed-hash',
    'missing-review-policy-version',
  ]);
  assert.equal(state.text('notes/unrelated.md'), 'Keep.');
  const writes = state.writes.length;
  assert.deepEqual(invalidate(state).result.changes, []);
  assert.equal(state.writes.length, writes);
});

test('invalidation preserves YAML comments, flow syntax, explicit keys, block triggers, BOM and line endings', () => {
  const zero = '0'.repeat(64);
  for (const original of [
    '\uFEFF---\r\ntrigger: Read. # trigger comment\r\nreviewedHash: "' +
      zero +
      '" # fingerprint note\r\nreviewPolicyVersion: "2" # policy note\r\n---\r\n\r\n# Test focus\r\nBody.\r\n',
    '---\rtrigger: Read.\rreviewedHash: "' +
      zero +
      '" # fingerprint note\rreviewPolicyVersion: "2" # policy note\r---\r# Test focus\rBody.\r',
    '---\n{reviewedHash: "' +
      zero +
      '", # fingerprint note\ntrigger: "Read, yes.", reviewPolicyVersion: "2" # policy note\n,}\n---\n# Test focus\n',
    '---\n{trigger: "Read.", ? reviewedHash: "' +
      zero +
      '", ? reviewPolicyVersion: "2"}\n---\n# Test focus\n',
    '---\n? reviewedHash\n: "' +
      zero +
      '" # fingerprint note\n? trigger\n: Read.\n? reviewPolicyVersion\n: "2" # policy note\n---\n# Test focus\n',
    '---\ntrigger: |-\n Read.\nreviewedHash: "' +
      zero +
      '" # fingerprint note\nreviewPolicyVersion: |- # policy note\n  2\n---\n# Test focus\n',
    '---\n  trigger: >-\n    Read\n    when testing.\n  reviewedHash: "' +
      zero +
      '" # fingerprint note\n  reviewPolicyVersion: "2" # policy note\n... # document end\n---\n# Test focus\n',
    '---\ntrigger: Read.\nreviewPolicyVersion: # policy note\n  "2" # value note\n---\n# Test focus\n',
  ]) {
    const state = memory({ [path]: original });
    const expectedHash = reviewHash(original, path);
    const response = invalidate(state, { expectedHash });
    assert.equal(response.exitCode, 0, JSON.stringify(response.result));
    const updated = state.text(path);
    assert.equal(reviewHash(updated, path), expectedHash);
    assert.equal(
      frontmatter(normalizeText(updated.replace(/^\uFEFF/u, '')), path).body,
      frontmatter(normalizeText(original.replace(/^\uFEFF/u, '')), path).body,
    );
    for (const comment of [
      '# trigger comment',
      '# fingerprint note',
      '# policy note',
      '# value note',
      '# document end',
    ])
      if (original.includes(comment))
        assert.ok(updated.includes(comment), comment);
    assert.equal(updated.startsWith('\uFEFF'), original.startsWith('\uFEFF'));
    assert.equal(select(state).result.candidates.length, 1);
  }
});

test('invalidation rejects stale expectations, removed files, unsafe targets and concurrent edits', () => {
  for (const options of [
    { expectedHash: '0'.repeat(64) },
    { expectedPolicyVersion: otherPolicy },
    { expectedPolicyVersion: undefined },
    { path: '../outside.md' },
    { path: '.agentscli/conventions/../outside.md' },
  ]) {
    const state = memory({ [path]: receipt(source) });
    assert.equal(invalidate(state, options).exitCode, 2);
    assert.equal(state.writes.length, 0);
  }
  const removed = memory();
  assert.equal(
    invalidate(removed).result.diagnostics[0].code,
    'SOURCE_MISSING',
  );
  assert.equal(removed.writes.length, 0);
  for (const override of [{ kind: 'link' }, { nlink: 2 }, { kind: 'other' }]) {
    const state = memory();
    state.put(path, receipt(source), override);
    assert.equal(invalidate(state).exitCode, 2);
    assert.equal(state.writes.length, 0);
  }
  const raced = memory({ [path]: receipt(source) });
  const concurrent = receipt(source).replace(
    'One behavior',
    'A clarified behavior',
  );
  const write = raced.io.writeExclusive;
  raced.io.writeExclusive = (file, content) => {
    write(file, content);
    raced.put(path, concurrent);
  };
  const response = invalidate(raced);
  assert.equal(response.exitCode, 3);
  assert.equal(response.result.diagnostics[0].code, 'DESTINATION_CHANGED');
  assert.equal(raced.text(path), concurrent);
  assert.ok(![...raced.nodes.keys()].some((file) => file.endsWith('.tmp')));
});

test('worked documentation receipts match their exact example path and content', () => {
  const example = readFileSync(
    new URL(
      '../../assets/templates/skills/agentscli-refactor-conventions/references/review-filter-examples.md',
      import.meta.url,
    ),
    'utf8',
  );
  const paths = new Map([
    ['Fixture independence', '.agentscli/conventions/fixture-independence.md'],
    ['Job retries', '.agentscli/conventions/job-retries.md'],
  ]);
  const fixtures = {};
  for (const node of parseMarkdown(example).children) {
    if (node.type !== 'code' || node.lang !== 'markdown') continue;
    const text = node.value + '\n';
    const header = frontmatter(text, 'example');
    if (!header?.fields.reviewedHash) continue;
    const title = validateConvention(text, 'example').title;
    const file = paths.get(title);
    assert.ok(file, title);
    assert.equal(reviewHash(text, file), header.fields.reviewedHash);
    fixtures[file] = text;
  }
  const state = memory(fixtures);
  const response = select(state);
  assert.equal(response.exitCode, 0);
  assert.deepEqual(
    new Set(response.result.skipped.map((entry) => entry.path)),
    new Set(paths.values()),
  );
  assert.equal(state.writes.length, 0);
});

test('stale hashes, moved paths and removed conventions do not receive receipts', () => {
  const state = memory({
    [path]: source.replace('One behavior', 'A single behavior'),
  });
  assert.equal(record(state).result.diagnostics[0].code, 'STALE_REVIEW');
  assert.equal(state.writes.length, 0);
  const moved = '.agentscli/conventions/team/test-focus.md';
  state.put(moved, source);
  assert.equal(
    record(state, { path: moved }).result.diagnostics[0].code,
    'STALE_REVIEW',
  );
  state.nodes.delete(join(state.root, path));
  assert.equal(record(state).result.diagnostics[0].code, 'SOURCE_MISSING');
  assert.equal(state.writes.length, 0);
});

test('recording binds the completed review to the exact policy used during selection', () => {
  const state = memory({ [path]: source });
  const selection = select(state).result;
  const expectedHash = selection.candidates[0].hash;
  const missing = record(state, {
    expectedHash,
    expectedPolicyVersion: undefined,
  });
  assert.equal(missing.exitCode, 2);
  assert.equal(missing.result.diagnostics[0].code, 'USAGE');
  const stale = record(state, {
    expectedHash,
    expectedPolicyVersion: otherPolicy,
  });
  assert.equal(stale.exitCode, 2);
  assert.equal(stale.result.diagnostics[0].code, 'STALE_REVIEW_POLICY');
  assert.equal(state.writes.length, 0);
  assert.equal(
    record(state, {
      expectedHash,
      expectedPolicyVersion: selection.policyVersion,
    }).exitCode,
    0,
  );
});

test('a concurrent edit during atomic recording is retained and the temporary file is removed', () => {
  const state = memory({ [path]: source });
  const write = state.io.writeExclusive;
  const concurrent = source.replace(
    'One behavior',
    'A newly clarified behavior',
  );
  state.io.writeExclusive = (file, content) => {
    write(file, content);
    state.put(path, concurrent);
  };
  const result = record(state);
  assert.equal(result.exitCode, 3);
  assert.equal(result.result.diagnostics[0].code, 'DESTINATION_CHANGED');
  assert.equal(result.result.changes[0].status, 'pending');
  assert.equal(state.text(path), concurrent);
  assert.ok(![...state.nodes.keys()].some((file) => file.endsWith('.tmp')));
});

test('unsafe paths, aliases, linked targets and installed-package roots are rejected before recording', () => {
  for (const unsafe of [
    '../outside.md',
    '.agentscli/conventions/../outside.md',
    '/absolute.md',
    'C:/absolute.md',
    '.agentscli/conventions-other/test-focus.md',
    '.agentscli/conventions/test-focus.txt',
  ]) {
    const state = memory({ [path]: source });
    assert.equal(record(state, { path: unsafe }).exitCode, 2, unsafe);
    assert.equal(state.writes.length, 0);
  }
  for (const override of [{ kind: 'link' }, { nlink: 2 }, { kind: 'other' }]) {
    const state = memory();
    state.put(path, source, override);
    assert.equal(select(state).exitCode, 2);
    assert.equal(record(state).exitCode, 2);
    assert.equal(state.writes.length, 0);
  }
  const aliased = memory({
    [path]: source,
    '.agentscli/conventions/TEST-FOCUS.md': source,
  });
  assert.equal(select(aliased).exitCode, 2);
  assert.equal(record(aliased).exitCode, 2);
  assert.equal(aliased.writes.length, 0);
  const installed = memory({
    'node_modules/@devel-solid/agentscli/package.json': JSON.stringify({
      name: '@devel-solid/agentscli',
      bin: { agentscli: 'dist/cli.js' },
    }),
  });
  assert.equal(
    selectConventions(
      { repoRoot: join(installed.root, 'node_modules/@devel-solid/agentscli') },
      { io: installed.io },
    ).result.diagnostics[0].code,
    'PACKAGE_TARGET',
  );
  assert.equal(installed.writes.length, 0);
});

test('select handles empty trees and operational read errors without writes', () => {
  const empty = memory();
  assert.deepEqual(select(empty).result.candidates, []);
  assert.equal(empty.writes.length, 0);
  const state = memory({ [path]: source });
  state.io.read = () => {
    throw new Error('Injected read failure');
  };
  const result = select(state);
  assert.equal(result.exitCode, 3);
  assert.deepEqual(result.result.candidates, [
    { path, reasons: ['invalid-input'] },
  ]);
  assert.equal(state.writes.length, 0);
});

test('private CLI rejects malformed, repeated and operation-incompatible options', () => {
  const state = memory({ [path]: source });
  for (const args of [
    [],
    ['unknown'],
    ['select', '--dry-run'],
    ['select', '--path', path],
    ['select', '--expected-hash', hash],
    ['select', '--expected-policy-version', '1'],
    ['select', '--repo-root', ''],
    ['record'],
    ['record', '--path', path],
    ['record', '--path', path, '--expected-hash', 'bad'],
    [
      'record',
      '--repo-root',
      state.root,
      '--path',
      path,
      '--expected-hash',
      hash,
    ],
    ['select', '--json', '--json'],
    ['select', '--unknown'],
    ['record', '--dry-run=false'],
    ['select', '--review-policy-version', '2'],
  ]) {
    const result = run(args, { io: state.io });
    assert.equal(result.exitCode, 2, args.join(' '));
    assert.equal(state.writes.length, 0);
  }
  assert.equal(
    run(['select', '--repo-root', state.root, '--json'], { io: state.io })
      .exitCode,
    0,
  );
  const preview = run(
    [
      'record',
      '--repo-root',
      state.root,
      '--path',
      path,
      '--expected-hash',
      hash,
      '--expected-policy-version',
      REVIEW_POLICY_VERSION,
      '--dry-run',
      '--json',
    ],
    { io: state.io },
  );
  assert.equal(preview.exitCode, 0);
  assert.equal(state.writes.length, 0);
});

test('private invalidate CLI previews and applies receipt removal with the required expectations', () => {
  const state = memory({ [path]: receipt(source) });
  const args = [
    'invalidate',
    '--repo-root',
    state.root,
    '--path',
    path,
    '--expected-hash',
    hash,
    '--expected-policy-version',
    REVIEW_POLICY_VERSION,
    '--json',
  ];
  const preview = run([...args, '--dry-run'], { io: state.io });
  assert.equal(preview.exitCode, 0);
  assert.equal(preview.result.command, 'invalidate');
  assert.equal(preview.result.changes[0].status, 'pending');
  assert.equal(state.writes.length, 0);
  const applied = run(args, { io: state.io });
  assert.equal(applied.exitCode, 0);
  assert.equal(applied.result.changes[0].status, 'completed');
  assert.equal(select(state).result.candidates.length, 1);
  assert.equal(reviewHash(state.text(path), path), hash);
});
