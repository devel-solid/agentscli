import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { memory } from './memory.mjs';
import {
  EngineError,
  PRODUCT_SKILLS,
  parseYaml,
} from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/contracts.mjs';
import {
  validateConvention,
  validateConventionFilename,
  decode,
} from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/markdown.mjs';
import {
  relativePath,
  uniquePaths,
} from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/paths.mjs';
import {
  validateResources,
  validateSkill,
} from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/content.mjs';
import {
  render,
  INDEX_HEADER,
} from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/render.mjs';
import { isGenerated } from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/plan.mjs';
import { execute } from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/runtime.mjs';
import { run } from '../../assets/templates/skills/agentscli-build-agents/scripts/build-agents.mjs';
export const bytes = (text) => new TextEncoder().encode(text);
export const convention = (
  title = 'Testing',
  trigger = 'Read before testing.',
) => `---\ntrigger: ${trigger}\n---\n\n# ${title}\n\nKeep useful rules.\n`;
export const skill = (name, extra = '') =>
  bytes(
    `---\nname: ${name}\ndescription: A useful skill.\n${extra}---\n\n# Procedure\n`,
  );
export const resources = {
  skills: Object.fromEntries(
    PRODUCT_SKILLS.map((id) => [
      id,
      {
        'SKILL.md': skill(id),
        'references/note.md': bytes('Own support.\n'),
      },
    ]),
  ),
};
export const client = (files) => memory(files);
export const invoke = (fs, command = 'apply', options = {}) =>
  execute(command, { repoRoot: fs.root, ...options }, { io: fs.io, resources });

test('generic YAML rejects duplicate keys, aliases and explicit tags', () => {
  for (const text of [
    '[]',
    'a: 1\na: 2',
    'a: &a {b: 1}\nb: *a',
    'a: !!str text',
  ])
    assert.throws(() => parseYaml(text));
});

test('portable paths reject escapes, reserved names and aliases', () => {
  for (const path of [
    '../escape',
    'C:/drive',
    'x/NUL.md',
    'a/../b',
    'a//b',
    'a.',
  ])
    assert.throws(() => relativePath(path));
  for (const paths of [
    ['A.md', 'a.md'],
    ['a', 'a/b'],
    ['e\u0301.md', 'é.md'],
  ])
    assert.throws(() => uniquePaths(paths));
});
test('conventions require only trigger and exactly one live H1; examples remain literal', () => {
  const text =
    convention() + '\n```md\n# Example\ntrigger: literal example\n```\n';
  assert.equal(validateConvention(text, 'testing.md').title, 'Testing');
  for (const text of [
    convention().replace('trigger:', 'unknown: true\ntrigger:'),
    convention().replace('Read before testing.', ''),
    convention() + '\n# Second\n',
    '# Testing\n',
  ])
    assert.throws(() => validateConvention(text, 'testing.md'));
  assert.throws(() => decode(new Uint8Array([0xff]), 'invalid'));
  const missing = '# Testing\n\nKeep useful rules.\n';
  assert.throws(
    () => validateConvention(missing, 'testing.md'),
    (error) =>
      error instanceof EngineError &&
      error.code === 'SOURCE_TRIGGER' &&
      /Expected leading YAML frontmatter/.test(error.message),
  );
  assert.equal(
    validateConvention(
      `---\ntrigger: Current metadata.\n---\n${missing}`,
      'testing.md',
    ).trigger,
    'Current metadata.',
  );
});
test('convention filenames normalize Unicode titles without limiting their language', () => {
  for (const [title, basename] of [
    ['Regras \u00c1geis!', 'regras-ageis'],
    ['Regras A\u0301geis!', 'regras-ageis'],
    [
      '\u039a\u0391\u039d\u038c\u039d\u0395\u03a3 \uff11\uff12',
      '\u03ba\u03b1\u03bd\u03bf\u03bd\u03b5\u03c2-12',
    ],
    ['\u958b\u767a\u898f\u7d04', '\u958b\u767a\u898f\u7d04'],
    ['\ud55c\uae00 \uaddc\uce59', '\ud55c\uae00-\uaddc\uce59'],
  ]) {
    validateConventionFilename(title, `${basename}.md`);
    assert.throws(
      () => validateConventionFilename(title, 'different.md'),
      /Expected filename/,
    );
  }
  assert.throws(
    () => validateConventionFilename('!!!', 'empty.md'),
    /containing letters or numbers/,
  );
});

