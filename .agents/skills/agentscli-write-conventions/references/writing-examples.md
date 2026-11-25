# Writing examples

The examples illustrate writing and review decisions. Transfer the concept to the requested subject without automatically copying the example's structure, subjects, technologies, names, or agreements.

The agreements below are hypothetical choices, not defaults for a project. Establish the actual agreement from the request and verified project evidence before writing it. These cases show how to express a choice once it is known; they do not authorize inventing one.

Start with the reader's unresolved question or decision. Choose an example that supplies the missing information, then choose a presentation that makes that information understandable. Input and output can reveal a transformation; annotated code can explain an abstraction; a scenario can establish an exception's boundary; a table can compare alternatives or conditions. These are possible uses, not a mapping from subjects to formats.

The comments below explain those authoring choices. They need not appear as a checklist or a report in a final convention. Across a batch, judge each addition by the understanding it provides. Repeated forms can be appropriate when they serve the content; changing forms merely for variety provides no evidence of quality.

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

**Transferable concept — observable agreement:** Replace adjectives such as “clear” with a choice that authors can apply and reviewers can assess. Here the parallel subjects isolate two independent mistakes, so a comparison helps distinguish format compliance from useful information. The format and types are illustrative, not universal requirements.

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

Choose cases from the behavior affected by the change. For a validation rule, exercise accepted and rejected inputs. At a numeric boundary, include the boundary and adjacent values on each relevant side. For a defect fix, include a regression case that fails with the original defect and passes with the fix.

For an inclusive integer maximum of 10, the relevant observations are:

```text
input 9  -> accepted
input 10 -> accepted
input 11 -> rejected
```

Rejecting 10 would expose an exclusive comparison; accepting 11 would expose a missing or misplaced limit. A test of 5 alone cannot distinguish either mistake. The number 10 is illustrative; use the actual limit.

Assert observable results rather than private function calls. A test that only verifies which helper ran does not establish that validation accepts or rejects the right input.

**Transferable concept — objective applicability:** Tie the required evidence to a recognizable change. The concrete inputs and outcomes show what the reader would miss by checking only an ordinary value. A catalog of test categories alone would leave that doubt unresolved; this example does not prescribe a test quota or duplicate an implementation.

### Logs: choose useful context without exposing payloads

**Inadequate:** “Log complete job data so errors can be debugged.”

**Why it fails:** It treats volume as usefulness and can expose credentials or personal data. It also leaves the event's meaning unclear.

**Better excerpt:**

#### Record failure context without serializing the job

For a failed background job, select fields that let an operator correlate retries and identify the failure category. Do not include credentials, authorization headers, or the complete job payload:

```typescript
logger.warn({
  event: 'job.failed', // Identify what happened.
  jobId, // Correlate attempts with an opaque identifier.
  attempt, // Distinguish retries of that job.
  errorCode: 'UPSTREAM_TIMEOUT', // Classify the failure without its payload.
});
```

Avoid `logger.warn({ job, error })`: serializing entire objects can expose fields unrelated to diagnosis, including data added later.

**Transferable concept — useful information boundary:** State the diagnostic purpose and select information that serves it. The annotated object shows exactly what crosses the logging boundary and why. It also makes the contrast with whole-object serialization visible without a second inventory of the same fields.

### Dependencies: scope a default and its exception

**Inadequate:** “Never add dependencies.”

**Why it fails:** Without a scope or exception, it can force fragile custom code even when a maintained library is justified.

**Better excerpt:**

#### Justify new production dependencies by a missing capability

This restriction applies to production dependencies. Development-only tools are outside its scope.

- **Default:** Use an existing dependency or a platform API when it meets the requirement.
- **Exception:** Add a library when those options lack a needed capability. In the change description, name that capability and explain the maintenance and bundle-size tradeoffs.

Suppose an import must read a file format that neither the platform nor an existing dependency can parse. A library that supplies that parser addresses the missing capability; justify it by naming that gap and its maintenance and bundle-size costs. If the input is already supported and the proposal merely replaces a working parser with a more popular one, this exception does not justify the addition.

**Transferable concept — bounded agreement:** Define where the default applies and what makes an exception justified. The scenario changes the decisive fact—whether a required capability is absent—so the reader can apply the exception rather than treating “when needed” as permission for any preference. Do not invent an exception unless it belongs to the actual agreement.

### Components: describe a recurring decision, not the current tree

