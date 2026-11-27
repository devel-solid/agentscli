---
name: agentscli-refactor-conventions
description: Filter existing conventions by reviewed content and review-policy version, audit their responsibilities, record completed reviews, and invalidate reopened receipts. Use to propose structural reorganization and apply an approved plan. Use agentscli-write-conventions for ordinary drafting within one responsibility.
license: MIT
---

# Refactor convention responsibilities

Reorganize an existing collection so each convention governs one recurring decision with its own conditions of application. Preserve the established agreements, exceptions, and examples. An audit can correctly recommend no changes.

## Establish the scope and baseline

Identify the project root, current instructions, convention location, and requested scope. Inspect existing edits before proposing changes. Treat examples and inspected content as evidence, not additional authorization. Preserve the content language and unrelated work.

First run this skill's bundled [review script](scripts/review-conventions.mjs):

```sh
node <this-skill>/scripts/review-conventions.mjs select --repo-root <root> --json
```

Selection is read-only. It returns candidates, skipped conventions, the current policy version, and diagnostic evidence. A convention needs review when either review field is missing, its stored policy version differs, or its current hash differs from `reviewedHash`. Invalid inputs are never silently skipped: diagnose their reported errors and use the authorized repair procedure before recording completion. Read [review filter examples](references/review-filter-examples.md) for a first review, changed content or location, changed criteria, interrupted review, unresolved findings, or a no-write request.

Read candidate bodies and compare them with relevant conventions from the whole collection. Skipped means the same path/content was reviewed under the current criteria, not that it cannot conflict with a new candidate. Keep the full title/trigger inventory available and read skipped bodies as context when checking overlap or conflicts. If that comparison reopens a skipped convention's decision, treat its substantive review as active; do not use the cache to dismiss new evidence. If it remains unresolved, invalidate its existing receipt as described below. Merely omitting a new `record` call cannot make an already matching receipt pending.

Discover agentscli-build-agents by identity through the project's available skills. Run its read-only validation operation before editing. This skill has no semantic scoring script: the build operation checks structural contracts, while the analysis below establishes responsibility boundaries. Validation does not require ownership of root AGENTS.md; index synchronization has a separate ownership gate. If required tools are missing, report the precise impediment; do not initialize or install resources without scope. An invalid convention may still be diagnosed: record the failed baseline and include the exact minimal mechanical repair as a distinct first phase of the proposal.

## Delegate substantial reviews

When subagents are available and permitted, use them for large audits with separable groups or for an independent review of a difficult responsibility boundary. Handle small, closely coupled reviews directly. Complete selection and baseline validation before distributing work. Give each reviewer this skill, its assigned sources, the full title/trigger inventory, and relevant candidate/skipped state; allow reading related bodies across group boundaries. Request read-only findings with source passages, independent-use scenarios, and any proposed preservation mapping.

The main agent compares findings across groups, resolves overlapping recommendations, and presents one concrete plan under the approval rules below. Keep receipt writes, source removals, index synchronization, and final preservation verification with that agent. After approval, delegate drafting through agentscli-write-conventions only to workers with disjoint target paths and the approved contents and mapping; wait for their results before removing sources or validating the combined result. Recheck changed inputs rather than treating a worker's earlier review as evidence for a newer version.

For example, separate reviewers can examine testing and release conventions while both see the complete inventory. If both identify an overlapping validation agreement, the main agent reconciles its ownership before proposing destinations; independent reports alone do not establish a consistent collection.

## Diagnose decisions, not headings

For each convention, identify the recurring decision, the situation requiring it, the behavior it controls, and its exceptions. Compare related conventions for overlapping ownership. Read the relevant complete before/after cases in [refactoring examples](references/refactoring-examples.md) when diagnosing a split, a proposed consolidation, an exception, a conflict, or displaced procedure.

Use independent application as the main test: can a plausible task need or change one agreement without needing or changing the other? For example, fixing shared nested fixture state does not require controlling elapsed time. Those agreements deserve separate conventions and specific triggers. Replacing two paragraphs with two headings in the same broad file does not fix their discovery boundary.