test('skill frontmatter validates required fields and keeps ordinary metadata and support', () => {
  const files = {
    'SKILL.md': skill('review', 'metadata:\n  owner: team\n'),
    'references/options.yml': bytes(
      'An ordinary support file, without a schema.\n',
    ),
  };
  const parsed = validateSkill(files, 'skills/review');
  assert.equal(parsed.name, 'review');
  assert.deepEqual(parsed.header.fields.metadata, { owner: 'team' });
  for (const files of [
    {},
    { 'SKILL.md': bytes('# Missing frontmatter\n') },
    { 'SKILL.md': bytes('---\nname: review\n---\n') },
    { 'SKILL.md': bytes('---\nname: review\ndescription: ""\n---\n') },
    { 'SKILL.md': bytes('---\nname: [review]\ndescription: Review.\n---\n') },
  ])
    assert.throws(() => validateSkill(files, 'skills/review'));
});

test('standard skill frontmatter rejects extension keys and non-string optional fields', () => {
  for (const extra of [
    'unknown: true\n',
    'license: {name: MIT}\n',
    'allowed-tools: [Bash]\n',
    'metadata: {owner: [team]}\n',
    'metadata: []\n',
    'metadata: null\n',
  ])
    assert.throws(() =>
      validateSkill({ 'SKILL.md': skill('review', extra) }, 'skills/review'),
    );
});

test('supported links reject cross-resource references, HTML, encoded aliases, and skill command paths', () => {
  const base = {
    path: '.agentscli/conventions/testing.md',
  };
  const other = {
    path: '.agentscli/conventions/other.md',
    text: convention('Other'),
  };
  for (const link of [
    '[rule](other.md)',
    '[rule][x]\n\n[x]: other.md',
    '<a href="other.md">rule</a>',
    '![rule](%6fther.md)',
    '[skill](../../.agents/skills/review/SKILL.md)',
    '[directory](/.agentscli/conventions/)',
    '[directory](https://example.org/team/conventions)',
    '[directory](https://example.org/team/conventions/team/)',
    '[skills](/.agents/skills)',
    '[skills](https://example.org/team/skills/)',
  ])
    assert.throws(
      () =>
        validateResources({
          conventions: [{ ...base, text: convention() + link }, other],
        }),
      /cross-resource/,
    );
  validateResources({
    conventions: [
      {
        ...base,
        text:
          convention() +
          '[own](#testing) [self](testing.md) [ordinary](../../README.md) [report](https://example.org/conventions-report)\n\n```md\n[example](other.md)\n```\n',
      },
      other,
    ],
  });
  const file = { 'SKILL.md': skill('review') };
  file['SKILL.md'] = bytes(
    Buffer.from(file['SKILL.md']).toString() +
      'node .agents/skills/other/scripts/run.mjs\n',
  );
  assert.throws(
    () =>
      validateResources({
        skills: [
          {
            id: 'review',
            source: 'local',
            path: '.agents/skills/review',
            files: file,
          },
        ],
      }),
    /cross-resource/,
  );
  const own = {
    'SKILL.md': bytes(
      Buffer.from(skill('review')).toString() +
        '[own](.) [support](references/note.md) [directory](references/) [report](https://example.org/conventions-report)\n',
    ),
    'references/note.md': bytes('Own rule.'),
  };
  validateResources({
    skills: [
      {
        id: 'review',
        source: 'local',
        path: '.agents/skills/review',
        files: own,
      },
    ],
  });
});
test('apply previews without writes then replaces managed drift while preserving authored state', async () => {
  const fs = memory();
  const preview = await invoke(fs, 'apply', { dryRun: true });
  assert.equal(preview.exitCode, 0);
  assert.equal(fs.writes.length, 0);
  assert.ok(preview.result.changes.length);
  assert.equal((await invoke(fs)).exitCode, 0);
  assert.equal((await invoke(fs)).result.changes.length, 0);
  fs.put('.agentscli/conventions/custom.md', convention('Custom'));
  const attachment = new Uint8Array([0, 255, 13, 10]);
  fs.put('.agentscli/conventions/notes/attachment.bin', attachment);
  fs.put('.agents/skills/agentscli-build-agents/unwanted.txt', 'obsolete');
  fs.put('.agents/skills/unrelated/SKILL.md', skill('unrelated'));
  fs.put(
    'AGENTS.md',
    '---\ngeneratedBy: "@devel-solid/agentscli"\n---\nEdited managed copy.',
  );
  assert.equal((await invoke(fs)).exitCode, 0);
  assert.match(fs.text('AGENTS.md'), /Custom/);
  assert.match(fs.text('.agentscli/conventions/custom.md'), /trigger:/);
  assert.deepEqual(
    fs.io.read(join(fs.root, '.agentscli/conventions/notes/attachment.bin')),
    attachment,
  );
  assert.equal(
    fs.nodes.has(
      join(fs.root, '.agents/skills/agentscli-build-agents/unwanted.txt'),
    ),
    false,
  );
  assert.match(fs.text('.agents/skills/unrelated/SKILL.md'), /unrelated/);
});
test('repeated operations preserve authored convention bytes including BOM, CRLF and whitespace', async () => {
  const path = '.agentscli/conventions/team/regras-gerais.md';
  const authored = bytes(
    '\ufeff---\r\ntrigger: "Leia ao revisar."\r\n---\r\n\r\n# Regras gerais\r\n\r\n日本語の本文。  \r\n\r\n',
  );
  const fs = client({ [path]: authored });
  for (let repeat = 0; repeat < 2; repeat++) {
    for (const [command, options] of [
      ['apply', { dryRun: true }],
      ['validate', {}],
      ['sync', { dryRun: true }],
      ['apply', {}],
      ['sync', {}],
      ['sync', { check: true }],
    ]) {
      const before = fs.writes.length;
      const response = await invoke(fs, command, options);
      assert.equal(response.exitCode, 0, JSON.stringify(response.result));
      assert.ok(
        response.result.changes.every(({ path: target }) => target !== path),
      );
      assert.deepEqual(fs.io.read(join(fs.root, path)), authored);
      assert.ok(
        fs.writes
          .slice(before)
          .every(
            ([, target]) =>
              !target.startsWith(join(fs.root, '.agentscli/conventions')),
          ),
      );
      if (options.dryRun || options.check || command === 'validate')
        assert.equal(fs.writes.length, before);
    }
  }
  assert.equal(
    fs.text('AGENTS.md'),
    `${INDEX_HEADER}\n- [Regras gerais](.agentscli/conventions/team/regras-gerais.md): Leia ao revisar.\n`,
  );
});

