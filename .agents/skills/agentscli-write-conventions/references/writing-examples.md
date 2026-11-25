# Writing examples

The examples illustrate writing and review criteria. Learn the concept demonstrated and apply it to the requested subject. Do not assume that the subjects, technologies, names, or decisions in the examples should appear in other conventions.

The agreements below are hypothetical choices, not defaults for a project. Establish the actual agreement from the request and verified project evidence before writing it. These cases show how to express a choice once it is known; they do not authorize inventing one.

## Decisions in context

Each case names a different transferable concept. The comparison format is for teaching here, not a required structure for authored conventions.

### Commit messages: replace an aspiration with an agreement

**Inadequate:** “Write clear and standardized commit messages.”

**Why it fails:** It names desirable qualities without choosing a format or explaining what information belongs in the message. Two contributors can follow it and produce incompatible results.

**Better excerpt:**

#### Name the change in the commit subject

Use `<type>: <summary>` for commit subjects, with `feat`, `fix`, `docs`, or `chore` as the type. The summary describes what changes; put the reason in the body when the subject alone does not explain it.

| Subject                                   | Assessment                                           |
| ----------------------------------------- | ---------------------------------------------------- |
| `fix: preserve accents in exported names` | Names the corrected behavior.                        |
| `fix: adjustments`                        | Follows the format but does not identify the change. |
| `preserve accents in exported names`      | Names the change but omits the agreed type.          |

Both the format and the information matter: adding a type does not make a vague summary useful.

**Transferable concept — observable agreement:** Replace adjectives such as “clear” with a choice that authors can apply and reviewers can assess. The format and types here are illustrative, not universal requirements.

### Monetary values: make representation and units explicit

**Inadequate:** “Handle prices precisely and format them correctly.”

**Why it fails:** It leaves storage, units, currency, and display formatting unresolved. A value of `1250` could mean very different amounts.

**Better excerpt:**

#### Keep monetary units explicit

For amounts in BRL, store and exchange the amount and its currency together:

- `amountMinor`: integer number of centavos, used for arithmetic.
- `currency`: `BRL`, identifying the currency as Brazilian reais; `amountMinor` uses its centavo unit.

Localized text belongs at the display boundary. For example:

```typescript
const price = { amountMinor: 1250, currency: 'BRL' }; // R$ 12,50
const doubled = { ...price, amountMinor: price.amountMinor * 2 }; // R$ 25,00
```

Do not store `"R$ 12,50"` as the value used for arithmetic: it mixes a number with display conventions. This agreement covers BRL; another currency requires an explicit decision about its units.

**Transferable concept — precise technical meaning:** Name the representation, unit, and scope. Use a small snippet to resolve ambiguity, then explain what it demonstrates. Avoid expanding the convention into a pricing algorithm or a currency tutorial.

### Tests: define what evidence a change needs

**Inadequate:** “Test everything well and keep coverage high.”

**Why it fails:** It neither identifies meaningful cases nor distinguishes missing behavioral evidence from a low coverage number.

**Better excerpt:**

#### Match test evidence to the changed behavior

Choose cases from the behavior affected by the change:

| Change           | Required evidence                                                              |
| ---------------- | ------------------------------------------------------------------------------ |
| Validation rule  | An accepted input and an input rejected by that rule.                          |
| Numeric boundary | The boundary and adjacent values on each relevant side.                        |
| Defect fix       | A regression case that fails with the original defect and passes with the fix. |

For an inclusive integer maximum of 10, check that 9 and 10 are accepted and 11 is rejected. These cases distinguish the accepted boundary from an off-by-one error. The number 10 is illustrative; use the actual limit.

Assert observable results rather than private function calls. A test that only verifies which helper ran does not establish that validation accepts or rejects the right input.

**Transferable concept — objective applicability:** Tie the required evidence to a recognizable change. A contributor can determine which cases apply without inventing a test quota or duplicating the implementation.

### Logs: choose useful context without exposing payloads

**Inadequate:** “Log complete job data so errors can be debugged.”

**Why it fails:** It treats volume as usefulness and can expose credentials or personal data. It also leaves the event's meaning unclear.

**Better excerpt:**

#### Record failure context without serializing the job

For a failed background job, select fields that let an operator correlate retries and identify the failure category:

| Field       | Purpose                                         |
| ----------- | ----------------------------------------------- |
| `event`     | Identifies the event as `job.failed`.           |
| `jobId`     | Correlates attempts using an opaque identifier. |
| `attempt`   | Distinguishes retries of the same job.          |
| `errorCode` | Identifies a stable failure category.           |

Do not include credentials, authorization headers, or the complete job payload. Select the diagnostic fields explicitly:

```typescript
logger.warn({
  event: 'job.failed',
  jobId,
  attempt,
  errorCode: 'UPSTREAM_TIMEOUT',
});
```

Avoid `logger.warn({ job, error })`: serializing entire objects can expose fields unrelated to diagnosis, including data added later.

**Transferable concept — useful information boundary:** State the diagnostic purpose and select information that serves it. An explicit exclusion and a contrast can explain the boundary better than “log safely.”

### Dependencies: scope a default and its exception

**Inadequate:** “Never add dependencies.”

**Why it fails:** Without a scope or exception, it can force fragile custom code even when a maintained library is justified.

**Better excerpt:**

#### Justify new production dependencies by a missing capability

This restriction applies to production dependencies. Development-only tools are outside its scope.

- **Default:** Use an existing dependency or a platform API when it meets the requirement.
- **Exception:** Add a library when those options lack a needed capability. In the change description, name that capability and explain the maintenance and bundle-size tradeoffs.

An exception needs a concrete gap, such as a required file format that the platform cannot parse. “This library is popular” does not explain why the existing options are insufficient.

