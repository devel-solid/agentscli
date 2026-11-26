---
trigger: Read when writing convention frontmatter, titles, filenames, or self-contained bodies.
reviewedHash: '50988ddfa89129e5a988e8aacd312c7f0e5d72b98260dad1423b2ca04b829655'
reviewPolicyVersion: '1'
---

# Convention format

Author final conventions directly in `.agentscli/conventions/**/*.md`, preserving the leading YAML `trigger`, H1, and body. Keep this repository's authored guidance in English; other projects choose their content's language.

- Conventions are self-contained rules. They cannot depend on, link to, or route procedures through other conventions or skills. Final conventions require a nonempty `trigger` in leading YAML frontmatter and one canonical H1 with a matching `.md` filename. The only optional frontmatter fields are `reviewedHash` (64 lowercase SHA-256 hexadecimal characters) and `reviewPolicyVersion` (a positive decimal string such as `'1'`). Either may be absent; trigger-only conventions remain valid. Unknown fields and invalid types or values are rejected.

For example, the title `Fixture independence` belongs in `fixture-independence.md` and its trigger identifies fixture-factory changes. The body contains the complete fixture agreement and its example. Replacing it with "see the clock convention" would lose self-containment. An example fence may show a second H1 as literal data; the final live document still has one canonical H1.

Review fields describe a past completed review and are not a validity prerequisite. Ordinary content edits preserve their existing values; refactoring review detects a stale receipt from the changed content or path. A numeric YAML `reviewPolicyVersion: 1` is invalid because the field is a string; use `reviewPolicyVersion: '1'`. Creating an otherwise valid convention with neither review field is correct and makes it pending for its first refactoring review.