test('unrelated authored files are never read or changed', async () => {
  const files = {
    'project.yml': 'invalid: [yaml\n',
    'notes/testing.md': '# Authored text outside convention discovery.\n',
    'docs/testing.md': '# Unrelated instructions.\n',
  };
  const fs = client({
    ...files,
    '.agentscli/conventions/testing.md': convention(),
  });
  const originalRead = fs.io.read;
  fs.io.read = (path) => {
    for (const file of Object.keys(files))
      assert.notEqual(path, join(fs.root, file));
    return originalRead(path);
  };
  for (const [command, options] of [
    ['apply', { dryRun: true }],
    ['validate', {}],
    ['sync', { check: true }],
    ['apply', {}],
    ['sync', {}],
  ]) {
    const response = await invoke(fs, command, options);
    assert.equal(
      response.exitCode,
      options.check ? 1 : 0,
      JSON.stringify(response.result),
    );
    assert.ok(
      response.result.changes.every(({ path }) => !Object.hasOwn(files, path)),
    );
  }
  fs.io.read = originalRead;
  for (const [path, content] of Object.entries(files))
    assert.equal(fs.text(path), content);
  assert.match(fs.text('AGENTS.md'), /Testing/);
});

test('local skills have protected ownership and full validation', async () => {
  for (const id of ['review', 'test-helper']) {
    const base = `.agents/skills/${id}`;
    const files = {
      [`${base}/SKILL.md`]: skill(id),
      [`${base}/references/note.md`]: bytes('Authored support.\n'),
    };
    const fs = client(files);
    for (const [command, options] of [
      ['apply', { dryRun: true }],
      ['validate', {}],
      ['apply', {}],
      ['sync', {}],
      ['sync', { check: true }],
    ]) {
      const response = await invoke(fs, command, options);
      assert.equal(response.exitCode, 0, JSON.stringify(response.result));
      assert.ok(
        response.result.changes.every(({ path }) => !path.startsWith(base)),
      );
    }
    for (const [path, content] of Object.entries(files))
      assert.deepEqual(fs.io.read(join(fs.root, path)), content);

    fs.put(`${base}/SKILL.md`, '# Missing required metadata.\n');
    const before = fs.writes.length;
    for (const command of ['apply', 'validate', 'sync']) {
      assert.equal((await invoke(fs, command)).exitCode, 2);
      assert.equal(fs.writes.length, before);
    }

    const metadata = client({ [base]: 'An unrelated regular file.\n' });
    assert.equal((await invoke(metadata)).exitCode, 0);
    assert.equal(metadata.text(base), 'An unrelated regular file.\n');
  }
});

