import test from 'node:test';
import assert from 'node:assert/strict';
import { rebaseLinks } from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/migration-links.mjs';

const mapping = new Map([
  ['templates/AGENTS.tpl.md', '.agentscli/templates/AGENTS.tpl.md'],
  [
    'templates/testing/unit.tpl.md',
    '.agentscli/templates/conventions/testing/unit.tpl.md',
  ],
  [
    'templates/policy.details.tpl.md',
    '.agentscli/templates/conventions/policy.details.tpl.md',
  ],
  [
    'docs/conventions/testing/unit.md',
    '.agentscli/conventions/testing/unit.md',
  ],
  [
    'docs/conventions/policy.details.md',
    '.agentscli/conventions/policy.details.md',
  ],
]);
const main = (text) =>
  rebaseLinks(
    text,
    'templates/AGENTS.tpl.md',
    'AGENTS.md',
    'AGENTS.md',
    mapping,
    false,
  );
const body = (text) =>
  rebaseLinks(
    text,
    'templates/testing/unit.tpl.md',
    'docs/conventions/testing/unit.md',
    '.agentscli/conventions/testing/unit.md',
    mapping,
    true,
  );
const card = (text) =>
  `<!-- AGENT-CARD START -->\n${text}\n<!-- AGENT-CARD END -->\n`;

test('migration rebases Markdown inline links/images and retains source layout', () => {
  const source =
    '# Unit\r\n\r\n' +
    '[Policy](../policy.details.md?view=all#section "Keep this title")\r\n' +
    '![Image](../../../images/a%20b.png#original)\r\n' +
    '[Source](../../../templates/policy.details.tpl.md)\r\n';
  assert.equal(
    body(source),
    source.replace(
      '../../../templates/policy.details.tpl.md',
      '../../templates/conventions/policy.details.tpl.md',
    ),
  );
  const deeper = rebaseLinks(
    '[Root](../../../README.md)\n',
    'legacy/rule.tpl.md',
    'old/docs/nested/rule.md',
    '.agentscli/conventions/rule.md',
    mapping,
    true,
  );
  assert.equal(deeper, '[Root](../../README.md)\n');
});

test('migration maps main and card links using root output context', () => {
  assert.equal(
    main('[Unit](docs/conventions/testing/unit.md#case)\n'),
    '[Unit](.agentscli/conventions/testing/unit.md#case)\n',
  );
  assert.equal(
    body(card('[Unit](docs/conventions/testing/unit.md#case)')),
    card('[Unit](.agentscli/conventions/testing/unit.md#case)'),
  );
  assert.equal(
    body(card('[Read](README.md)') + '\n[Read](../../../README.md)\n'),
    card('[Read](README.md)') + '\n[Read](../../../README.md)\n',
  );
});

test('migration rebases full/collapsed/shortcut references and image definitions', () => {
  const source =
    '[policy][id]\n![Picture][image]\n[id][]\n[id]\n\n' +
    '[id]: <../policy.details.md?x=1#part>  "Description"\n' +
    '[image]: ../../../images/a.png\n';
  assert.equal(body(source), source);
  const changed = main(
    '[Policy][p]\n\n[p]: docs/conventions/policy.details.md#x "Title"\n',
  );
  assert.equal(
    changed,
    '[Policy][p]\n\n[p]: .agentscli/conventions/policy.details.md#x "Title"\n',
  );
  assert.equal(
    rebaseLinks(
      '![Pic][i]\n\n[i]: <../../../images/a%20b.png?x=1&amp;y=2#part>  "Title"\n',
      'old/source.tpl.md',
      'old/docs/nested/source.md',
      '.agentscli/conventions/source.md',
      mapping,
      true,
    ),
    '![Pic][i]\n\n[i]: <../../images/a%20b.png?x=1&amp;y=2#part>  "Title"\n',
  );
});

test('migration encodes URL paths while preserving nested labels and titles', () => {
  const links = new Map([
    ['docs/conventions/a(b).md', '.agentscli/conventions/new name.md'],
  ]);
  const rewrite = (text) =>
    rebaseLinks(
      text,
      'source.tpl.md',
      'docs/conventions/rule.md',
      '.agentscli/conventions/rule.md',
      links,
      false,
    );
  assert.equal(
    rewrite('[Label with `]` and **text**](<a(b).md?q=1#p> "unchanged")\n'),
    '[Label with `]` and **text**](<new%20name.md?q=1#p> "unchanged")\n',
  );
  assert.equal(
    rewrite('![nested [label]](a\\(b\\).md)\n'),
    '![nested [label]](new%20name.md)\n',
  );
  assert.equal(
    main('[Portable](Docs/Conventions/Policy.Details.md)\n'),
    '[Portable](.agentscli/conventions/policy.details.md)\n',
  );
});

