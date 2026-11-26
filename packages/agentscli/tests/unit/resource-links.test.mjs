import assert from 'node:assert/strict';
import test from 'node:test';
import { validateResources } from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/content.mjs';

const bytes = (text) => new TextEncoder().encode(text);
function sample(body, support = {}, root = '.agents/skills/sample') {
  return {
    id: 'sample',
    source: 'local',
    path: root,
    files: {
      'SKILL.md': bytes(
        '---\nname: sample\ndescription: Review a sample.\n---\n# Sample\n\n' +
          body,
      ),
      ...support,
    },
  };
}
const validate = (skill) => validateResources({ skills: [skill] });

test('literal negative paths remain data while executable workflow examples reject foreign paths', () => {
  const foreign = '.agents/skills/other/scripts/check.mjs';
  for (const body of [
    `The example path is ${foreign}; it is not a command.`,
    `Do not use \`${foreign}\`.`,
    `\`\`\`text\nnode ${foreign}\n\`\`\``,
    `\`\`\`markdown\n[Invalid](../other/SKILL.md)\n\`\`\``,
    `> \`\`\`text\n> node ${foreign}\n> \`\`\``,
  ])
    assert.doesNotThrow(() => validate(sample(body)), body);
  for (const body of [
    `node ${foreign}`,
    `> node ${foreign}`,
    `Run \`node ${foreign}\` before writing.`,
    `\`\`\`sh\nnode ${foreign}\n\`\`\``,
    `\`\`\`console\n$ node ${foreign}\n\`\`\``,
    `\`\`\`powershell\nnode .AGENTS/SKILLS/OTHER/scripts/check.mjs\n\`\`\``,
    `\`\`\`javascript\nspawn('node', ['${foreign}']);\n\`\`\``,
  ])
    assert.throws(
      () => validate(sample(body)),
      (error) => error.code === 'RESOURCE_PATH',
      body,
    );
});

test('quoted links, references, images and HTML remain active across resource boundaries', () => {
  for (const body of [
    '> Follow [Other](../other/SKILL.md).',
    '> Follow [Other][ref].\n\n[ref]: ../other/SKILL.md',
    '> ![Other](../other/references/diagram.svg)',
    '> <a href="../other/SKILL.md">Other</a>',
    '> > Follow [Other](../other/SKILL.md).',
  ])
    assert.throws(
      () => validate(sample(body)),
      (error) => error.code === 'RESOURCE_LINK',
      body,
    );
  for (const body of [
    '> [Other](other.md)',
    '> > [Other](other.md)',
    '> <img src="other.md">',
  ]) {
    assert.throws(
      () =>
        validateResources({
          conventions: [
            {
              path: '.agentscli/conventions/testing.md',
              text:
                '---\ntrigger: Read when testing.\n---\n# Testing\n\n' + body,
            },
            {
              path: '.agentscli/conventions/other.md',
              text: '---\ntrigger: Read when reviewing.\n---\n# Other\n',
            },
          ],
        }),
      (error) => error.code === 'RESOURCE_LINK',
    );
  }
});

test('bundled support links resolve from each file and survive complete skill movement', () => {
  const support = {
    'references/index.md': bytes(
      '> [Before](cases/before%20file.md?raw=1#example)\n\n![Diagram](../assets/diagram.svg)\n',
    ),
    'references/cases/before file.md': bytes('# Example\n'),
    'assets/diagram.svg': bytes('<svg/>'),
  };
  const body =
    '[Index](references/index.md) [Directory](references/) [Root](.) [Self](#sample)';
  assert.doesNotThrow(() => validate(sample(body, support)));
  assert.doesNotThrow(() =>
    validate(sample(body, support, 'moved/resources/sample')),
  );
  for (const missing of Object.keys(support)) {
    const incomplete = { ...support };
    delete incomplete[missing];
    assert.throws(
      () => validate(sample(body, incomplete)),
      (error) => error.code === 'RESOURCE_SUPPORT',
      missing,
    );
  }
  for (const link of [
    '[Missing](references/missing.md)',
    '[Wrong case](references/Index.md)',
    '[Missing](/.agents/skills/sample/references/missing.md)',
    '[Wrong case](/.AGENTS/skills/sample/references/index.md)',
    '> [Missing](references/missing.md)',
    '> <img src="assets/missing.svg">',
    '[Missing][ref]\n\n[ref]: references/missing.md',
  ])
    assert.throws(
      () => validate(sample(link, support)),
      (error) => error.code === 'RESOURCE_SUPPORT',
      link,
    );
  assert.doesNotThrow(() =>
    validate(sample('```markdown\n[Missing](references/missing.md)\n```')),
  );
});

