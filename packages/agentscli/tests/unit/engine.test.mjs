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
  validateTemplate,
  convertLegacyConvention,
  decode,
} from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/markdown.mjs';
import {
  relativePath,
  uniquePaths,
} from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/paths.mjs';
import {
  validateResources,
  skillRequirements,
} from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/content.mjs';
import {
  execute,
  applyEffects,
} from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/runtime.mjs';
import { run } from '../../assets/templates/skills/agentscli-build-agents/scripts/build-agents.mjs';
export const bytes = (text) => new TextEncoder().encode(text);
export const main = '# Project\n\n<!-- agentscli:conventions -->\n';
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
      'AGENTS.tpl.md': bytes(main),
      'conventions/project-context.tpl.md': bytes(
        convention('Project context'),
      ),
    },
    'pt-br': {
      'AGENTS.tpl.md': bytes(main),
      'conventions/contexto-do-projeto.tpl.md': bytes(
        convention('Contexto do projeto'),
      ),
    },
  },
  skills: Object.fromEntries(
    PRODUCT_SKILLS.map((id) => [
      id,
      {
        'SKILL.md': skill(
          id,
          id === 'agentscli-build-agents'
            ? ''
            : 'metadata:\n  agentscli: agentscli-skill.yml\n',
        ),
        'references/note.md': bytes('Own support.\n'),
        ...(id === 'agentscli-build-agents'
          ? {}
          : {
              'agentscli-skill.yml': bytes(
                'requires:\n  - id: agentscli-build-agents\n    source: local\n',
              ),
            }),
      },
    ]),
  ),
};
export const client = (files) =>
  memory({
    '.agentscli/config.yml': 'language: en\n',
    '.agentscli/templates/AGENTS.tpl.md': main,
    ...files,
  });
export const invoke = (fs, command = 'apply', options = {}) =>
  execute(command, { repoRoot: fs.root, ...options }, { io: fs.io, resources });

test('strict config permits one explicit pinned hub and no layout aliases', () => {
  const config = {
    language: 'pt-br',
    hub: {
      repository: 'git@example.test:team/hub.git',
      commit: 'a'.repeat(40),
      conventions: ['testing'],
      skills: [],
    },
  };
  assert.deepEqual(parseManifest(serializeManifest(config)), config);
  for (const text of [
    '[]',
    'language: en\nlanguage: en',
    'language: EN',
    'language: en\nroots: {}',
    'language: &a [*a]',
  ])
    assert.throws(() => parseManifest(text));
  for (const repository of [
    '../local',
    'file:///tmp/hub',
    'ext::helper',
    'https://user:pass@example.test/hub',
    'C:/repo',
  ])
    assert.throws(() =>
      parseManifest(
        serializeManifest({ ...config, hub: { ...config.hub, repository } }),
      ),
    );
  assert.throws(() =>
    parseManifest(
      serializeManifest({ ...config, hub: { ...config.hub, commit: 'main' } }),
    ),
  );
  assert.throws(() =>
    parseManifest(
      serializeManifest({
        ...config,
        hub: { ...config.hub, skills: ['agentscli-build-agents'] },
      }),
    ),
  );
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
    convention().replace('trigger:', 'requires: []\ntrigger:'),
    convention().replace('Read before testing.', ''),
    convention() + '\n# Second\n',
    '# Testing\n',
  ])
    assert.throws(() => validateConvention(text, 'testing.tpl.md'));
  assert.throws(() => validateTemplate('# Project\n', 'AGENTS.tpl.md'));
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
test('general skill configuration resolves only explicitly available skills by origin', () => {
  const files = {
    'SKILL.md': skill(
      'review',
      'metadata:\n  agentscli: agentscli-skill.yml\n',
    ),
    'agentscli-skill.yml': bytes(
      'requires:\n  - id: testing\n    source: hub\n',
    ),
  };
  assert.equal(
    skillRequirements(files, 'skills/review', 'hub').requirements[0].id,
    'testing',
  );
  assert.throws(
    () =>
      validateResources({
        skills: [{ id: 'review', source: 'hub', path: 'skills/review', files }],
      }),
    /explicitly available/,
  );
  const conv = {
    id: 'testing',
    source: 'hub',
    path: 'conventions/testing.tpl.md',
    output: '.agentscli/conventions/testing.md',
    text: convention(),
  };
  const review = { id: 'review', source: 'hub', path: 'skills/review', files };
  const testing = {
    id: 'testing',
    source: 'hub',
    path: 'skills/testing',
    files: {
      'SKILL.md': skill(
        'testing',
        'metadata:\n  agentscli: agentscli-skill.yml\n',
      ),
      'agentscli-skill.yml': bytes(
        'requires:\n  - id: review\n    source: hub\n',
      ),
    },
  };
  assert.throws(
    () => validateResources({ conventions: [conv], skills: [review] }),
    /explicitly available skill/,
  );
  assert.throws(
    () =>
      validateResources({ skills: [review, { ...testing, source: 'local' }] }),
    /explicitly available skill/,
  );
  validateResources({ conventions: [conv], skills: [review, testing] });
  assert.throws(
    () =>
      validateResources({
        skills: [
          review,
          {
            ...testing,
            files: {
              ...testing.files,
              'agentscli-skill.yml': bytes(
                'requires:\n  - id: absent\n    source: hub\n',
              ),
            },
          },
        ],
      }),
    /absent/,
  );
});