**Inadequate:** “The interface has a shared Button component, an AccountPanel, and a DashboardLayout.”

**Why it fails:** It inventories today's architecture without telling an author how to choose reuse for the next component. The inventory becomes stale as code changes.

**Better excerpt:**

#### Reuse components by behavior and accessibility

Reuse a shared component when its behavior and accessibility contract match the new use. Visual resemblance alone is insufficient.

For example, an existing `SubmitButton` wraps a native form submission button:

```tsx
// Both uses submit their enclosing form; the label is a coherent variation.
<SubmitButton label="Save profile" />
<SubmitButton label="Save address" />

// This control navigates. Similar styling does not make it a form submission.
<a className="action" href="/reports">Open reports</a>
```

Reuse `SubmitButton` for the two submission actions when its accessibility contract also fits. Keep navigation semantics for the link. Shared styling may serve both without forcing navigation into the submission abstraction.

**Transferable concept — decision rule instead of implementation description:** Express the criterion that remains useful across changes. The comments identify what the abstraction shares and what falls outside it; the component names alone would not explain that boundary. Refer to verified code facts as evidence, not as a substitute for the agreement.

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

## Review the information gained

Consider a draft that says “Normalize imported names.” Verified project evidence establishes that normalization removes surrounding whitespace and preserves whitespace inside the name. The draft still leaves the reader unsure whether repeated internal spaces are collapsed.

**Superficial enrichment:** “For example, normalize each imported name by applying the agreed normalization consistently.”

This repeats the instruction without explaining the agreed transformation. More words have not resolved the concrete doubt.

State the verified agreement explicitly: “Remove surrounding whitespace from imported names; preserve whitespace inside the name.” If the distinction still needs illustration for the intended reader, consider how to show the resulting value.

**Unhelpful presentation for that question:**

| Position      | Input content | Output content |
| ------------- | ------------- | -------------- |
| Beginning     | Two spaces    | None           |
| First word    | `Ana`         | `Ana`          |
| Between words | Two spaces    | Two spaces     |
| Second word   | `Silva`       | `Silva`        |
| End           | Two spaces    | None           |

The information is concrete, but splitting one value across rows makes the reader reconstruct the name to see the result. For this question, quoted input and output show the same information in context:

```text
input:  "  Ana  Silva  "
output: "Ana  Silva"
```

The two spaces between the words remain; only the surrounding spaces disappear. `"Ana Silva"` would violate the agreement by collapsing internal whitespace. The example lets the reader distinguish two plausible implementations without introducing a new normalization policy. If the explicit sentence already resolves the doubt, keep that sentence alone.

A table could help if the task actually required comparing several normalization policies. Its use is judged by that information need, not by the subject or the presence of rows. Likewise, a snippet that merely called `normalizeName(value)` would leave the relevant behavior hidden.

In review, ask whether the addition enables a decision that was ambiguous, adds relevant context instead of paraphrasing the rule, and presents that information clearly. Remove or revise additions that fail that judgment. Do not add more examples when the existing agreement already answers the reader's question.

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

Store and exchange timestamps as UTC instants using ISO 8601 strings with `Z`. This gives consumers an explicit timezone instead of relying on the server's local setting.

A record of an event therefore carries its instant explicitly:

```json
{ "completedAt": "2026-04-18T14:30:00Z" }
```

Avoid `"2026-04-18 14:30"` for an instant: the reader cannot tell which timezone it represents.

A calendar date such as a birthday instead uses `YYYY-MM-DD`, for example `1990-04-18`, without a timezone. Converting it to midnight UTC merely to reuse timestamp handling would add an instant that was never part of its meaning; displaying that instant west of UTC could even show the previous date.

## Localize at display time

Render instants in the user's selected timezone. Keep the original instant available for sorting and comparisons; a formatted display string is not the stored value.

For a user whose selected timezone has offset UTC−03:00 at that instant:

```text
stored instant: 2026-04-18T14:30:00Z
displayed time: 11:30 on 18 April 2026
```

Only the presentation changes. Do not replace the stored instant with `"11:30"`, which loses the date and timezone needed for comparisons.
````

**Organization lesson:** Titles separate preservation from display. The JSON establishes what is stored; the input and display explain what localization changes and what it preserves. The calendar-date scenario explains why the timestamp agreement must not be applied to every date-shaped value. These are information needs within one topic, not a required organization for date conventions.

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