test('generation preserves a non-Latin title, trigger and body with deterministic links', async () => {
  const title = '\u958b\u767a\u898f\u7d04';
  const trigger = '\u958b\u767a\u6642\u306b\u8aad\u3080\u3002';
  const body = `\n# ${title}\n\n\u898f\u7d04\u3092\u5b88\u308b\u3002\n`;
  const source = `---\ntrigger: ${trigger}\n---\n${body}`;
  const path = `.agentscli/conventions/${title}.md`;
  const fs = client({ [path]: source });
  assert.equal((await invoke(fs)).exitCode, 0);
  assert.equal(fs.text(path), source);
  assert.equal(
    fs.text('AGENTS.md'),
    `${INDEX_HEADER}\n- [${title}](.agentscli/conventions/${encodeURIComponent(title)}.md): ${trigger}\n`,
  );
  assert.equal((await invoke(fs)).result.changes.length, 0);
});

test('first apply generates an empty index and sync indexes a first authored convention', async () => {
  const fs = client();
  assert.equal((await invoke(fs)).exitCode, 0);
  assert.equal(fs.text('AGENTS.md'), INDEX_HEADER);
  fs.put('.agentscli/conventions/testing.md', convention());
  assert.equal((await invoke(fs, 'sync')).exitCode, 0);
  assert.match(fs.text('AGENTS.md'), /Testing/);
});

test('private validate/check are offline, write-free, and do not need unrelated operational skills', async () => {
  const fs = client();
  assert.equal((await invoke(fs, 'validate')).exitCode, 0);
  assert.equal(fs.writes.length, 0);
  const check = await invoke(fs, 'sync', { check: true });
  assert.equal(check.exitCode, 1);
  assert.equal(fs.writes.length, 0);
  assert.equal((await invoke(fs, 'sync')).exitCode, 0);
  assert.equal((await invoke(fs, 'sync', { check: true })).exitCode, 0);
  assert.equal(
    fs.nodes.has(
      join(fs.root, '.agents/skills/agentscli-write-conventions/SKILL.md'),
    ),
    false,
  );
});

test('skill discovery preserves regular metadata across apply and private generation', async () => {
  const metadata = {
    '.agents/skills/.tool-target': bytes('codex\n'),
    '.agents/skills/tool-metadata.bin': new Uint8Array([0, 255, 13, 10]),
  };
  const fs = client({
    ...metadata,
    '.agents/skills/review/SKILL.md': skill('review'),
    '.agents/skills/check/SKILL.md': skill('check'),
  });
  for (const [command, options] of [
    ['apply', { dryRun: true }],
    ['validate', {}],
    ['sync', { dryRun: true }],
    ['sync', { check: true }],
  ]) {
    const response = await invoke(fs, command, options);
    assert.equal(response.exitCode, options.check ? 1 : 0);
    assert.equal(fs.writes.length, 0);
    assert.ok(
      response.result.changes.every(
        ({ path }) => !Object.hasOwn(metadata, path),
      ),
    );
  }
  assert.equal((await invoke(fs)).exitCode, 0);
  fs.put('.agentscli/conventions/testing.md', convention());
  const before = fs.writes.length;
  assert.equal((await invoke(fs, 'sync', { dryRun: true })).exitCode, 0);
  assert.equal((await invoke(fs, 'sync', { check: true })).exitCode, 1);
  assert.equal(fs.writes.length, before);
  assert.equal((await invoke(fs, 'sync')).exitCode, 0);
  assert.equal((await invoke(fs, 'sync', { check: true })).exitCode, 0);
  for (const [path, content] of Object.entries(metadata))
    assert.deepEqual(fs.io.read(join(fs.root, path)), content);
  assert.deepEqual(
    fs.io.read(join(fs.root, '.agents/skills/review/SKILL.md')),
    skill('review'),
  );
});

test('regular metadata does not bypass custom skill validation', async () => {
  for (const files of [
    { 'SKILL.md': 'Missing required skill metadata.\n' },
    {
      'SKILL.md': skill('review'),
      'references/rule.md': '[Foreign](../../other/SKILL.md)\n',
    },
  ]) {
    const fs = client({
      '.agents/skills/.tool-target': 'codex\n',
      ...Object.fromEntries(
        Object.entries(files).map(([path, content]) => [
          `.agents/skills/review/${path}`,
          content,
        ]),
      ),
    });
    for (const [command, options] of [
      ['apply', { dryRun: true }],
      ['apply', {}],
      ['validate', {}],
      ['sync', { dryRun: true }],
      ['sync', { check: true }],
    ]) {
      assert.equal((await invoke(fs, command, options)).exitCode, 2);
      assert.equal(fs.writes.length, 0);
    }
  }
});