test('optional skill configuration is strict native YAML and rejects obsolete declarations', () => {
  const entry = skill(
    'review',
    'metadata:\n  agentscli: agentscli-skill.yml\n',
  );
  const parse = (config, source = 'local') =>
    skillRequirements(
      {
        'SKILL.md': entry,
        'agentscli-skill.yml':
          typeof config === 'string' ? bytes(config) : config,
      },
      'skills/review',
      source,
    );
  for (const valid of ['{}\n', 'requires: []\n'])
    assert.deepEqual(parse(valid).requirements, []);
  assert.deepEqual(
    skillRequirements({ 'SKILL.md': skill('review') }, 'skills/review')
      .requirements,
    [],
  );
  const local = 'requires:\n  - id: testing\n    source: local\n';
  assert.equal(parse(local).requirements[0].id, 'testing');
  assert.throws(() => parse(local, 'hub'), /source/);
  for (const invalid of [
    '',
    'null',
    '[]',
    '"requires: []"',
    'requires: null',
    'requires: "[]"',
    'requires: []\nunknown: true',
    'requires: []\nrequires: []',
    'conventions: []\nskills: []',
    'requires: {skills: []}',
    'requires: &list []\nother: *list',
    'requires: !!seq []',
    'requires:\n  - id: x\n    source: global',
    'requires:\n  - id: ../x\n    source: local',
    'requires:\n  - id: x\n    source: local\n    type: convention',
    'requires:\n  - id: x\n    source: local\n  - id: x\n    source: local',
  ])
    assert.throws(() => parse(invalid), invalid);
  assert.throws(() => parse(new Uint8Array([0xff])));
  for (const files of [
    { 'SKILL.md': entry },
    {
      'SKILL.md': skill('review'),
      'agentscli-skill.yml': bytes('requires: []'),
    },
    {
      'SKILL.md': skill(
        'review',
        'metadata:\n  agentscli: ../agentscli-skill.yml\n',
      ),
      'agentscli-skill.yml': bytes('{}'),
    },
    {
      'SKILL.md': skill(
        'review',
        'metadata:\n  agentscli: [agentscli-skill.yml]\n',
      ),
    },
    { 'SKILL.md': skill('review', 'requires: []\n') },
    { 'SKILL.md': skill('review', 'metadata:\n  requires: requires.yml\n') },
    {
      'SKILL.md': skill('review'),
      'requires.yml': bytes('conventions: []\nskills: []'),
    },
    {
      'SKILL.md': bytes(
        '---\nname: review\ndescription: Review.\n---\n<!-- agentscli:requires {} -->\n',
      ),
    },
  ])
    assert.throws(() => skillRequirements(files, 'skills/review'));
  skillRequirements(
    {
      'SKILL.md': bytes(
        '---\nname: review\ndescription: Review.\n---\n```markdown\n<!-- agentscli:requires {} -->\n```\n',
      ),
    },
    'skills/review',
  );
});
test('standard skill frontmatter rejects extension keys and non-string optional fields', () => {
  for (const extra of [
    'unknown: true\n',
    'compatibility: [Node]\n',
    'license: {name: MIT}\n',
    'allowed-tools: [Bash]\n',
  ])
    assert.throws(() =>
      skillRequirements(
        { 'SKILL.md': skill('review', extra) },
        'skills/review',
      ),
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
  fs.put('AGENTS.md', '<!-- agentscli:generated -->\nEdited managed copy.');
  fs.put(
    '.agents/skills/agentscli-edit-agents/SKILL.md',
    'broken output metadata',
  );
  fs.put(
    '.agents/skills/agentscli-edit-agents/requires.yml',
    'obsolete declaration',
  );
  fs.nodes.delete(
    join(fs.root, '.agents/skills/agentscli-edit-agents/agentscli-skill.yml'),
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
      join(fs.root, '.agents/skills/agentscli-edit-agents/requires.yml'),
    ),
    undefined,
  );
  assert.equal(
    fs.text('.agents/skills/agentscli-edit-agents/agentscli-skill.yml'),
    'requires:\n  - id: agentscli-build-agents\n    source: local\n',
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
test('manual root AGENTS, invalid authored input, and legacy state block all writes', async () => {
  for (const files of [
    { 'AGENTS.md': '# Handwritten\n' },
    {
      '.agentscli/templates/conventions/testing.tpl.md': convention().replace(
        'trigger:',
        'requires: []\ntrigger:',
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
test('tool package identity, verified workspaces, hub markers, and ancestors guard contexts without agentscli.yml', async () => {
  for (const files of [
    {
      'package.json': JSON.stringify({
        name: '@devel-solid/agentscli',
        bin: { agentscli: 'dist/cli.js' },
      }),
    },
    { 'agentscli-hub.yml': 'schemaVersion: 1\nversion: 1.0.0\n' },
    {
      'package.json': JSON.stringify({
        private: true,
        workspaces: ['packages/agentscli', 'packages/agentscli-hub'],
      }),
      'packages/agentscli/package.json': JSON.stringify({
        name: '@devel-solid/agentscli',
        bin: { agentscli: 'dist/cli.js' },
      }),
      'packages/agentscli-hub/package.json': JSON.stringify({
        name: '@devel-solid/agentscli-hub',
        bin: { 'agentscli-hub': 'dist/cli.js' },
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
  parent.nodes.set(join(dirname(parent.root), 'agentscli-hub.yml'), {
    kind: 'file',
    nlink: 1,
    data: bytes('hub'),
  });
  assert.equal((await invoke(parent)).exitCode, 2);
});
test('safe path preflight rejects symlinks, hardlinks, and portable aliases before mutation', async () => {
  for (const overrides of [{ kind: 'link' }, { nlink: 2 }]) {
    const fs = client();
    fs.put('.agentscli/templates/AGENTS.tpl.md', main, overrides);
    assert.equal((await invoke(fs)).exitCode, 2);
    assert.equal(fs.writes.length, 0);
  }
  const fs = client({
    '.agentscli/templates/Conventions/test.tpl.md': convention(),
  });
  assert.equal((await invoke(fs)).exitCode, 2);
  assert.equal(fs.writes.length, 0);
});
test('partial file and permission failure report completed/pending effects and retry converges', async () => {
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
  const mode = client({ 'script.sh': 'echo ok\n' });
  mode.io.supportsMode = true;
  mode.io.chmod = () => {
    throw new Error('chmod refused');
  };
  const response = applyEffects(mode.io, mode.root, [
    {
      path: 'script.sh',
      action: 'update',
      content: bytes('echo ok\n'),
      previous: bytes('echo ok\n'),
      gitMode: '100755',
    },
  ]);
  assert.equal(response.exitCode, 3);
  assert.equal(response.changes[0].status, 'pending');
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

test('skill resource aliases reject snapshot paths, remote URLs, HTML entities, case and suffixes', () => {
  const make = (text) => ({
    id: 'review',
    source: 'hub',
    path: '.agentscli/hub/skills/review',
    installedPath: '.agents/skills/review',
    files: {
      'SKILL.md': bytes(Buffer.from(skill('review')).toString() + text),
    },
  });
  const other = {
    id: 'other',
    source: 'hub',
    path: '.agentscli/hub/skills/other',
    installedPath: '.agents/skills/other',
    files: { 'SKILL.md': skill('other') },
  };
  for (const text of [
    '```sh\nnode .agentscli/hub/skills/other/scripts/check.mjs\n```\n',
    'node .AGENTSCLI/HUB/SKILLS/OTHER/scripts/check.mjs\n',
    '[Other](https://example.org/hub/blob/main/skills/other/SKILL.md?raw=1#start)',
    '[Other](https://example.org/hub/tree/main/skills/%6Fther/references/rule.md)',
    '[Other](https://example.org/hub/tree/main/skills/other/)',
    '<a title=">" href="../&#111;ther/SKILL.md">Other</a>',
    '[Other](skill://other)',
    '[Rule](https://example.org/hub/blob/main/conventions/testing.tpl.md)',
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