test('encoded filename delimiters are distinct from real query and fragment boundaries', () => {
  const support = {
    'references/notes#1.md': bytes('# Notes\n'),
    'references/notes.md': bytes('# Ordinary notes\n'),
  };
  for (const link of [
    'references/notes%231.md',
    'references/notes%231.md#details',
    'references/notes%231.md?raw=1#details',
    'references/notes.md#details',
    'references/notes.md?raw=1#details',
  ])
    assert.doesNotThrow(
      () => validate(sample(`[Support](${link})`, support)),
      link,
    );
  for (const link of [
    'references/notes%231.md',
    'references/notes%231.md#details',
  ])
    assert.throws(
      () =>
        validate(
          sample(`[Support](${link})`, {
            'references/notes': bytes('Wrong prefix file\n'),
          }),
        ),
      (error) => error.code === 'RESOURCE_SUPPORT',
      link,
    );
  assert.throws(
    () =>
      validate(
        sample('[Missing](references/notes#1.md)', {
          'references/notes#1.md': bytes('# Notes\n'),
        }),
      ),
    (error) => error.code === 'RESOURCE_SUPPORT',
  );
  for (const link of [
    'references/notes%GG.md',
    'references/notes%25231.md',
    'references/notes.md#bad%GG',
  ])
    assert.throws(
      () => validate(sample(`[Support](${link})`, support)),
      (error) => error.code === 'RESOURCE_LINK',
      link,
    );
  assert.throws(
    () => validate(sample('[Other](../other/SKILL.md%23example#details)')),
    (error) => error.code === 'RESOURCE_LINK',
  );
  assert.doesNotThrow(() =>
    validate(sample('[Web](https://example.org/guide%23one?raw=1#details)')),
  );
});

test('directory references require an actual bundled directory rather than a same-named file', () => {
  const support = { 'references/note.md': bytes('# Note\n') };
  for (const link of ['references/', 'references/?raw=1#details', './'])
    assert.doesNotThrow(
      () => validate(sample(`[Support](${link})`, support)),
      link,
    );
  for (const link of [
    'references/note.md/',
    'references/note.md/?raw=1#details',
    'references/note.md%2F',
    'references/note.md/.',
  ])
    assert.throws(
      () => validate(sample(`[Support](${link})`, support)),
      (error) => error.code === 'RESOURCE_SUPPORT',
      link,
    );
});

test('active file URI links are rejected while literal examples remain teaching data', () => {
  for (const link of [
    'file:///.agents/skills/sample/references/missing.md',
    'file:///.agents/skills/sample/references/note.md',
    'FiLe:///C:/private/guide.md',
    'f%69le%3A%2F%2F%2FC%3A%2Fprivate%2Fguide.md',
    'file%3A///C:/private/guide.md',
  ])
    assert.throws(
      () =>
        validate(
          sample(`[Support](${link})`, {
            'references/note.md': bytes('# Note\n'),
          }),
        ),
      (error) =>
        error.code === 'RESOURCE_LINK' && /File URI/.test(error.message),
      link,
    );
  assert.throws(
    () =>
      validate(
        sample('<a href="f&#105;le:///C:/private/guide.md">Private</a>'),
      ),
    (error) => error.code === 'RESOURCE_LINK' && /File URI/.test(error.message),
  );
  for (const link of ['file:///bad%GG', 'f%2569le:///C:/private/guide.md'])
    assert.throws(
      () => validate(sample(`[Support](${link})`)),
      (error) => error.code === 'RESOURCE_LINK',
      link,
    );
  assert.doesNotThrow(() =>
    validate(
      sample('```markdown\n[Invalid](file:///C:/private/guide.md)\n```'),
    ),
  );
  assert.doesNotThrow(() =>
    validate(
      sample(
        'The example URI is `file:///C:/private/guide.md`; it is literal data.',
      ),
    ),
  );
  assert.doesNotThrow(() =>
    validate(sample('[Web](https://example.org/guide)')),
  );
});