test('skill metadata and discovered support retain safe-path inspection before classification', async () => {
  for (const path of [
    '.agents/skills/.tool-target',
    '.agents/skills/review/references/note.md',
  ])
    // Windows junctions and symbolic links have the same injected link kind.
    for (const overrides of [
      { kind: 'link' },
      { nlink: 2 },
      { kind: 'other' },
    ]) {
      const fs = client({ '.agents/skills/review/SKILL.md': skill('review') });
      fs.put(path, 'unsafe', overrides);
      for (const command of ['apply', 'validate', 'sync']) {
        const response = await invoke(fs, command);
        assert.equal(response.exitCode, 2);
        assert.equal(response.result.diagnostics[0].code, 'PATH_UNSAFE');
        assert.equal(fs.writes.length, 0);
      }
    }
  const fs = client({
    '.agents/skills/.tool-target': 'codex\n',
    '.agents/skills/.TOOL-TARGET': 'alias\n',
  });
  const response = await invoke(fs);
  assert.equal(response.exitCode, 2);
  assert.equal(response.result.diagnostics[0].code, 'PATH_ALIAS');
  assert.equal(fs.writes.length, 0);
});

test('regular files cannot occupy packaged skill directories', async () => {
  for (const id of PRODUCT_SKILLS) {
    const path = `.agents/skills/${id}`;
    const fs = client({ [path]: 'Protected authored file.\n' });
    for (const [command, options] of [
      ['apply', { dryRun: true }],
      ['apply', {}],
      ['validate', {}],
      ['sync', { check: true }],
    ]) {
      const response = await invoke(fs, command, options);
      assert.equal(response.exitCode, 2);
      assert.equal(response.result.diagnostics[0].code, 'PATH_TYPE');
      assert.equal(fs.writes.length, 0);
      assert.equal(fs.text(path), 'Protected authored file.\n');
    }
  }
});
test('manual root AGENTS and invalid authored input block all writes', async () => {
  for (const files of [
    { 'AGENTS.md': '# Handwritten\n' },
    {
      '.agentscli/conventions/testing.md': convention().replace(
        'trigger:',
        'unknown: true\ntrigger:',
      ),
    },
  ]) {
    const fs = client(files);
    for (const [command, options] of [
      ['apply', {}],
      ['apply', { dryRun: true }],
      ['validate', {}],
      ['sync', {}],
      ['sync', { check: true }],
    ]) {
      const response = await invoke(fs, command, options);
      assert.equal(response.exitCode, 2);
      assert.equal(fs.writes.length, 0);
      for (const [path, content] of Object.entries(files))
        assert.equal(fs.text(path), content);
    }
  }
});

test('nested convention body links resolve at their final path and trigger links resolve in AGENTS', async () => {
  const path = '.agentscli/conventions/team/testing.md';
  const ownBody = '[Own](#testing) [Project](../../../README.md)\n';
  const fs = client({ [path]: convention() + ownBody });
  assert.equal((await invoke(fs)).exitCode, 0);
  assert.equal(fs.text(path), convention() + ownBody);
  for (const text of [
    convention() + '[Other](../other.md)\n',
    convention(
      'Testing',
      '"[Other](.agentscli/conventions/other.md) before testing."',
    ),
  ]) {
    const rejected = client({
      [path]: text,
      '.agentscli/conventions/other.md': convention('Other'),
    });
    const response = await invoke(rejected);
    assert.equal(response.exitCode, 2);
    assert.equal(response.result.diagnostics[0].code, 'RESOURCE_LINK');
    assert.equal(rejected.writes.length, 0);
    assert.equal(rejected.text(path), text);
  }
});
test('source workspaces apply and synchronize their own authored conventions', async () => {
  const authored = convention().replaceAll('\n', '\r\n');
  const files = {
    'package.json': JSON.stringify({
      name: 'agentscli-monorepo',
      private: true,
      workspaces: ['packages/agentscli'],
    }),
    'packages/agentscli/package.json': JSON.stringify({
      name: '@devel-solid/agentscli',
      bin: { agentscli: 'dist/cli.js' },
    }),
    '.agentscli/conventions/testing.md': authored,
    '.agents/skills/agentscli-publish-packages/SKILL.md': skill(
      'agentscli-publish-packages',
    ),
  };
  const fs = client(files);
  assert.equal((await invoke(fs, 'validate')).exitCode, 0);
  assert.equal(fs.writes.length, 0);
  assert.equal((await invoke(fs)).exitCode, 0);
  assert.equal((await invoke(fs, 'sync', { check: true })).exitCode, 0);
  assert.equal((await invoke(fs)).result.changes.length, 0);
  for (const [path, content] of Object.entries(files))
    assert.deepEqual(
      fs.io.read(join(fs.root, path)),
      typeof content === 'string' ? bytes(content) : content,
    );
  fs.put(
    '.agentscli/conventions/testing.md',
    convention('Testing', 'Read when checking changes.'),
  );
  assert.equal((await invoke(fs, 'sync')).exitCode, 0);
  assert.match(fs.text('AGENTS.md'), /Read when checking changes/);
});

