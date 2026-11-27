# Review filter examples

These fictional cases teach review selection and completion. They are not conventions to install. The complete worked example uses project-relative path `.agentscli/conventions/fixture-independence.md` and exactly the displayed document with one final LF after the last sentence. Its displayed digest was computed for those inputs. Actual recording always uses the hash returned for the exact final path and content by `select`; a teaching example's receipt must not be copied to other content or locations.

## First review: absent metadata is pending

Before, the fictional `fixture-independence.md` contains:

```markdown
---
trigger: Read when creating or changing reusable fixture factories.
---

# Fixture independence

Each factory call returns fresh mutable objects, including nested collections.
Adding a checkpoint to the first of two parcels leaves the second parcel's
checkpoints empty. Reusing one array fails this agreement even if cleanup clears
it after each test.
```

It is a valid convention with no recorded review. `select` includes it in `candidates` with its current `hash`; merely returning that hash does not change the file. The agent reads it, compares relevant neighboring agreements, and concludes that its responsibility and examples need no change.

After that completed review, `record` writes only the receipt. The complete after-document is:

```markdown
---
trigger: Read when creating or changing reusable fixture factories.
reviewedHash: 'd9f4978fe8a71c43e8f8f8a0be74fd24cca3130f207febc8f5765d7295ba9b6a'
reviewPolicyVersion: '1'
---

# Fixture independence

Each factory call returns fresh mutable objects, including nested collections.
Adding a checkpoint to the first of two parcels leaves the second parcel's
checkpoints empty. Reusing one array fails this agreement even if cleanup clears
it after each test.
```

The before and after documents have the same content/path hash because the two control fields are excluded. With the matching current policy, this exact after-document moves to `skipped` on the next invocation. A missing hash or missing policy version remains pending even if the other field is present. A malformed hash or numeric YAML policy value is invalid input, not permission to skip.

## Changes invalidate the receipt

Assume a real receipt matches the current path, trigger, and body under policy `'1'`.

| Subsequent change                                             | Selection result | Why                                                     |
| ------------------------------------------------------------- | ---------------- | ------------------------------------------------------- |
| Add a new exception to the body                               | Candidate        | The reviewed agreement changed.                         |
| Narrow the trigger or change the H1                           | Candidate        | Discovery or identity changed.                          |
| Replace or edit an example                                    | Candidate        | The evidence supporting the decision changed.           |
| Copy the same file to another project-relative path           | Candidate        | The receipt is bound to the original path.              |
| Reformat only YAML quoting without changing its parsed values | Skipped          | Presentation is not the agreement.                      |
| Convert LF to CRLF or add/remove a UTF-8 BOM                  | Skipped          | The hash normalizes those representations.              |
| Convert line endings to bare CR without changing the text     | Skipped          | CR-only representation is normalized too.               |
| Rewrite only the two review fields with the same values       | Skipped          | Control fields are excluded from the hash.              |
| Rebuild npm package assets with unchanged review criteria     | Skipped          | Package provenance is not the review policy version.    |
| Change the current review policy to `'2'`                     | Candidate        | The previous review did not cover the current criteria. |

Body whitespace is still content: reformatting Markdown can change the hash. Do not refresh a receipt merely to silence that difference. Review the final body, then record its current hash.

## Recording after an approved change

Before, a selected convention mixes fixture independence with fixed clocks. The agent proposes complete replacements and waits for approval before changing their content or organization. The source remains pending while that proposal is unresolved; recording it now would make the next invocation ignore unfinished work.

After approval, the agent writes and verifies `fixture-independence.md` and `fixed-test-clocks.md`, repairs the discovery entries, and removes the retired source. It runs `select` again, reviews each exact final replacement, and records each final hash separately:

```sh
node <this-skill>/scripts/review-conventions.mjs select --repo-root <root> --json
node <this-skill>/scripts/review-conventions.mjs record --repo-root <root> --path <first-final-path> --expected-hash <first-final-hash> --expected-policy-version <policy-version-from-selection> --json
node <this-skill>/scripts/review-conventions.mjs record --repo-root <root> --path <second-final-path> --expected-hash <second-final-hash> --expected-policy-version <policy-version-from-selection> --json
```

The final hashes come from `candidates[].hash` or `skipped[].hash` for the corresponding final path. The expected policy version comes from the selection result's `policyVersion`. The original source hash cannot authorize recording changed targets. A concurrent edit causes a stale-hash error; a criteria upgrade causes STALE_REVIEW_POLICY. Review the changed content or criteria before selecting and recording again. Never blindly retry with a newer hash or policy version.

## An incomplete review must stay pending

The agent opens a candidate, then is interrupted before checking its exceptions. It does not call `record`. Opening, selecting, parsing, or passing structural validation proves no completed semantic review.

