import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync, readFileSync } from 'node:fs';
import { validateResources } from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/content.mjs';
import { render } from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/render.mjs';
import {
  frontmatter,
  parseMarkdown,
} from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/markdown.mjs';
import {
  reviewHash,
  REVIEW_POLICY_VERSION,
} from '../../assets/templates/skills/agentscli-optimize-conventions/scripts/review-conventions.mjs';

const cases = new URL(
  '../../assets/templates/skills/agentscli-write-conventions/references/cases/',
  import.meta.url,
);

test('complete corrected teaching conventions have valid independent discovery entries', () => {
  for (const entry of readdirSync(cases, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const directory = new URL(`${entry.name}/corrected/`, cases);
    const conventions = readdirSync(directory)
      .filter((name) => name.endsWith('.md'))
      .map((name) => ({
        path: `.agentscli/conventions/${name}`,
        text: readFileSync(new URL(name, directory), 'utf8'),
      }));
    assert.ok(conventions.length, entry.name);
    assert.doesNotThrow(() => validateResources({ conventions }), entry.name);
    const index = render(conventions).get('AGENTS.md');
    for (const convention of conventions)
      assert.ok(
        index.includes(`](${convention.path})`),
        `${entry.name}: ${convention.path}`,
      );
    // These fixtures establish structural validity, not semantic responsibility.
    // The authored analyses explain why a particular decision stays or splits.
  }
});

test('the complete before/after review example carries the real matching fingerprint', () => {
  const text = readFileSync(
    new URL(
      '../../assets/templates/skills/agentscli-optimize-conventions/references/review-filter-examples.md',
      import.meta.url,
    ),
    'utf8',
  );
  const examples = parseMarkdown(text).children.filter(
    (node) => node.type === 'code' && node.lang === 'markdown',
  );
  const path = '.agentscli/conventions/fixture-independence.md';
  const before = examples[0].value + '\n';
  const after = examples[1].value + '\n';
  const receipt = frontmatter(after, path).fields;
  assert.equal(reviewHash(before, path), reviewHash(after, path));
  assert.equal(receipt.reviewedHash, reviewHash(after, path));
  assert.equal(receipt.reviewPolicyVersion, REVIEW_POLICY_VERSION);
});