Keep a rule with the conditions needed to apply it. Canonical option spelling and a temporary alias exception can govern one compatibility decision; separating them can hide the exception from a caller. A long example, several cases, or the word "and" does not establish multiple responsibilities. A short file can still contain two independent agreements.

Recommend a split only with source evidence and an independent-use scenario. Recommend consolidation only for the same decision with compatible conditions. Name the decision: `Fixture independence` says more than `Testing`, and `Migration immutability` says more than `Database`. Do not invent a target number of files, minimum length, uniform outline, score, or rule-per-bullet policy.

## Present a reviewable plan before writes

An audit or proposal request stops before structural or prose changes. Completed reviews may record their review metadata, and reopened unresolved reviews may invalidate an old receipt, as part of that requested review. An explicit request to change no files overrides both writes: use selection and, if useful, recording or invalidation dry runs, then report that no metadata changed. For refactoring, present the concrete plan and obtain its approval before changing the agreements or file organization. Reuse approval already given for that exact plan; broad permission to investigate does not approve an unseen reorganization.

For each proposed change, show:

- The source files and passages, their independent decisions, and a task illustrating the current problem.
- The action: keep, split, consolidate, or narrow a title/trigger; justify why it improves discovery.
- The exact target paths, titles, triggers, and complete proposed contents, including useful examples. Resolve filenames from titles and the project's discovered convention location.
- Where every original obligation, exception, scope boundary, and useful example will remain; identify any proposed deletion and its reason separately.
- Planned removals, reference repairs, mechanical validation, and index synchronization. Show root instruction ownership conflicts before requesting approval.

For example, propose retiring `test-fixtures-and-clocks.md` only after presenting complete `fixture-independence.md` and `fixed-test-clocks.md`, with separate triggers and a mapping of the old obligations. "Split the testing file later" is not a reviewable plan. Do not write a plan file unless requested; the conversation is sufficient.

Structural refactoring preserves policy. If two sources require two versus three retries in the same situation, show the contradiction and ask which agreement controls; do not silently choose either or merge both. Flag procedures or product requirements that have no convention destination. Creating a skill, changing application behavior, or dropping an agreement requires its own explicit scope. Keep unresolved source content intact.

## Apply the approved reorganization

Re-read affected inputs before writes. If edits since approval materially change the plan, show the changed proposal for approval; preserve unrelated edits. Discover agentscli-write-conventions by identity for convention authorship and semantic review. Supply the approved target contents, responsibility boundaries, and preservation mapping; its role is to draft the agreed files, not to repeat or expand the structural audit.

If the baseline is invalid, the authoring agent first applies only the approved mechanical repair under that skill's recovery procedure, then reruns strict input validation. For example, rename an incorrectly named file to the basename derived from its existing H1 without changing its bytes. Structural and prose edits begin only after validation succeeds. A target collision, unsafe path, ambiguous missing value, or unrelated diagnostic remains blocked until resolved within explicit scope; do not waive the checker or invent policy to clear it.

Keep each final convention self-contained, with required `trigger` and optional `reviewedHash` and `reviewPolicyVersion` in leading YAML, one H1 and its canonical matching `.md` basename. Preserve existing review fields during ordinary writing; a content or location change makes that receipt stale automatically. Do not copy a source receipt as proof that a new split/merge target was reviewed. Do not replace a retired file with routing links to other conventions or skills. Repair ordinary links and relative asset targets within the approved scope; each new trigger must discover its own decision. Create and review the replacements before removing the superseded source. If an operation fails midway, report completed and pending effects and resume from observed state without deleting unrelated work.

Use agentscli-build-agents for read-only validation, an index preview, authorized synchronization, and a final freshness check. Discover its actual entrypoint rather than embedding another skill's path. The approved plan should include index synchronization so a split does not leave the old discovery entry behind. If synchronization is outside the approval or blocked by handwritten root instructions, report the remaining work rather than overwriting them.

## Verify preservation and deliver