test('installed package targets and descendants are protected before mutation', async () => {
  const identity = JSON.stringify({
    name: '@devel-solid/agentscli',
    bin: { agentscli: 'dist/cli.js' },
  });
  for (const location of [
    'node_modules/@devel-solid/agentscli',
    'node_modules/agentscli',
  ]) {
    const fs = client({ [`${location}/package.json`]: identity });
    fs.put(`${location}/nested/project.txt`, 'Preserved');
    for (const target of [location, `${location}/nested`])
      for (const command of ['apply', 'sync', 'validate']) {
        const response = await execute(
          command,
          { repoRoot: join(fs.root, target) },
          { io: fs.io, resources },
        );
        assert.equal(response.exitCode, 2);
        assert.equal(response.result.diagnostics[0].code, 'PACKAGE_TARGET');
        assert.equal(fs.writes.length, 0);
      }
    assert.equal((await invoke(fs)).exitCode, 0);
    assert.equal(fs.text(`${location}/nested/project.txt`), 'Preserved');
  }
});

test('safe path preflight rejects symlinks, hardlinks, and portable aliases before mutation', async () => {
  for (const overrides of [{ kind: 'link' }, { nlink: 2 }]) {
    const fs = client();
    fs.put('.agentscli/conventions/testing.md', convention(), overrides);
    assert.equal((await invoke(fs)).exitCode, 2);
    assert.equal(fs.writes.length, 0);
  }
  const fs = client({
    '.agentscli/Conventions/testing.md': convention(),
  });
  assert.equal((await invoke(fs)).exitCode, 2);
  assert.equal(fs.writes.length, 0);
  const collision = client({
    '.agentscli/conventions/team/testing.md': convention(),
    '.agentscli/conventions/TEAM/other.md': convention('Other'),
  });
  const response = await invoke(collision);
  assert.equal(response.exitCode, 2);
  assert.equal(response.result.diagnostics[0].code, 'PATH_ALIAS');
  assert.equal(collision.writes.length, 0);
});
test('partial file failure report completed/pending effects and retry converges', async () => {
  const path = '.agentscli/conventions/testing.md';
  const authored = bytes(convention().replaceAll('\n', '\r\n'));
  const fs = memory({ [path]: authored }),
    original = fs.io.rename;
  let count = 0;
  fs.io.rename = (...args) => {
    if (++count === 3) throw new Error('unit failure');
    original(...args);
  };
  const failed = await invoke(fs);
  assert.equal(failed.exitCode, 3);
  assert.ok(failed.result.changes.some((c) => c.status === 'completed'));
  assert.ok(failed.result.changes.some((c) => c.status === 'pending'));
  assert.deepEqual(fs.io.read(join(fs.root, path)), authored);
  fs.io.rename = original;
  assert.equal((await invoke(fs)).exitCode, 0);
  assert.equal((await invoke(fs)).result.changes.length, 0);
  assert.deepEqual(fs.io.read(join(fs.root, path)), authored);
});

test('authored edits and deletions update only the index and are never recreated', async () => {
  const path = '.agentscli/conventions/nested/testing.md';
  const fs = client({ [path]: convention() });
  assert.equal((await invoke(fs)).exitCode, 0);
  const edited = bytes(
    convention('Testing', 'Read before changing tests.') +
      '\nAuthor keeps  trailing spaces.  \n',
  );
  fs.put(path, edited);
  let before = fs.writes.length;
  assert.equal((await invoke(fs, 'validate')).exitCode, 0);
  assert.equal((await invoke(fs, 'sync', { check: true })).exitCode, 1);
  assert.equal(fs.writes.length, before);
  assert.equal((await invoke(fs, 'sync')).exitCode, 0);
  assert.match(fs.text('AGENTS.md'), /Read before changing tests/);
  assert.deepEqual(fs.io.read(join(fs.root, path)), edited);
  fs.nodes.delete(join(fs.root, path));
  before = fs.writes.length;
  assert.equal((await invoke(fs, 'sync', { check: true })).exitCode, 1);
  assert.equal(fs.writes.length, before);
  assert.equal((await invoke(fs)).exitCode, 0);
  assert.equal(fs.text('AGENTS.md'), INDEX_HEADER);
  assert.equal(fs.nodes.has(join(fs.root, path)), false);
  assert.equal((await invoke(fs, 'sync')).result.changes.length, 0);
  assert.equal((await invoke(fs)).result.changes.length, 0);
});

