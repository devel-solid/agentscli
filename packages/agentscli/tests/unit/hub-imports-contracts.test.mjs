import test from 'node:test';
import assert from 'node:assert/strict';
import { runCli } from '../../assets/templates/skills/agentscli-manage-hub-imports/scripts/hub-imports.mjs';
import { parseYaml } from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/manifest.mjs';
import {
  canonical,
  descriptor,
  repository,
  request,
  representation,
  selection,
  snapshotFromCapture,
  sha256,
} from '../../assets/templates/skills/agentscli-manage-hub-imports/scripts/contracts.mjs';
const bytes = (value) => Buffer.from(value);

test('invalid reviewed JSON is input failure while a plan read failure remains operational', async () => {
  const malformed = await runCli(['apply', '--plan-file', 'invalid.json'], {
    readPlan: () => '{broken',
  });
  assert.equal(malformed.exitCode, 2);
  assert.equal(malformed.result.diagnostics[0].code, 'PLAN');
  const unreadable = await runCli(['apply', '--plan-file', 'missing.json'], {
    readPlan: () => {
      throw new Error('read failed');
    },
  });
  assert.equal(unreadable.exitCode, 3);
  assert.equal(unreadable.result.diagnostics[0].code, 'OPERATION_FAILED');
});
const commit = 'a'.repeat(40);
const intent = {
  repository: 'git@example.org:team/hub.git',
  commit,
  conventions: [],
  skills: [],
};
const entry = (path, content, extra = {}) => ({
  path,
  content: bytes(content),
  type: 'blob',
  gitMode: '100644',
  ...extra,
});
const manifest = entry(
  'agentscli-hub.yml',
  'schemaVersion: 1\nversion: 1.2.0\n',
);

test('canonical text preserves BOM, spaces and final newline while opaque bytes stay exact', () => {
  const original = bytes('\ufeffhello  \r\nlast');
  assert.equal(representation(original), 'utf8-lf');
  assert.deepEqual(
    Buffer.from(canonical(original, 'utf8-lf')),
    bytes('\ufeffhello  \nlast'),
  );
  for (const value of [
    Buffer.from([0xff]),
    bytes('a\0b'),
    bytes('a\rb'),
    bytes('a\r\r\n'),
  ])
    assert.equal(representation(value), 'bytes');
  const opaque = descriptor(original, '100755', true);
  assert.equal(opaque.descriptor.representation, 'bytes');
  assert.equal(opaque.descriptor.sha256, sha256(original));
  assert.deepEqual(Buffer.from(opaque.content), original);
  assert.throws(() => canonical(bytes('x\ry'), 'utf8-lf'));
});

test('native endpoints, explicit revisions and portable selections reject unsafe inputs', () => {
  for (const value of [
    'https://example.org/team/hub.git',
    'ssh://git@example.org/team/hub.git',
    'git@example.org:team/hub.git',
  ])
    assert.equal(repository(value), value);
  for (const value of [
    'C:/hub',
    '/hub',
    'file:///hub',
    'ext::evil',
    'https://user:secret@example.org/hub',
    'https://example.org/hub?token=secret',
    '-evil',
    'git@example.org:foo;evil',
  ])
    assert.throws(() => repository(value), undefined, value);
  assert.throws(() => request({ ...intent, tag: 'v1.2.0' }));
  assert.throws(() => request({ ...intent, commit: 'main' }));
  assert.throws(() => selection(['Name', 'name'], 'conventions'));
  for (const value of [
    'agentscli-build-agents',
    'agentscli-update-agents',
    'agentscli-hub-publish',
    '../evil',
  ])
    assert.throws(() => selection([value], 'skills'));
});

test('capture stores only explicitly selected complete trees and committed -text remains opaque', () => {
  const selected = { ...intent, conventions: ['testing'], skills: ['review'] };
  const capture = {
    commit,
    entries: [
      manifest,
      entry('shared/conventions/testing.tpl.md', 'testing\r\n'),
      entry('shared/conventions/unselected.tpl.md', 'broken'),
      entry('shared/skills/review/SKILL.md', 'skill'),
      entry('shared/skills/review/scripts/blob.bin', 'a\r\n', {
        textAttribute: 'unset',
        gitMode: '100755',
      }),
      entry('shared/skills/other/SKILL.md', 'other'),
    ],
  };
  const snapshot = snapshotFromCapture(selected, capture, parseYaml);
  assert.deepEqual(Object.keys(snapshot.files).sort(), [
    'agentscli-hub.yml',
    'conventions/testing.tpl.md',
    'skills/review/SKILL.md',
    'skills/review/scripts/blob.bin',
  ]);
  assert.equal(snapshot.lock.hubVersion, '1.2.0');
  assert.equal(
    snapshot.lock.files['skills/review/scripts/blob.bin'].representation,
    'bytes',
  );
  assert.equal(
    snapshot.lock.files['skills/review/scripts/blob.bin'].gitMode,
    '100755',
  );
  assert.deepEqual(
    Buffer.from(snapshot.files['skills/review/scripts/blob.bin']),
    bytes('a\r\n'),
  );
});

