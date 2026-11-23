import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import * as contract from '../../assets/templates/skills/agentscli-hub-publish/scripts/support.mjs';
import { memoryFs } from './memory-fs.mjs';

const convention = (
  body = '# Code review\n\nReview meaning.\n',
  yaml = 'trigger: Read before reviewing code.',
) => `---\n${yaml}\n---\n${body}`;
const skill = (name = 'review-code', metadata = '') =>
  `---\nname: ${name}\ndescription: Review requested code changes.\n${metadata}---\n# Review\n\nReview meaning.\n`;
test('YAML diagnostics omit source excerpts and legacy dependency comments are rejected outside examples', () => {
  assert.throws(
    () => contract.parseYaml('sensitive-example: [malformed'),
    (error) =>
      error.code === 'yaml' && !error.message.includes('sensitive-example'),
  );
  assert.throws(
    () =>
      contract.parseSkill(
        skill() + '\n<!-- agentscli:requires {"skills": []} -->\n',
        'SKILL.md',
      ),
    { code: 'requires-pointer' },
  );
  assert.throws(
    () =>
      contract.parseConvention(
        convention('# Code review\n\n<!-- agentscli:requires {} -->\n'),
        'conventions/code-review.tpl.md',
      ),
    { code: 'convention-requires' },
  );
  assert.doesNotThrow(() =>
    contract.parseConvention(
      convention(
        '# Code review\n\n```markdown\n<!-- agentscli:requires {} -->\n```\n',
      ),
      'conventions/code-review.tpl.md',
    ),
  );
});
test('strict YAML rejects duplicate keys, aliases, explicit tags, and malformed values', () => {
  for (const value of [
    'a: 1\na: 2',
    'a: &value [1]\nb: *value',
    'a: !!str value',
    '[unterminated',
  ])
    assert.throws(() => contract.parseYaml(value), { code: 'yaml' });
  assert.deepEqual(contract.parseYaml('a: [one, two]'), { a: ['one', 'two'] });
});
test('manifest versions the hub content independently and forbids extra keys', () => {
  assert.equal(
    contract.parseManifest('schemaVersion: 1\nversion: 1.0.0').version,
    '1.0.0',
  );
  for (const value of [
    'schemaVersion: 2\nversion: 1.0.0',
    'schemaVersion: 1\nversion: 0.01.0',
    'schemaVersion: 1\nversion: 1.0.0\ngeneratorVersion: 0.1.0',
  ])
    assert.throws(() => contract.parseManifest(value));
});
test('conventions accept trigger-only YAML and real H1 while preserving examples', () => {
  const value = convention(
    '# Code review\n\n```markdown\n# Literal example\n```\n\nPreserve **meaning**.\n',
  );
  const parsed = contract.parseConvention(
    value,
    'conventions/code-review.tpl.md',
  );
  assert.equal(parsed.title, 'Code review');
  assert.match(parsed.body, /# Literal example/);
  for (const yaml of [
    'trigger: 1',
    'trigger: ""',
    'trigger: Good\nunknown: nope',
    'trigger: Good\nrequires: []',
    'trigger: Good\ntrigger: Duplicate',
  ])
    assert.throws(() =>
      contract.parseConvention(
        convention(undefined, yaml),
        'conventions/code-review.tpl.md',
      ),
    );
  assert.throws(
    () => contract.parseConvention(convention(), 'conventions/wrong.tpl.md'),
    { code: 'filename' },
  );
  assert.throws(
    () =>
      contract.parseConvention(
        '---\nrequires: []\n---\n# Internal\n',
        'docs/conventions/internal.md',
        { shared: false },
      ),
    { code: 'convention-requires' },
  );
});
test('general configuration has only an optional skill requirement list with explicit origins', () => {
  const text = 'requires:\n  - id: inspect-code\n    source: hub\n';
  assert.equal(
    contract.parseSkillConfiguration(text, 'agentscli-skill.yml', {
      shared: true,
    }).requires[0].id,
    'inspect-code',
  );
  for (const empty of ['{}', 'requires: []'])
    assert.deepEqual(
      contract.parseSkillConfiguration(empty, 'agentscli-skill.yml'),
      { requires: [] },
    );
  for (const value of [
    '',
    'null',
    '[]',
    'requires: null',
    'requires: "[]"',
    'conventions: []\nskills: []',
    'requires: []\nfuture: true',
    'requires: [{id: x, source: global}]',
    'requires: [{id: ../x, source: hub}]',
    'requires: [{id: front_end/x, source: hub}]',
    'requires: [{id: x, source: hub, path: x}]',
    'requires: [{id: x}]',
    'requires: [{id: x, source: hub}, {id: x, source: hub}]',
  ])
    assert.throws(() =>
      contract.parseSkillConfiguration(value, 'agentscli-skill.yml'),
    );
  assert.throws(() =>
    contract.parseSkillConfiguration(
      text.replaceAll('source: hub', 'source: local'),
      'agentscli-skill.yml',
      { shared: true },
    ),
  );
});
test('standard skill metadata uses only the string pointer and validates names', () => {
  assert.equal(
    contract.parseSkill(
      skill('review-code', 'metadata:\n  agentscli: agentscli-skill.yml\n'),
      'skills/review-code/SKILL.md',
      'review-code',
    ).data.metadata.agentscli,
    'agentscli-skill.yml',
  );
  for (const metadata of [
    'requires: []\n',
    'metadata:\n  requires: [one]\n',
    'metadata:\n  requires: ../requires.yml\n',
    'metadata:\n  requires: requires.yml\n',
    'metadata:\n  agentscli: [one]\n',
    'metadata:\n  agentscli: ../agentscli-skill.yml\n',
  ])
    assert.throws(() =>
      contract.parseSkill(skill('review-code', metadata), 'SKILL.md'),
    );
  assert.throws(() => contract.parseSkill(skill(), 'SKILL.md', 'wrong-name'));
  for (const declaration of [
    'license: {name: MIT}\n',
    'compatibility: [Node]\n',
    'allowed-tools: [Bash]\n',
  ])
    assert.throws(
      () => contract.parseSkill(skill('review-code', declaration), 'SKILL.md'),
      { code: 'skill-frontmatter' },
    );
});
test('dependency closure respects source, explicit selection, transitivity, and cycles', () => {
  const map = new Map([
    [
      'hub:a',
      {
        requires: [{ id: 'b', source: 'hub' }],
      },
    ],
    ['hub:b', { requires: [{ id: 'a', source: 'hub' }] }],
    ['local:b', {}],
  ]);
  assert.deepEqual(
    [...contract.resolveDependencies(map, ['hub:a'])],
    ['hub:a', 'hub:b'],
  );
  map.get('hub:b').requires.push({ id: 'c', source: 'hub' });
  assert.throws(() => contract.resolveDependencies(map, ['hub:a']), {
    code: 'dependency',
  });
  map.set('hub:c', {});
  assert.deepEqual(
    [...contract.resolveDependencies(map, ['hub:a'])],
    ['hub:a', 'hub:b', 'hub:c'],
  );
  map.delete('hub:b');
  assert.throws(() => contract.resolveDependencies(map, ['hub:a']), {
    code: 'dependency',
  });
});
test('mechanical links reject inline/reference/image/HTML/encoded convention and skill targets', () => {
  const options = {
    kind: 'convention',
    conventions: [
      'docs/conventions/code-review.md',
      'docs/conventions/other.md',
    ],
    skillRoots: ['.agents/skills/review-code'],
  };
  for (const value of [
    '[other](other.md#part)',
    '[other][ref]\n\n[ref]: other.md?q=1',
    '![other](%6fther.md)',
    '<a href="other.md">other</a>',
    '[skill](../../.agents/skills/review-code)',
    '[support](../../.agents/skills/review-code/scripts/check.mjs)',
    '[deps](../../.agents/skills/review-code/requires.yml)',
  ])
    assert.throws(
      () =>
        contract.validateLinks(
          value,
          'docs/conventions/code-review.md',
          options,
        ),
      { code: 'resource-link' },
    );
  for (const value of [
    '[self](#part)',
    '[self](code-review.md#part)',
    '[project](../../package.json)',
    '```markdown\n[invalid](other.md)\n```',
  ])
    assert.doesNotThrow(() =>
      contract.validateLinks(value, 'docs/conventions/code-review.md', options),
    );
});
test('skills keep own support links and identities but reject foreign workflow paths', () => {
  const options = {
    kind: 'skill',
    conventions: ['docs/conventions/rules.md'],
    skillRoots: ['.agents/skills/one', '.agents/skills/two'],
    ownRoot: '.agents/skills/one',
  };
  for (const value of [
    '[own](scripts/check.mjs)',
    '[config](agentscli-skill.yml)',
    'Use two, discovered through its description.',
  ])
    assert.doesNotThrow(() =>
      contract.validateLinks(value, '.agents/skills/one/SKILL.md', options),
    );
  for (const value of [
    '[other](../two/SKILL.md)',
    '[other](../two/scripts/check.mjs)',
    '[rules](../../../docs/conventions/rules.md)',
    '```sh\nnode ../two/scripts/check.mjs\n```',
    '`../two/requires.yml`',
  ])
    assert.throws(
      () =>
        contract.validateLinks(value, '.agents/skills/one/SKILL.md', options),
      { code: 'resource-link' },
    );
});
test('resource normalization closes URL, casing, entity, source/output, and snapshot aliases', () => {
  const options = {
    kind: 'convention',
    conventions: [
      'conventions/a.tpl.md',
      'conventions/b.tpl.md',
      '.agentscli/conventions/a.md',
      '.agentscli/conventions/b.md',
    ],
    skillRoots: [
      'skills/review-code',
      '.agents/skills/review-code',
      '.agentscli/hub/skills/review-code',
    ],
    outputFile: '.agentscli/conventions/a.md',
  };
  for (const value of [
    '[other](b.tpl.md)',
    '[other](B.MD)',
    '[other](https://example.test/repo/conventions/b.tpl.md)',
    '[other](https://example.test/repo/.agents/skills/review-code/scripts/check.mjs)',
    '[other](skill://review-code)',
    '[other](../../.agentscli/hub/skills/review-code/requires.yml)',
    '<a href="..&#47;..&#47;.agents&#47;skills&#47;review-code">other</a>',
    '[other](../../.agents/%73kills/review-code)',
  ])
    assert.throws(
      () => contract.validateLinks(value, 'conventions/a.tpl.md', options),
      { code: 'resource-link' },
    );
  for (const value of [
    '[docs](https://example.test/docs/guide)',
    '[self](a.md#section)',
    '[self](a.tpl.md#section)',
    '[asset](../../images/chart.png)',
  ])
    assert.doesNotThrow(() =>
      contract.validateLinks(value, 'conventions/a.tpl.md', options),
    );
  const skillOptions = {
    ...options,
    kind: 'skill',
    ownRoot: '.agents/skills/one',
    outputFile: undefined,
    skillRoots: ['.agents/skills/one', '.agents/skills/two'],
  };
  for (const value of [
    '```sh\nnode ../../../.agentscli/hub/skills/two/scripts/check.mjs\n```',
    '[other](skill://two)',
    '<a href="..&sol;two&sol;requires.yml">other</a>',
  ])
    assert.throws(
      () =>
        contract.validateLinks(
          value,
          '.agents/skills/one/SKILL.md',
          skillOptions,
        ),
      { code: 'resource-link' },
    );
  assert.doesNotThrow(() =>
    contract.validateLinks(
      '[own](scripts/check.mjs)',
      '.agents/skills/one/SKILL.md',
      skillOptions,
    ),
  );
  assert.doesNotThrow(() =>
    contract.validateLinks(
      '<!-- <a href="../two/SKILL.md">Literal inactive example</a> -->',
      '.agents/skills/one/SKILL.md',
      skillOptions,
    ),
  );
  assert.doesNotThrow(() =>
    contract.validateLinks(
      '<a title=\'href="../two/SKILL.md"\' href="scripts/check.mjs">Own support</a>',
      '.agents/skills/one/SKILL.md',
      skillOptions,
    ),
  );
  assert.throws(
    () =>
      contract.validateLinks(
        '<a title=">" href="../two/requires.yml">Other</a>',
        '.agents/skills/one/SKILL.md',
        skillOptions,
      ),
    { code: 'resource-link' },
  );
});
test('complete resource trees preserve opaque support and reject aliases/collisions', () => {
  const root = path.resolve('unit-hub');
  const fs = memoryFs({
    [path.join(root, 'binary.dat')]: Buffer.from([0, 255, 1]),
    [path.join(root, 'safe/a.md')]: 'safe',
  });
  assert.deepEqual(
    contract.safeWalk(root, fs).get('binary.dat'),
    Buffer.from([0, 255, 1]),
  );
  fs.entries.get(path.join(root, 'binary.dat')).nlink = 2;
  assert.throws(() => contract.safeWalk(root, fs), { code: 'unsafe-path' });
  fs.entries.get(path.join(root, 'binary.dat')).nlink = 1;
  fs.addFile(path.join(root, 'safe/A.md'), 'collision');
  assert.throws(() => contract.safeWalk(root, fs), { code: 'collision' });
  for (const name of ['../x', 'a\\b', 'CON', 'a.', 'a//b', 'C:/x', 'x?'])
    assert.equal(contract.portablePath(name), false);
});
test('hub discovery only accepts shared roots and explicit same-hub dependencies', () => {
  const files = new Map([
    ['agentscli-hub.yml', Buffer.from('schemaVersion: 1\nversion: 1.0.0')],
    ['conventions/code-review.tpl.md', Buffer.from(convention())],
    [
      'skills/review-code/SKILL.md',
      Buffer.from(
        skill('review-code', 'metadata:\n  agentscli: agentscli-skill.yml\n'),
      ),
    ],
    [
      'skills/review-code/agentscli-skill.yml',
      Buffer.from('requires:\n  - id: inspect-code\n    source: hub\n'),
    ],
    ['skills/inspect-code/SKILL.md', Buffer.from(skill('inspect-code'))],
    ['skills/review-code/assets/opaque.bin', Buffer.from([0, 255])],
  ]);
  assert.equal(contract.validateHubFiles(files).skills.size, 2);
  files.set(
    'skills/agentscli-build-agents/SKILL.md',
    Buffer.from(skill('agentscli-build-agents')),
  );
  assert.throws(() => contract.validateHubFiles(files), {
    code: 'reserved-id',
  });
  files.delete('skills/agentscli-build-agents/SKILL.md');
  files.delete('conventions/code-review.tpl.md');
  assert.equal(contract.validateHubFiles(files).skills.size, 2);
  files.delete('skills/inspect-code/SKILL.md');
  assert.throws(() => contract.validateHubFiles(files), { code: 'dependency' });
});
test('nested convention directories are portable identities without imposing slug rules on directories', () => {
  const files = new Map([
    ['agentscli-hub.yml', Buffer.from('schemaVersion: 1\nversion: 1.0.0')],
    ['conventions/front_end/V2/code-review.tpl.md', Buffer.from(convention())],
    ['skills/review-code/SKILL.md', Buffer.from(skill('review-code'))],
  ]);
  assert.equal(
    contract
      .validateHubFiles(files)
      .conventions.has('hub:front_end/V2/code-review'),
    true,
  );
  assert.equal(contract.validId('front_end/V2/code-review'), true);
  assert.equal(contract.validId('front_end/V2/Bad_name'), false);
});
test('each independent hub skill owns the same enforced link and convention boundary', async () => {
  for (const name of contract.operationalNames) {
    const independent = await import(
      `../../assets/templates/skills/${name}/scripts/support.mjs`
    );
    assert.throws(
      () =>
        independent.parseConvention(
          '---\ntrigger: Read\nrequires: []\n---\n# Rules\n',
          'conventions/rules.tpl.md',
        ),
      { code: 'convention-requires' },
    );
    assert.throws(
      () =>
        independent.parseConvention(
          '---\nmetadata:\n  agentscli: agentscli-skill.yml\n---\n# Rules\n',
          'docs/conventions/rules.md',
          { shared: false },
        ),
      { code: 'convention-requires' },
    );
    assert.throws(
      () =>
        independent.validateLinks(
          '[other](https://example.test/repo/.agents/skills/other/requires.yml)',
          'conventions/rules.tpl.md',
          { kind: 'convention', skillRoots: ['.agents/skills/other'] },
        ),
      { code: 'resource-link' },
    );
    assert.throws(
      () =>
        independent.validateLinks(
          '[other](other.tpl.md)',
          'conventions/rules.tpl.md',
          {
            kind: 'convention',
            outputFile: '.agentscli/conventions/rules.md',
            conventions: ['conventions/other.tpl.md'],
          },
        ),
      { code: 'resource-link' },
    );
  }
});

test('all five independent checkers enforce general configuration ownership and skill-only closure', async () => {
  for (const name of contract.operationalNames) {
    const independent = await import(
      `../../assets/templates/skills/${name}/scripts/support.mjs`
    );
    const configFile = 'skills/review-code/agentscli-skill.yml';
    const entryFile = 'skills/review-code/SKILL.md';
    const files = new Map([
      ['agentscli-hub.yml', Buffer.from('schemaVersion: 1\nversion: 1.0.0')],
      [entryFile, Buffer.from(skill('review-code'))],
    ]);
    assert.equal(independent.validateHubFiles(files).skills.size, 1);
    files.set(configFile, Buffer.from('requires: []'));
    assert.throws(() => independent.validateHubFiles(files), {
      code: 'skill-config',
    });
    files.set(
      entryFile,
      Buffer.from(
        skill('review-code', 'metadata:\n  agentscli: agentscli-skill.yml\n'),
      ),
    );
    assert.equal(independent.validateHubFiles(files).skills.size, 1);
    files.delete(configFile);
    assert.throws(() => independent.validateHubFiles(files), {
      code: 'missing',
    });
    for (const empty of ['{}', 'requires: []']) {
      files.set(configFile, Buffer.from(empty));
      assert.equal(independent.validateHubFiles(files).skills.size, 1);
    }
    for (const invalid of [
      '',
      'null',
      'requires: null',
      'requires: []\nfuture: {}',
      'requires: []\nrequires: []',
      'requires: &items []\nfuture: *items',
      'requires: !!seq []',
      'conventions: []\nskills: []',
      'requires:\n  - id: inspect-code\n    source: local\n',
    ]) {
      files.set(configFile, Buffer.from(invalid));
      assert.throws(() => independent.validateHubFiles(files));
    }
    files.set(configFile, Buffer.from([255]));
    assert.throws(() => independent.validateHubFiles(files), {
      code: 'encoding',
    });
    files.set(
      configFile,
      Buffer.from('requires:\n  - id: inspect-code\n    source: hub\n'),
    );
    files.set(
      'conventions/inspect-code.tpl.md',
      Buffer.from(convention('# Inspect code\n\nKeep rules local.\n')),
    );
    assert.throws(() => independent.validateHubFiles(files), {
      code: 'dependency',
    });
    files.set(
      'skills/inspect-code/SKILL.md',
      Buffer.from(skill('inspect-code')),
    );
    assert.equal(independent.validateHubFiles(files).skills.size, 2);
    files.delete(configFile);
    files.set(entryFile, Buffer.from(skill('review-code')));
    for (const variant of ['Agentscli-skill.yml', 'Requires.yml']) {
      files.set(`skills/review-code/${variant}`, Buffer.from('requires: []'));
      assert.throws(() => independent.validateHubFiles(files), {
        code: 'skill-config',
      });
      files.delete(`skills/review-code/${variant}`);
    }
    files.set(
      entryFile,
      Buffer.from(
        skill('review-code', 'metadata:\n  agentscli: agentscli-skill.yml\n'),
      ),
    );
    files.set(
      configFile,
      Buffer.from('requires:\n  - id: inspect-code\n    source: hub\n'),
    );
    const supportFile = 'skills/review-code/references/details.md';
    files.set(
      supportFile,
      Buffer.from(
        '```markdown\n<!-- agentscli:requires {"skills": []} -->\n```\n',
      ),
    );
    assert.equal(independent.validateHubFiles(files).skills.size, 2);
    files.set(
      supportFile,
      Buffer.from('<!-- agentscli:requires {"skills": []} -->\n'),
    );
    assert.throws(() => independent.validateHubFiles(files), {
      code: 'requires-pointer',
      file: supportFile,
    });
    files.delete(supportFile);
    files.set(
      'skills/review-code/requires.yml',
      Buffer.from('conventions: []\nskills: []'),
    );
    assert.throws(() => independent.validateHubFiles(files), {
      code: 'skill-config',
    });
    files.delete('skills/review-code/requires.yml');
    files.set(
      entryFile,
      Buffer.from(
        skill('review-code', 'metadata:\n  requires: requires.yml\n'),
      ),
    );
    assert.throws(() => independent.validateHubFiles(files), {
      code: 'skill-config',
    });
  }
});
test('all five independent authoring environments reject legacy consumers and nested hubs', async () => {
  const root = path.resolve('unit-context');
  for (const name of contract.operationalNames) {
    const independent = await import(
      `../../assets/templates/skills/${name}/scripts/support.mjs`
    );
    const legacy = memoryFs({
      [path.join(root, 'agentscli-hub.yml')]:
        'schemaVersion: 1\nversion: 1.0.0',
      [path.join(root, 'agentscli-compose.yml')]: 'legacy: true',
    });
    assert.throws(() => independent.inspectHub(root, { fs: legacy }), {
      code: 'role',
    });
    const nested = memoryFs({
      [path.join(root, 'agentscli-hub.yml')]:
        'schemaVersion: 1\nversion: 1.0.0',
      [path.join(root, 'child/agentscli-hub.yml')]:
        'schemaVersion: 1\nversion: 1.0.0',
    });
    assert.throws(
      () => independent.inspectHub(path.join(root, 'child'), { fs: nested }),
      { code: 'role' },
    );
  }
});