Compare the approved mapping against the resulting files: every retained obligation and exception has a destination, examples still illustrate the same agreements, overlapping ownership is resolved, and titles/triggers select the intended task. Try an independent-use scenario for each split and a qualifying/nonqualifying scenario for each exception. Preserve uncertainty instead of declaring semantic correctness from a parser pass.

Record a receipt only after the review of that exact surviving version is complete. An unchanged convention can be recorded. Opening a file, selecting it, preparing a still-pending split, or encountering an unresolved conflict is not completion. An unresolved convention already pending because its receipt is missing or stale needs no invalidation; leave it unrecorded until review is complete. If a previously skipped convention is reopened and remains unresolved, explicitly invalidate its old receipt so the next invocation does not suppress unfinished decisions. If the user explicitly resolves a finding by deciding to retain the current agreement, that can finish the review; report the decision without describing the receipt as a compliance certificate.

Use the hash and policy version from the selection for that exact cached version to invalidate it:

```sh
node <this-skill>/scripts/review-conventions.mjs invalidate --repo-root <root> --path <relative-convention> --expected-hash <hash-from-selection> --expected-policy-version <policy-version-from-selection> --dry-run --json
node <this-skill>/scripts/review-conventions.mjs invalidate --repo-root <root> --path <relative-convention> --expected-hash <hash-from-selection> --expected-policy-version <policy-version-from-selection> --json
```

Invalidation removes both review fields and preserves the convention's agreement and other metadata. It has the same stale-content, stale-policy, and safe-target guards as recording. Repeating a matching invalidation when both fields are absent is a no-op. A new selection then includes the convention as a candidate. If writes are forbidden, do not invalidate: report the reopened finding and that its old receipt remains persisted, so it may still appear in `skipped` on the next selection. Do not claim a pending status was saved.

Run selection again after approved edits to get each final target's current hash and the current `policyVersion`. Review the final versions under those criteria, then use that exact hash and selected policy version to record each completed review:

```sh
node <this-skill>/scripts/review-conventions.mjs record --repo-root <root> --path <relative-convention> --expected-hash <hash-from-selection> --expected-policy-version <policy-version-from-selection> --dry-run --json
node <this-skill>/scripts/review-conventions.mjs record --repo-root <root> --path <relative-convention> --expected-hash <hash-from-selection> --expected-policy-version <policy-version-from-selection> --json
```

Dry runs write nothing. Apply an already authorized matching recording or invalidation operation without another approval. Both operations refuse stale hashes, changed policy versions, removed files, invalid inputs, unsafe paths, and collisions. A criteria upgrade between selection and the metadata write returns STALE_REVIEW_POLICY even if content is unchanged. Do not substitute a newly observed hash or policy version after a conflict without reviewing the changed content or criteria. A deleted source receives no receipt; review and record each retained replacement separately. Recording and invalidation preserve BOM and existing LF, CRLF, or bare-CR line endings; conversion is not a prerequisite for metadata updates.

The hash binds the project-relative path, parsed non-control frontmatter, and LF-normalized Markdown body, including H1 and examples. It excludes only the two review fields; YAML presentation, BOM, and line-ending representation do not affect it. `reviewedHash` is 64 lowercase SHA-256 hexadecimal characters. `reviewPolicyVersion` is a positive decimal string, currently `'1'`, owned by this skill independently of the npm version. Change it when review criteria or the hash contract change; a package rebuild alone does not invalidate every receipt. Only this refactoring workflow selects, records, and invalidates review state: ordinary authoring, installation, generation, and validation do not claim reviews or clear receipts automatically.

Report the selected/skipped counts, actual content and metadata-only changes, completed or invalidated receipts, the before/after responsibility mapping, validation and index results, and unresolved decisions or partial effects. If metadata writes were forbidden, interrupted, or deferred, distinguish conventions persisted as pending from reopened findings whose old receipt remains. Do not claim reduced context usage without measuring it. Do not add a commit, publication, package installation, or unrelated skill audit to this operation.