test('selected unsafe Git entries, aliasing, missing resources and release version mismatch fail', () => {
  for (const bad of [
    entry('shared/conventions/testing.tpl.md', 'target', { gitMode: '120000' }),
    entry('shared/conventions/testing.tpl.md', '', {
      gitMode: '160000',
      type: 'commit',
    }),
  ])
    assert.throws(() =>
      snapshotFromCapture(
        { ...intent, conventions: ['testing'] },
        { commit, entries: [manifest, bad] },
        parseYaml,
      ),
    );
  assert.throws(() =>
    snapshotFromCapture(
      { ...intent, skills: ['review'] },
      {
        commit,
        entries: [
          manifest,
          entry('shared/skills/review/readme.md', 'missing skill'),
        ],
      },
      parseYaml,
    ),
  );
  assert.throws(() =>
    snapshotFromCapture(
      { ...intent, commit: undefined, tag: 'v1.1.0' },
      { commit, entries: [manifest] },
      parseYaml,
    ),
  );
  assert.throws(() =>
    snapshotFromCapture(
      intent,
      {
        commit,
        entries: [
          entry(
            'agentscli-hub.yml',
            'schemaVersion: 1\nversion: 1.0.0\ncliVersion: 0.3.1\n',
          ),
        ],
      },
      parseYaml,
    ),
  );
});

test('selected skill support directory aliases fail before any materialization', () => {
  assert.throws(
    () =>
      snapshotFromCapture(
        { ...intent, skills: ['review'] },
        {
          commit,
          entries: [
            manifest,
            entry('shared/skills/review/SKILL.md', 'entry'),
            entry('shared/skills/review/Scripts/a.mjs', 'a'),
            entry('shared/skills/review/scripts/b.mjs', 'b'),
          ],
        },
        parseYaml,
      ),
    { code: 'PATH_ALIAS' },
  );
});

test('physical selected paths are checked before fixed mapping and source identity stays logical', () => {
  for (const path of [
    'shared/skills/review/../escape',
    'shared/skills/review/support\\escape',
    'shared/skills/review/CON',
    'shared/skills/review/trailing.',
  ])
    assert.throws(
      () =>
        snapshotFromCapture(
          { ...intent, skills: ['review'] },
          {
            commit,
            entries: [
              manifest,
              entry('shared/skills/review/SKILL.md', 'entry'),
              entry(path, 'bad'),
            ],
          },
          parseYaml,
        ),
      { code: 'PATH_UNSAFE' },
    );
  for (const extra of [
    [
      entry('shared/skills/review/support', 'file'),
      entry('shared/skills/review/support/check.mjs', 'child'),
    ],
    [
      entry('shared/skills/review/caf\u00e9/a.md', 'a'),
      entry('shared/skills/review/cafe\u0301/b.md', 'b'),
    ],
  ])
    assert.throws(
      () =>
        snapshotFromCapture(
          { ...intent, skills: ['review'] },
          {
            commit,
            entries: [
              manifest,
              entry('shared/skills/review/SKILL.md', 'entry'),
              ...extra,
            ],
          },
          parseYaml,
        ),
      { code: 'PATH_ALIAS' },
    );
  assert.throws(
    () =>
      snapshotFromCapture(
        { ...intent, skills: ['review'] },
        {
          commit,
          entries: [
            manifest,
            entry('shared/skills/review/SKILL.md', 'entry', {
              invalidPath: true,
            }),
          ],
        },
        parseYaml,
      ),
    { code: 'GIT_TREE' },
  );
  const snapshot = snapshotFromCapture(
    { ...intent, conventions: ['testing/unit'], skills: ['review'] },
    {
      commit,
      entries: [
        manifest,
        entry('shared/conventions/testing/unit.tpl.md', 'nested'),
        entry('shared/skills/review/SKILL.md', 'entry'),
        entry('shared/skills/review/agentscli-skill.yml', 'requires: []\n'),
      ],
    },
    parseYaml,
  );
  assert.deepEqual(snapshot.lock.conventions, ['testing/unit']);
  assert.deepEqual(snapshot.lock.skills, ['review']);
  assert.equal(snapshot.lock.schemaVersion, 1);
  assert.deepEqual(
    Buffer.from(snapshot.files['agentscli-hub.yml']),
    manifest.content,
  );
  for (const [path, content] of Object.entries(snapshot.files)) {
    assert.ok(!path.startsWith('shared/'));
    assert.equal(snapshot.lock.files[path].sha256, sha256(content));
  }
});
