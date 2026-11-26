---
trigger: Read when selecting, recording, or invalidating convention review state.
reviewedHash: 'c2bc11a79c6935831740dfed8baf62902b7a996fd091c167c0599c265906b544'
reviewPolicyVersion: '1'
---

# Review receipts

Refactoring review uses `reviewedHash` and `reviewPolicyVersion` to avoid repeating a completed review of the same convention under the same criteria. Selection is read-only and is invoked only by the refactoring skill. A missing field, changed hash, or changed current policy version makes the convention pending. Invalid input is never evidence that a convention can be skipped.

The SHA-256 hash binds the project-relative path, parsed non-control frontmatter, and LF-normalized body, including H1 and examples. Exclude the two review fields. YAML presentation, UTF-8 BOM, and line-ending representation do not invalidate the hash; content, trigger, example, or location changes do. Keep the current positive decimal policy string with the refactoring skill, independently of the npm version, and advance it when criteria or the hash contract change.

For example, let H1 and H2 denote different actual SHA-256 digests in this table, not literal field values:

| Current convention    | Stored receipt       | Result                                 |
| --------------------- | -------------------- | -------------------------------------- |
| Hash H1, policy `'1'` | H1 and `'1'`         | May skip a repeated standalone review. |
| Hash H2, policy `'1'` | H1 and `'1'`         | Review the changed convention.         |
| Hash H1, policy `'2'` | H1 and `'1'`         | Review under the new criteria.         |
| Hash H1, policy `'1'` | Either field missing | Review before recording completion.    |

Record only an actually completed review of the exact surviving version under the exact selected criteria. An unchanged convention may receive a receipt; selection, opening, parsing, interrupted review, a pending structural proposal, or an unresolved policy conflict does not justify one. A final user decision to retain the current agreement may complete review, but the receipt is not a certificate of correctness. A stale expected hash or changed expected policy version blocks recording until the changed content or criteria are reviewed. Do not replace either expectation blindly after a conflict.

For an approved split, the retired source receives no receipt. Each final retained target is reviewed and recorded for its own path and current content. Do not copy the source receipt or mark a still-pending split as complete: doing so could suppress the unfinished decision on the next invocation.

Skipped conventions remain available as context. A new Token logging candidate can duplicate a previously reviewed Diagnostic credentials agreement. Compare relevant bodies instead of treating the cached receipt as proof that no new overlap exists.

When new context reopens a convention with a matching receipt and its review remains unresolved, invalidate that receipt by removing both control fields. Merely refraining from recording cannot clear an existing receipt. Bind invalidation to the selected content hash and policy version, preserve the agreement and unrelated metadata, and reject changed or unsafe targets. Repeating a matching invalidation with both fields already absent is a no-op. The next selection must include that convention as pending.

For example, Job retries has a current receipt and requires three attempts. A new Worker retries convention requires two for the same jobs. If the decision remains open, invalidate the earlier Job retries receipt as well as leaving the new convention unrecorded; otherwise the earlier file would still be mechanically skipped. No content rule changes until the user resolves the conflict.

An ordinary review request permits its completed metadata-only recording and necessary invalidation of a reopened receipt without repeated approval. Explicit instructions to write no files prohibit both writes. Report findings and distinguish an unrecorded candidate from a reopened file whose old receipt remains and can still be skipped; do not claim invalidation was persisted. Authorship, installation, index generation, and ordinary validation never auto-select, stamp, or invalidate reviews.