test('private argument parser rejects public commands, unknown flags and incompatible modes', async () => {
  for (const args of [
    ['apply'],
    ['validate', '--check'],
    ['sync', '--unknown'],
    ['sync', '--json', '--json'],
    ['sync', '--dry-run', '--check'],
  ])
    assert.equal((await run(args)).exitCode, 2);
});

test('skill resource aliases reject local paths, remote URLs, HTML entities, case and suffixes', () => {
  const make = (text) => ({
    id: 'review',
    source: 'local',
    path: '.agents/skills/review',
    files: {
      'SKILL.md': bytes(Buffer.from(skill('review')).toString() + text),
    },
  });
  const other = {
    id: 'other',
    source: 'local',
    path: '.agents/skills/other',
    files: { 'SKILL.md': skill('other') },
  };
  for (const text of [
    '```sh\nnode .agents/skills/other/scripts/check.mjs\n```\n',
    'node .AGENTS/SKILLS/OTHER/scripts/check.mjs\n',
    '[Other](https://example.org/team/blob/main/skills/other/SKILL.md?raw=1#start)',
    '[Other](https://example.org/team/tree/main/skills/%6Fther/references/rule.md)',
    '[Other](https://example.org/team/tree/main/skills/other/)',
    '<a title=">" href="../&#111;ther/SKILL.md">Other</a>',
    '[Other](skill://other)',
    '[Rule](https://example.org/team/blob/main/conventions/testing.md)',
    '[Directory](https://example.org/team/conventions/team/)',
    '[Skills](/.agents/skills)',
    '[Skills](https://example.org/team/skills/)',
  ])
    assert.throws(
      () => validateResources({ skills: [make(text), other] }),
      /cross-resource|Fixed/,
    );
  validateResources({
    skills: [
      make(
        '[Own](references/note.md) [Ordinary](https://example.org/guide)\n<!-- <a href="../other/SKILL.md">Example</a> -->\n',
      ),
      other,
    ],
  });
  assert.throws(
    () =>
      uniquePaths([
        'skills/review/Scripts/a.mjs',
        'skills/review/scripts/b.mjs',
      ]),
    /alias/,
  );
});

test('apply replaces proven managed file and directory topologies without adopting unrelated paths', async () => {
  const fs = memory();
  assert.equal((await invoke(fs)).exitCode, 0);
  const id = 'agentscli-build-agents',
    base = `.agents/skills/${id}`;
  fs.put(`${base}/support/item.mjs`, 'obsolete support');
  let upgraded = {
    ...resources,
    skills: {
      ...resources.skills,
      [id]: { ...resources.skills[id], support: bytes('one regular file') },
    },
  };
  let response = await execute(
    'apply',
    { repoRoot: fs.root },
    { io: fs.io, resources: upgraded },
  );
  assert.equal(response.exitCode, 0, JSON.stringify(response.result));
  assert.equal(fs.text(`${base}/support`), 'one regular file');
  upgraded = {
    ...resources,
    skills: {
      ...resources.skills,
      [id]: {
        ...resources.skills[id],
        'support/item.mjs': bytes('nested again'),
      },
    },
  };
  response = await execute(
    'apply',
    { repoRoot: fs.root },
    { io: fs.io, resources: upgraded },
  );
  assert.equal(response.exitCode, 0, JSON.stringify(response.result));
  assert.equal(fs.text(`${base}/support/item.mjs`), 'nested again');
  fs.put('.agents/skills/unrelated/support', 'authored');
  assert.equal((await invoke(fs)).exitCode, 0);
  assert.equal(fs.text('.agents/skills/unrelated/support'), 'authored');
});