Likewise, a contradiction between two versus three retries remains unresolved while the user decides which agreement controls. Keep the affected conventions pending. If the user explicitly resolves the issue by retaining an existing agreement, its review can then be completed and recorded; report that decision rather than claiming the receipt proves the convention is objectively correct.

Recording is metadata-only, but can still suppress future review. That is why it follows actual completion, including when the decision is to keep the convention unchanged.

## A skipped convention can still be relevant

An existing `Token logging` convention has a current receipt. A newly added `Diagnostic credentials` candidate repeats its rule. If the agent reads only candidate bodies and ignores the collection inventory, it can miss the duplicate.

Keep the full title/trigger inventory available, read the skipped token convention as relevant context, and propose a consolidation if appropriate. A receipt certifies only that a particular path/content was reviewed under particular criteria; it does not prove compatibility with every future addition. If the comparison reopens the earlier decision, substantively review that convention too.

## Reopen an existing receipt explicitly

This worked example uses project-relative path `.agentscli/conventions/job-retries.md` and one final LF. Before, the convention has a valid current receipt:

```markdown
---
trigger: Read when defining retry limits.
reviewedHash: 'd5d7743cf3a396132c22ca3e931b1a829c1a861bdc8dd9eb46c75cf5a8ee40fc'
reviewPolicyVersion: '1'
---

# Job retries

Retry transient failures up to three total attempts.
```

A new `worker-retries.md` is pending:

```markdown
---
trigger: Read when defining worker retry limits.
---

# Worker retries

Retry the same jobs up to two total attempts.
```

The first selection returns Job retries in `skipped` and Worker retries in `candidates`. The agent compares them and discovers a conflict that requires a user decision. Merely avoiding `record` leaves the already valid Job retries receipt untouched; the next selection would still skip that file.

Invalidate the earlier receipt using its `skipped[].hash` and the selection's `policyVersion`:

```sh
node <this-skill>/scripts/review-conventions.mjs invalidate --repo-root <root> --path <cached-relative-convention> --expected-hash <cached-hash-from-selection> --expected-policy-version <policy-version-from-selection> --dry-run --json
node <this-skill>/scripts/review-conventions.mjs invalidate --repo-root <root> --path <cached-relative-convention> --expected-hash <cached-hash-from-selection> --expected-policy-version <policy-version-from-selection> --json
node <this-skill>/scripts/review-conventions.mjs select --repo-root <root> --json
```

After invalidation, the complete Job retries document is:

```markdown
---
trigger: Read when defining retry limits.
---

# Job retries

Retry transient failures up to three total attempts.
```

The rule is unchanged, both review fields are gone, and the next selection includes both conventions as candidates. Invalidation does not decide between two and three attempts. The usual review request permits this metadata-only invalidation without an extra per-file approval. If the user forbids writes, use only a dry run and report that the old receipt remains; do not claim the file was made persistently pending.

Invalidation rejects stale content or criteria and unsafe targets just like recording. If both fields are already absent, a repeated invalidation with matching expectations is a no-op. It cannot authorize the next record: after resolution, review the exact final content under the current criteria before recording a completed review again.

## Respect a request to write no files

For "audit our conventions without changing files," run read-only selection and report findings. Even a completed no-change review receives no persisted receipt in this mode. Neither recording nor invalidation may write. Metadata previews can show pending effects without applying them:

```sh
node <this-skill>/scripts/review-conventions.mjs record --repo-root <root> --path <relative-convention> --expected-hash <hash-from-selection> --expected-policy-version <policy-version-from-selection> --dry-run --json
node <this-skill>/scripts/review-conventions.mjs invalidate --repo-root <root> --path <relative-convention> --expected-hash <hash-from-selection> --expected-policy-version <policy-version-from-selection> --dry-run --json
```

An unrecorded candidate can be selected again. A reopened file with a pre-existing valid receipt may still appear in `skipped`, because invalidation was forbidden; report that precise limitation. For an ordinary review request that permits its normal metadata writes, record completed reviews or invalidate reopened unresolved receipts without requesting another approval for each file. Structural changes still wait for the concrete proposal's approval.

Recording and invalidation preserve existing BOM and line endings, including bare CR. Do not convert an authored convention to LF merely to update review metadata; the hash already normalizes line-ending representation.

## Change the criteria deliberately

The initial policy version is the positive decimal string `'1'`, maintained with this skill. If the review gains a new responsibility criterion or the hash contract changes, advance the policy version, for example to `'2'`. Otherwise unchanged conventions become candidates because their old receipts describe different criteria.

Do not advance it solely because the npm package version or generated skill stamps changed. Conversely, do not stamp old conventions with the new policy merely by upgrading the package: that would claim reviews that never occurred.