test('migration leaves external URLs, anchors and literal examples byte-identical', () => {
  const source =
    '[Web](https://example.test/docs/conventions/policy.details.md)\n' +
    '[CDN](//cdn.example.test/a) [Email](mailto:a@example.test) [Part](#part) [?](?mode=1)\n' +
    '`[Literal](../../../../outside.md)`\n\n' +
    '```md\n[Literal](../../../../outside.md)\n```\n\n' +
    '> [Example](../../../../outside.md)\n' +
    '<!-- example href="../../../../outside.md" -->\n';
  assert.equal(body(source), source);
});

test('migration rejects escaping or ambiguous local destinations with source locations', () => {
  for (const destination of [
    '../../../../outside.md',
    '/absolute.md',
    'bad%zz.md',
    '%2fetc',
    '%5coutside',
    '%252e%252e/outside.md',
    'bad%FF.md',
    '..%5Coutside.md',
  ]) {
    assert.throws(
      () => body(`\n[Bad](${destination})\n`),
      (error) => {
        assert.equal(error.code, 'MIGRATION_LINK');
        assert.equal(error.path, 'templates/testing/unit.tpl.md');
        assert.match(error.message, /templates\/testing\/unit.tpl.md:2:1:/u);
        return true;
      },
    );
  }
});

test('migration rejects shared definitions needing different card/body destinations', () => {
  const source =
    card('[Card][shared]') +
    '\n[Body][shared]\n\n' +
    '[shared]: docs/conventions/testing/unit.md\n';
  assert.throws(() => body(source), /incompatible card\/body URLs/u);
  // Root and body can safely share destinations whose final URL stays identical.
  const external =
    card('[Card][shared]') +
    '\n[Body][shared]\n\n[shared]: https://example.test/a\n';
  assert.equal(body(external), external);
});

test('migration rejects affected local HTML while preserving unaffected HTML', () => {
  assert.throws(
    () => main('<a href="docs/conventions/testing/unit.md">Unit</a>\n'),
    /HTML href\/src/u,
  );
  assert.throws(
    () => body('<img src="../../../images/a.png">\n'),
    /HTML href\/src/u,
  );
  assert.equal(
    main('<a href="README.md">Read</a>\n'),
    '<a href="README.md">Read</a>\n',
  );
  assert.equal(
    body('<a href="https://example.test/a">Web</a>\n'),
    '<a href="https://example.test/a">Web</a>\n',
  );
  assert.equal(
    body('<a data-href="docs/conventions/testing/unit.md">Data</a>\n'),
    '<a data-href="docs/conventions/testing/unit.md">Data</a>\n',
  );
});

test('HTML preflight respects quoted tag boundaries and decodes attribute references', () => {
  for (const input of [
    '<a title=">" href="docs/conventions/testing/unit.md">Unit</a>\n',
    "<a title='>' href='docs/conventions/testing/unit.md'>Unit</a>\n",
    '<a href="docs&#47;conventions&#47;testing&#47;unit.md">Unit</a>\n',
    '<a href="docs&#x2f;conventions&sol;testing/unit.md">Unit</a>\n',
    '<a title=">" HREF="docs/conventions/testing/unit.md">Unit</a>\n',
  ]) {
    assert.throws(
      () => main(input),
      (error) => {
        assert.equal(error.code, 'MIGRATION_LINK');
        assert.match(
          error.message,
          /templates\/AGENTS.tpl.md:1:1:.*HTML href\/src/u,
        );
        return true;
      },
    );
  }
  for (const input of [
    '<a title=\' href="docs/conventions/testing/unit.md" >\' href="README.md">Read</a>\n',
    '<a title=">" href="README.md?x=1&y=2">Read</a>\n',
    '<a title=">" href="README.md?x=1&copy=2">Read</a>\n',
    '<a href="https://example.test/?x=1&copy=2">Web</a>\n',
    '<a href="READM&#69;.md">Read</a>\n',
  ])
    assert.equal(main(input), input);
});

test('URL suffixes distinguish numeric path references from queries and fragments', () => {
  for (const separator of ['&#47;', '&#x2f;', '&sol;']) {
    const target = `docs${separator}conventions${separator}testing${separator}unit.md`;
    const suffix = '?mode=1&amp;other=2#part';
    assert.equal(
      main(`[Unit](${target}${suffix})\r\n`),
      `[Unit](.agentscli/conventions/testing/unit.md${suffix})\r\n`,
    );
    assert.equal(
      main(`![Unit][u]\n\n[u]: <${target}${suffix}> "Keep"\n`),
      `![Unit][u]\n\n[u]: <.agentscli/conventions/testing/unit.md${suffix}> "Keep"\n`,
    );
    assert.equal(
      main(`[Unit](${target})\n`),
      '[Unit](.agentscli/conventions/testing/unit.md)\n',
    );
  }
  for (const suffix of [
    '&#63;mode=1&amp;x=2&#35;part',
    '&#35;part',
    '\\?mode=1\\#part',
    '&quest;mode=1&num;part',
  ]) {
    assert.equal(
      main(`[Unit](docs/conventions/testing/unit.md${suffix})\n`),
      `[Unit](.agentscli/conventions/testing/unit.md${suffix})\n`,
    );
  }
});