test('index bytes are fixed, sorted, escaped and independent of source order', () => {
  const inputs = [
    {
      path: '.agentscli/conventions/z pasta/(dados)/seguranca-dados.md',
      text: convention(
        'Segurança [dados]',
        '"Consultar ao manipular\\r\\ndados **sensíveis**."',
      ),
    },
    {
      path: '.agentscli/conventions/testes.md',
      text: convention('Testes', 'consultar ao criar ou alterar testes.'),
    },
  ];
  const expected =
    '---\ngeneratedBy: "@devel-solid/agentscli"\n---\n\n# AGENTS.md\n\n' +
    '- [Testes](.agentscli/conventions/testes.md): consultar ao criar ou alterar testes.\n' +
    '- [Segurança \\[dados\\]](.agentscli/conventions/z%20pasta/%28dados%29/seguranca-dados.md): Consultar ao manipular dados **sensíveis**.\n';
  assert.equal(render(inputs).get('AGENTS.md'), expected);
  assert.equal(render([...inputs].reverse()).get('AGENTS.md'), expected);
  assert.equal(render([]).get('AGENTS.md'), INDEX_HEADER);
});

test('root ownership requires exact structural generatedBy frontmatter', async () => {
  for (const root of [
    '# Handwritten\n',
    '---\ngeneratedBy: another-generator\n---\n# Other output\n',
    '---\ngeneratedBy: ["@devel-solid/agentscli"]\n---\n',
    '---\ngeneratedBy: "@devel-solid/agentscli"\ngeneratedBy: "@devel-solid/agentscli"\n---\n',
    '---\ngeneratedBy: "@devel-solid/agentscli"\nextra: true\n---\n',
    '---\ngeneratedBy: &source "@devel-solid/agentscli"\nother: *source\n---\n',
    '---\ngeneratedBy: !!str "@devel-solid/agentscli"\n---\n',
    '---\ngeneratedBy: "@devel-solid/agentscli"\n',
    new Uint8Array([0xff]),
  ]) {
    assert.equal(
      isGenerated(typeof root === 'string' ? bytes(root) : root),
      false,
    );
    const fs = client({ 'AGENTS.md': root });
    for (const [command, options] of [
      ['apply', {}],
      ['apply', { dryRun: true }],
      ['sync', { check: true }],
    ]) {
      const response = await invoke(fs, command, options);
      assert.equal(response.exitCode, 2);
      assert.equal(response.result.diagnostics[0].code, 'DOCUMENT_CONFLICT');
      assert.equal(fs.writes.length, 0);
    }
  }
  const owned =
    "---\r\ngeneratedBy: '@devel-solid/agentscli'\r\n---\r\nChanged body.\r\n";
  assert.equal(isGenerated(bytes(owned)), true);
  const fs = client({ 'AGENTS.md': owned });
  assert.equal((await invoke(fs)).exitCode, 0);
  assert.equal(fs.text('AGENTS.md'), INDEX_HEADER);
});

test('comment-bearing discovery triggers are rejected before any planned writes', async () => {
  for (const trigger of [
    'consultar <!-- hidden --> ao testar.',
    '> <!-- hidden -->',
    'texto\n<!-- hidden -->',
  ]) {
    const fs = client({
      '.agentscli/conventions/testing.md': convention(
        'Testing',
        JSON.stringify(trigger),
      ),
    });
    const response = await invoke(fs);
    assert.equal(response.exitCode, 2);
    assert.equal(response.result.diagnostics[0].code, 'SOURCE_TRIGGER');
    assert.equal(fs.writes.length, 0);
  }
  validateConvention(
    convention('Testing', "'consultar o literal `<!-- comment -->`.'"),
    'testing.md',
  );
});

test('normalized discovery triggers retain cross-resource link validation', async () => {
  for (const trigger of [
    '> [Other](.agentscli/conventions/other.md)',
    '[Other](.agents/skills/review/SKILL.md)\nwhen editing tests.',
  ]) {
    const fs = client({
      '.agentscli/conventions/testing.md': convention(
        'Testing',
        JSON.stringify(trigger),
      ),
    });
    const response = await invoke(fs);
    assert.equal(response.exitCode, 2);
    assert.equal(response.result.diagnostics[0].code, 'RESOURCE_LINK');
    assert.equal(fs.writes.length, 0);
  }
});

test('multiline setext convention titles occupy one index line', () => {
  const document = render([
    {
      path: '.agentscli/conventions/testing-policy.md',
      text: '---\ntrigger: Read before testing.\n---\n\nTesting\npolicy\n======\n\nKeep useful rules.\n',
    },
  ]).get('AGENTS.md');
  assert.equal(
    document,
    '---\ngeneratedBy: "@devel-solid/agentscli"\n---\n\n# AGENTS.md\n\n- [Testing policy](.agentscli/conventions/testing-policy.md): Read before testing.\n',
  );
});