**Transferable concept — bounded agreement:** Define where the default applies and what makes an exception justified. Do not turn a preference into an absolute ban unless that is the actual agreement.

### Components: describe a recurring decision, not the current tree

**Inadequate:** “The interface has a shared Button component, an AccountPanel, and a DashboardLayout.”

**Why it fails:** It inventories today's architecture without telling an author how to choose reuse for the next component. The inventory becomes stale as code changes.

**Better excerpt:**

#### Reuse components by behavior and accessibility

Reuse a shared component when its behavior and accessibility contract match the new use. Visual resemblance alone is insufficient.

| Situation                                                                         | Decision                                   | Reason                                                                   |
| --------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| Two controls have the same interaction semantics and differ only in their labels. | Reuse the component with a label input.    | The variation does not change its behavioral contract.                   |
| A navigation link looks like a button that submits a form.                        | Keep their interaction semantics distinct. | Similar styling does not make navigation and submission the same action. |

Shared styling can still be useful in the second case; it does not require forcing different behaviors into one control.

**Transferable concept — decision rule instead of implementation description:** Express the criterion that remains useful across changes. Refer to code facts as evidence, not as a substitute for the agreement.

### Authentication: recognize a product requirement

**Inadequate:** “Customers must sign in with an email address and a six-digit code before viewing invoices.”

**Why it fails:** It specifies who can use a feature and how that feature behaves. A heading such as “Authentication convention” would not turn it into a recurring way-of-working agreement.

**Better review outcome:**

#### Remove the feature flow from the convention draft

> Removed the invoice sign-in flow from this draft because it specifies product behavior. No recurring engineering agreement was established for this section, so it has no replacement rule.

The flow belongs in the product specification and its implementation. Report that destination; move the content only when that work is authorized. A rewrite such as “Always use secure authentication” would replace a misplaced requirement with a vague assertion rather than solve the problem.

**Transferable concept — correct content boundary:** Improving a draft can mean removing misplaced content. Do not manufacture a generic security convention merely to keep an authentication section.

### A simple rule: stop when one sentence is enough

**Inadequate:** “It is important to maintain consistency in our naming choices across all of the environment variables used throughout the project.”

**Why it fails:** It is longer than the decision and still leaves the naming choice unspecified.

**Better:** Name environment variables in uppercase snake case, such as `EXPORT_DIRECTORY`.

**Transferable concept — proportional detail:** A familiar, unambiguous rule may need only one sentence. A separate rationale, negative example, or section for every rule would add noise here.

## Complete conventions with different organizations

These documents show how decisions form a coherent whole, including a focused trigger and a title matching the illustrated filename. Their topics and structures are independent examples, not templates or a checklist of required sections.

### A short agreement: generated files

Illustrated filename: `generated-files.md`.

```markdown
---
trigger: Read when changing a generated file or its source.
---

# Generated files

Change a generated file through its maintained source and generator. Include the regenerated output in the same change when that output is versioned, so the source and its derived files remain consistent.
```

**Organization lesson:** A single recurring choice can stand as one paragraph. Extra headings or code would not clarify this agreement.

### Related decisions with explanations: timestamps

Illustrated filename: `timestamps.md`.

````markdown
---
trigger: Read when storing, exchanging, or displaying timestamps.
---

# Timestamps

## Preserve the instant across boundaries

Store and exchange timestamps as UTC instants using ISO 8601 strings with `Z`. This gives consumers an explicit timezone instead of relying on the server's local setting. Distinguish an instant from a calendar date:

| Meaning                             | Representation                   | Example                |
| ----------------------------------- | -------------------------------- | ---------------------- |
| A completion instant                | ISO 8601 in UTC with `Z`         | `2026-04-18T14:30:00Z` |
| A calendar date, such as a birthday | `YYYY-MM-DD`, without a timezone | `1990-04-18`           |

A record of an event therefore carries its instant explicitly:

```json
{ "completedAt": "2026-04-18T14:30:00Z" }
```

Avoid `"2026-04-18 14:30"` for an instant: the reader cannot tell which timezone it represents. Do not convert a calendar date to midnight UTC merely to reuse timestamp handling; that would change its meaning when localized.

## Localize at display time

Render instants in the user's selected timezone. Keep the original instant available for sorting and comparisons; a formatted display string is not the stored value.
````

**Organization lesson:** Titles separate related decisions. The table distinguishes meanings, while the snippet shows one in context. The calendar-date boundary prevents an overbroad application without turning the document into a date-time manual.

### A scoped comparison: command output

Illustrated filename: `command-output.md`.

````markdown
---
trigger: Read when adding or changing command output.
---

# Command output

For commands that emit a machine-readable result, reserve stdout for that result. Send diagnostics to stderr so callers can parse stdout without filtering prose.

| Output                         | Destination                     | Reason                                  |
| ------------------------------ | ------------------------------- | --------------------------------------- |
| Requested JSON result          | stdout                          | A caller can parse the complete stream. |
| Warning about an ignored input | stderr                          | It must not corrupt the result.         |
| Progress message               | stderr, only in interactive use | Piped execution stays quiet.            |

Help and version commands may emit plain text to stdout because their requested result is that text. The table does not require every command to offer JSON or progress output.

For an illustrative command that already supports JSON, callers can separate the streams:

```sh
example-report --json > result.json 2> diagnostics.log
```

`result.json` must remain parseable even when a warning is written to `diagnostics.log`. A banner or progress line on stdout would break that use.

When a command fails, return a nonzero exit code and explain the failure on stderr. A diagnostic message alone does not let a caller determine success reliably.
````

**Organization lesson:** A table makes parallel choices easy to compare; the shell example shows why stream separation matters to a caller. The scope and exception make the agreement precise without inventing new command capabilities.
