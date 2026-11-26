# Refactoring examples

These fictional agreements teach structural decisions. They are not client defaults to install. Choose a case by the problem being diagnosed; transfer the reasoning to verified project agreements. Paths below are basenames relative to the project's discovered convention location.

## Split independent decisions

The fictional team requires fresh nested fixture state and per-test clocks for elapsed-time tests. Before, `testing.md` mixes them:

```markdown
---
trigger: Read when creating fixtures or testing elapsed time.
---

# Testing

Each fixture factory returns fresh mutable state, including nested collections.
Elapsed-time tests supply a fixed clock to the unit under test, without replacing global time.
```

A fixture mutation leak and a flaky expiry calculation can be fixed independently. Two sections under `Testing` would still make both tasks load both agreements. The proposed replacement is two complete files.

After, `fixture-independence.md`:

```markdown
---
trigger: Read when creating or changing reusable test fixture factories.
---

# Fixture independence

Each factory call returns fresh mutable objects, including nested collections.
If two parcels start with empty `checkpoints`, adding a checkpoint to the first
leaves the second empty. Copying the outer object while reusing its array fails
this agreement; clearing a shared array after the test does not repair it.
```

After, `fixed-test-clocks.md`:

```markdown
---
trigger: Read when testing behavior that depends on elapsed time.
---

# Fixed test clocks

Supply a fixed clock per test to the unit whose result depends on elapsed time.
Do not replace global time. An expiry test can supply a clock returning 5000;
a label-formatting test whose result is independent of time needs no clock.
```

Preservation map: fresh outer and nested objects stay in `fixture-independence.md`; fixed clocks, per-test scope, and the global-time restriction stay in `fixed-test-clocks.md`. The old file is removed after approval and replacement verification. The index gains two precise entries and loses the broad one. The examples explain how to distinguish compliant behavior, rather than merely repeating "keep tests deterministic."

## Keep a rule with its exception

The fictional compatibility agreement chooses canonical public option spellings but preserves supported callers for a bounded period. Before, `public-option-aliases.md`:

```markdown
---
trigger: Read when renaming or adding aliases for public command options.
---

# Public option aliases

Use one canonical spelling in documentation and newly changed callers.
Retain an old spelling only if it shipped in a supported release and a maintained
caller still uses it. Remove that alias in the next major version.
```

An inadequate split puts the first sentence in `canonical-options.md` and the remaining sentences in `legacy-options.md`. A rename task reading only the first file can remove an alias still required by the second.

After: keep the same file and add decision examples where useful:

```markdown
---
trigger: Read when renaming or adding aliases for public command options.
---

# Public option aliases

Use one canonical spelling in documentation and newly changed callers.
Retain an old spelling only if it shipped in a supported release and a maintained
caller still uses it. Remove that alias in the next major version.

If version 2.6 replaces `--destination` with `--output-dir` and supported 2.5
callers still use the old spelling, keep it through version 2 and remove it in 3.
An unpublished prototype's `--dest` does not qualify. New documentation uses
`--output-dir` in both situations.
```

The exception controls the same decision as the rule. A keep recommendation is successful auditing; more files would make the agreement harder to apply.

## Consolidate duplicate ownership

Two fictional sources say the same thing with compatible scope. Before:

```markdown
---
trigger: Read when writing diagnostic logs.
---

# Token logging

Never include access token values in diagnostic logs. Identify the option instead.
```

```markdown
---
trigger: Read when writing diagnostic logs.
---

# Diagnostic credentials

Never include access token values in diagnostic logs, including failure details.
For an unreadable token file, name the option and report that the file is unreadable.
```

After, one `token-logging.md` owns the decision:

```markdown
---
trigger: Read when writing diagnostic logs.
---

# Token logging

Never include access token values in diagnostic logs, including failure details.
Identify the option and failed condition instead. For an unreadable token file,
report that its option points to an unreadable file; do not print the token.
```

The retained content covers both originals, including the failure case and useful example. Remove `diagnostic-credentials.md` only as approved. A general "Security" file collecting unrelated permissions and cryptography decisions would recreate mixed responsibility.

## Preserve an unresolved contradiction

Before, one source requires three total attempts for transient job failures; another requires two for the same jobs and conditions. "Use two to be safer" and "take the larger number to preserve both" each introduce an unapproved policy choice.

After the audit: show both source passages and ask which limit controls. Leave those passages unchanged until the user resolves the conflict. A structural proposal can proceed for independent, approved portions. Do not claim complete preservation or a fully reconciled collection while the contradiction remains.

## Separate a convention from a procedure

Before, a fictional migration file contains:

```markdown
---
trigger: Read when modifying an applied migration.
---

# Migration immutability

Never edit a migration applied to a shared environment; add a new migration.
Then select production, take a backup, run the deployment, and check its health.
```

The first agreement controls whether a file can change. The last sentence is an operational procedure with separate authorization and verification needs. A proposed after-version is:

```markdown
---
trigger: Read when modifying an applied migration.
---

# Migration immutability

Never edit a migration applied to a shared environment; add a new migration.
If an applied column addition needs a wider type, preserve the original file and
introduce a later widening migration. Rewriting the original would give a fresh
environment a different history from the one already applied.
```

The proposal must separately identify the removed procedure and its intended owner. If relocation or deletion is not authorized, retain the original and flag the blocked part. Do not silently discard the deployment obligations or create a deployment skill from an audit request.

## Approval is about concrete effects

"Audit our testing conventions" authorizes review and reporting, including normal metadata-only recording of completed reviews and invalidation of reopened unresolved receipts. It does not authorize replacing agreements or reorganizing files. Present the full target documents, preservation mapping, removal list, and index effects first. A convention awaiting that structural decision remains pending rather than receiving a receipt that would suppress the unresolved work. If it already had a matching receipt, explicitly invalidate it; omitting a new recording does not clear the old one.

"Audit our testing conventions without changing files" forbids recording and invalidation writes too. Selection stays read-only and findings are reported. Metadata dry runs can show the pending effect without applying it. Report a reopened cached receipt that remains persisted rather than claiming it was cleared.

"Apply the two-file proposal above and regenerate the index" approves those effects. Continue without asking again for each file or for the already approved synchronization. If the user adds a global-clock exception before application, reconcile that changed input and present the affected revision; the old proposal did not decide its destination.

## Repair an invalid baseline before structural edits

Before, a file named `wrong-name.md` has the H1 `Test focus`, a valid trigger, and a useful body. Strict validation reports SOURCE_FILENAME. A review-only request reports that issue and proposes a rename without writing.

After approval of that specific repair, the authoring agent renames it to `test-focus.md`, preserving all bytes, and repeats strict validation. Only a successful result allows the approved structural or prose changes to begin. The checker never renames the file itself. A pre-existing target or an unknown trigger is an unresolved input decision, not a reason to overwrite content or invent metadata. Discover agentscli-write-conventions for its distinct input-repair and authorship operation.

An AGENTS.md owned by another author is different: convention input validation succeeds, while index synchronization remains blocked. Do not rename or restamp those root instructions as an input repair.
