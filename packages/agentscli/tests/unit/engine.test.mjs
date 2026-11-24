import test from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { memory } from './memory.mjs';
import {
  EngineError,
  PRODUCT_SKILLS,
  parseManifest,
  parseYaml,
  serializeManifest,
  parseLegacyManifest,
} from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/manifest.mjs';
import {
  validateConvention,
  convertLegacyConvention,
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
  templates: {
    en: {
      'conventions/project-context.tpl.md': bytes(
        convention('Project context'),
      ),
    },
    'pt-br': {
      'conventions/contexto-do-projeto.tpl.md': bytes(
        convention('Contexto do projeto'),
      ),
    },
  },
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
export const client = (files) =>
  memory({
    '.agentscli/config.yml': 'language: en\n',
    ...files,
  });
export const invoke = (fs, command = 'apply', options = {}) =>
  execute(command, { repoRoot: fs.root, ...options }, { io: fs.io, resources });

test('strict config permits language and rejects extra fields and YAML aliases', () => {
  const config = { language: 'pt-br' };
  assert.deepEqual(parseManifest(serializeManifest(config)), config);
  for (const text of [
    '[]',
    'language: en\nlanguage: en',
    'language: EN',
    'language: en\nroots: {}',
    'language: &a [*a]',
  ])
    assert.throws(() => parseManifest(text));
  assert.throws(() => parseYaml('a: &a {b: 1}\nb: *a'));
  assert.throws(() => parseYaml('a: !!str text'));
});
test('legacy roots remain separately strict and portable paths reject aliases', () => {
  assert.equal(
    parseLegacyManifest(
      'language: en\ntemplates_dir: templates\nconventions_dir: docs/rules',
    ).templates_dir,
    'templates',
  );
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
    convention() + '\n```md\n# Example\n<!-- AGENT-CARD START -->\n```\n';
  assert.equal(validateConvention(text, 'testing.tpl.md').title, 'Testing');
  for (const text of [
    convention().replace('trigger:', 'unknown: true\ntrigger:'),
    convention().replace('Read before testing.', ''),
    convention() + '\n# Second\n',
    '# Testing\n',
  ])
    assert.throws(() => validateConvention(text, 'testing.tpl.md'));
  assert.throws(() => decode(new Uint8Array([0xff]), 'invalid'));
  const old =
    '# Testing\n<!-- AGENT-CARD START -->\nRead testing.\n<!-- AGENT-CARD END -->\nRule.\n';
  assert.throws(
    () => validateConvention(old, 'testing.tpl.md'),
    /apply --migrate/,
  );
  assert.equal(
    validateConvention(
      convertLegacyConvention(old, 'testing.tpl.md'),
      'testing.tpl.md',
    ).trigger,
    'Read testing.',
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
    'compatibility: [Node]\n',
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
    id: 'testing',
    source: 'local',
    path: '.agentscli/templates/conventions/testing.tpl.md',
    output: '.agentscli/conventions/testing.md',
  };
  const other = {
    id: 'other',
    source: 'local',
    path: '.agentscli/templates/conventions/other.tpl.md',
    output: '.agentscli/conventions/other.md',
    text: convention('Other'),
  };
  for (const link of [
    '[rule](other.md)',
    '[rule][x]\n\n[x]: other.md',
    '<a href="other.md">rule</a>',
    '![rule](%6fther.md)',
    '[skill](../../.agents/skills/review/SKILL.md)',
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
          '[own](#testing) [ordinary](../../README.md)\n\n```md\n[example](other.md)\n```\n',
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
        '[support](references/note.md)\n',
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
  fs.put(
    '.agentscli/templates/conventions/custom.tpl.md',
    convention('Custom'),
  );
  fs.put('.agentscli/conventions/extra.bin', 'obsolete');
  fs.put('.agents/skills/agentscli-build-agents/unwanted.txt', 'obsolete');
  fs.put('.agents/skills/unrelated/SKILL.md', skill('unrelated'));
  fs.put(
    'AGENTS.md',
    '---\ngeneratedBy: "@devel-solid/agentscli"\n---\nEdited managed copy.',
  );
  fs.put(
    '.agents/skills/agentscli-edit-agents/SKILL.md',
    'broken output metadata',
  );
  fs.put(
    '.agents/skills/agentscli-edit-agents/obsolete.yml',
    'obsolete support',
  );
  assert.equal((await invoke(fs)).exitCode, 0);
  assert.match(fs.text('AGENTS.md'), /Custom/);
  assert.match(
    fs.text('.agentscli/templates/conventions/custom.tpl.md'),
    /trigger:/,
  );
  assert.equal(
    fs.nodes.has(join(fs.root, '.agentscli/conventions/extra.bin')),
    false,
  );
  assert.equal(
    fs.nodes.has(
      join(fs.root, '.agents/skills/agentscli-build-agents/unwanted.txt'),
    ),
    false,
  );
  assert.match(fs.text('.agents/skills/unrelated/SKILL.md'), /unrelated/);
  assert.equal(
    fs.io.info(
      join(fs.root, '.agents/skills/agentscli-edit-agents/obsolete.yml'),
    ),
    undefined,
  );
});
test('apply preserves existing language and templates; explicit language changes notices without translation', async () => {
  const fs = client({
    '.agentscli/config.yml': 'language: pt-br\n',
    '.agentscli/templates/conventions/testing.tpl.md': convention(),
  });
  assert.equal((await invoke(fs)).exitCode, 0);
  assert.match(fs.text('.agentscli/config.yml'), /pt-br/);
  assert.match(fs.text('.agentscli/conventions/testing.md'), /Arquivo gerado/);
  assert.equal((await invoke(fs, 'apply', { language: 'en' })).exitCode, 0);
  assert.match(fs.text('.agentscli/conventions/testing.md'), /Generated file/);
  assert.equal(
    fs.text('.agentscli/templates/conventions/testing.tpl.md'),
    convention(),
  );
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
    '.agents/skills/.openspec-target': bytes('codex\n'),
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
  fs.put('.agentscli/templates/conventions/testing.tpl.md', convention());
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
      '.agents/skills/.openspec-target': 'codex\n',
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
    '.agents/skills/.openspec-target',
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
    '.agents/skills/.openspec-target': 'codex\n',
    '.agents/skills/.OPENSPEC-TARGET': 'alias\n',
  });
  const response = await invoke(fs);
  assert.equal(response.exitCode, 2);
  assert.equal(response.result.diagnostics[0].code, 'PATH_ALIAS');
  assert.equal(fs.writes.length, 0);
});

test('regular files cannot occupy packaged or retired managed skill directories', async () => {
  for (const id of [
    ...PRODUCT_SKILLS,
    'agentscli-update-agents',
    'agentscli-edit-agents',
  ]) {
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
test('manual root AGENTS, invalid authored input, and legacy state block all writes', async () => {
  for (const files of [
    { 'AGENTS.md': '# Handwritten\n' },
    {
      '.agentscli/templates/conventions/testing.tpl.md': convention().replace(
        'trigger:',
        'unknown: true\ntrigger:',
      ),
    },
    { 'agentscli-compose.yml': 'legacy' },
  ]) {
    const fs = client(files);
    const response = await invoke(fs);
    assert.equal(response.exitCode, 2);
    assert.equal(fs.writes.length, 0);
  }
});
test('tool package identity, verified workspaces, and ancestors guard contexts without agentscli.yml', async () => {
  for (const files of [
    {
      'package.json': JSON.stringify({
        name: '@devel-solid/agentscli',
        bin: { agentscli: 'dist/cli.js' },
      }),
    },
    {
      'package.json': JSON.stringify({
        private: true,
        workspaces: ['packages/agentscli'],
      }),
      'packages/agentscli/package.json': JSON.stringify({
        name: '@devel-solid/agentscli',
        bin: { agentscli: 'dist/cli.js' },
      }),
    },
  ]) {
    const fs = client(files);
    assert.equal((await invoke(fs)).exitCode, 2);
    assert.equal(fs.writes.length, 0);
  }
  const fs = client({
    'agentscli.yml': 'skills: []\n',
    'package.json': '{"private":true,"workspaces":["packages/*"]}',
  });
  assert.equal((await invoke(fs, 'validate')).exitCode, 0);
  const parent = client();
  parent.nodes.set(join(dirname(parent.root), 'package.json'), {
    kind: 'file',
    nlink: 1,
    data: bytes(
      JSON.stringify({
        name: '@devel-solid/agentscli',
        bin: { agentscli: 'dist/cli.js' },
      }),
    ),
  });
  assert.equal((await invoke(parent)).exitCode, 2);
});
test('safe path preflight rejects symlinks, hardlinks, and portable aliases before mutation', async () => {
  for (const overrides of [{ kind: 'link' }, { nlink: 2 }]) {
    const fs = client();
    fs.put(
      '.agentscli/templates/conventions/testing.tpl.md',
      convention(),
      overrides,
    );
    assert.equal((await invoke(fs)).exitCode, 2);
    assert.equal(fs.writes.length, 0);
  }
  const fs = client({
    '.agentscli/templates/Conventions/test.tpl.md': convention(),
  });
  assert.equal((await invoke(fs)).exitCode, 2);
  assert.equal(fs.writes.length, 0);
});
test('partial file failure report completed/pending effects and retry converges', async () => {
  const fs = memory(),
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
  fs.io.rename = original;
  assert.equal((await invoke(fs)).exitCode, 0);
  assert.equal((await invoke(fs)).result.changes.length, 0);
});
test('private argument parser rejects aliases, repeated flags, migration, language, and invalid modes without writes', async () => {
  for (const args of [
    ['apply'],
    ['validate', '--check'],
    ['sync', '--migrate'],
    ['sync', '--lang', 'en'],
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
    '[Rule](https://example.org/team/blob/main/conventions/testing.tpl.md)',
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

test('index bytes are fixed, sorted, escaped and independent of source order or locale', () => {
  const inputs = [
    {
      source: '.agentscli/templates/conventions/z/seguranca-dados.tpl.md',
      output: '.agentscli/conventions/z pasta/(dados)/seguranca-dados.md',
      text: convention(
        'Segurança [dados]',
        '"Consultar ao manipular\\r\\ndados **sensíveis**."',
      ),
    },
    {
      source: '.agentscli/templates/conventions/testes.tpl.md',
      output: '.agentscli/conventions/testes.md',
      text: convention('Testes', 'consultar ao criar ou alterar testes.'),
    },
  ];
  const expected =
    '---\ngeneratedBy: "@devel-solid/agentscli"\n---\n\n# AGENTS.md\n\n' +
    '- [Testes](.agentscli/conventions/testes.md): consultar ao criar ou alterar testes.\n' +
    '- [Segurança \\[dados\\]](.agentscli/conventions/z%20pasta/%28dados%29/seguranca-dados.md): Consultar ao manipular dados **sensíveis**.\n';
  assert.equal(render(inputs, 'en').get('AGENTS.md'), expected);
  assert.equal(
    render([...inputs].reverse(), 'pt-br').get('AGENTS.md'),
    expected,
  );
  assert.doesNotMatch(expected, /<!--/u);
  assert.equal(render([], 'en').get('AGENTS.md'), INDEX_HEADER);
});

test('empty client generation needs no main template and never restores deleted conventions', async () => {
  const fs = client();
  assert.equal((await invoke(fs)).exitCode, 0);
  assert.equal(fs.text('AGENTS.md'), INDEX_HEADER);
  assert.equal(
    fs.io.info(join(fs.root, '.agentscli/templates/AGENTS.tpl.md')),
    undefined,
  );
  assert.equal(
    fs.io.info(join(fs.root, '.agentscli/templates/conventions')),
    undefined,
  );
  assert.equal((await invoke(fs, 'sync', { check: true })).exitCode, 0);
  assert.equal((await invoke(fs)).result.changes.length, 0);
});

test('retired authored main templates are preserved and have no effect on generated index', async () => {
  const path = '.agentscli/templates/AGENTS.tpl.md';
  const authored =
    '# Local project\n\nDo not lose these authored instructions.\n';
  const fs = client({ [path]: authored });
  assert.equal((await invoke(fs)).exitCode, 0);
  assert.equal(fs.text(path), authored);
  assert.equal(fs.text('AGENTS.md'), INDEX_HEADER);
});

test('root ownership requires exact structural generatedBy frontmatter', async () => {
  for (const root of [
    '# Handwritten\n',
    '<!-- agentscli:generated -->\n# Former output\n',
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
      '.agentscli/templates/conventions/testing.tpl.md': convention(
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
    'testing.tpl.md',
  );
});

test('normalized discovery triggers retain cross-resource link validation', async () => {
  for (const trigger of [
    '> [Other](.agentscli/conventions/other.md)',
    '[Other](.agents/skills/review/SKILL.md)\nwhen editing tests.',
  ]) {
    const fs = client({
      '.agentscli/templates/conventions/testing.tpl.md': convention(
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
  const document = render(
    [
      {
        source: '.agentscli/templates/conventions/testing-policy.tpl.md',
        output: '.agentscli/conventions/testing-policy.md',
        text: '---\ntrigger: Read before testing.\n---\n\nTesting\npolicy\n======\n\nKeep useful rules.\n',
      },
    ],
    'en',
  ).get('AGENTS.md');
  assert.equal(
    document,
    '---\ngeneratedBy: "@devel-solid/agentscli"\n---\n\n# AGENTS.md\n\n- [Testing policy](.agentscli/conventions/testing-policy.md): Read before testing.\n',
  );
});
