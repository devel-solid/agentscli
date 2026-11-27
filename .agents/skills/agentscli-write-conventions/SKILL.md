---
name: agentscli-write-conventions
description: Create, review, or update a convention governing one recurring
  decision, with precise triggers and concrete decision examples. Use for
  ordinary convention authorship; use agentscli-optimize-conventions for
  structural audits and reorganization of an existing collection.
license: MIT
metadata:
  generatedBy: "@devel-solid/agentscli"
  generatorVersion: 0.9.4
---

# Maintain project conventions

> A convention is an agreement that chooses a standard among possible ways of working to make work consistent and predictable. For example, a team might adopt Conventional Commits among the commit message formats accepted by Git.
>
> Conventions record choices for recurring situations in how we work. Product descriptions, feature requirements, and solutions limited to an isolated case belong in specifications and code.

Identify the project root from the request and project instructions. Run the read-only [checker](scripts/check.mjs) before edits: `node <this-skill>/scripts/check.mjs --repo-root <root>`. Validation checks work inputs without requiring ownership of root AGENTS.md; synchronization has its own ownership gate.

A nonzero result blocks ordinary prose edits, but permits the authoring agent to apply a minimal mechanical input repair explicitly included in the active request or an already approved refactoring plan. First record the diagnostic and exact repair, check that its destination is safe and unoccupied, apply only that repair, and rerun the unchanged checker. Continue ordinary authorship only after it passes. Diagnosing an input does not authorize its repair; unrelated invalid inputs require their own repair scope. Missing tools, ambiguous ownership, unsafe links, and collisions are impediments, not permission to bypass checks, initialize resources, or change root instructions.

For example, a valid `# Test focus` body saved as `wrong-name.md` produces SOURCE_FILENAME. An approved rename to `test-focus.md` preserves its bytes and resolves that diagnostic before wording edits. Do not rewrite the body merely to satisfy the old filename or invent a missing trigger. Read [input repair examples](references/input-repair.md) when a failed preflight requires an authorized repair, a repair conflicts with existing files, or a missing value is ambiguous.

Before creating or reviewing conventions, consult the [writing-problem index](references/writing-examples.md). Select cases by the difficulty in the draft, and read their analyses, complete originals, and all resulting conventions to see what information changes the reader's decision. Transfer the concepts to the requested subject without automatically copying structures, topics, technologies, names, or agreements. The library's hypothetical contexts establish its teaching examples only; these are bundled references, not templates, commands, or policies to install in a client project.

Use the language requested by the user or already used in the project's relevant content. Write the final convention files directly under `.agentscli/conventions/`, including subdirectories when useful; if none exist, create the first convention there within the request. These files are authored content: initialization, skill updates, synchronization, and checking preserve their bytes.

## Delegate independent authorship

When subagents are available and permitted, use them for a substantial batch of independent conventions or an independent semantic review whose ambiguity warrants another reader. Handle a small local edit directly. Complete the input check before delegation. Give each worker this skill, exact target paths, verified agreements and exceptions, relevant project context, and any approved refactoring contents and preservation mapping. Assign disjoint write targets; review-only workers return findings without edits. Workers report changed files, unresolved choices, and actual checks without expanding into neighboring responsibilities, receipt management, or index synchronization.

The main agent reviews the combined text for consistency, contradictions, and useful examples, then runs the final checker and completes index synchronization after all writers finish, as described below. For example, fixture independence and fixed test clocks can be drafted separately once their boundaries are settled; competing edits to the same alias rule and exception should stay with one writer.

## Write applicable agreements

Identify the recurring situation and the choice that makes work consistent. State when the agreement applies, what to do, and any boundaries or exceptions needed to distinguish compliant work from plausible alternatives. Replace vague advice with criteria a reader can apply to the actual task. Use the request and verified project facts; surface material unresolved choices instead of inventing agreements, technologies, or exceptions merely to make the text concrete.

Give each convention one responsibility: a recurring decision with identifiable conditions of application. Choose a title and trigger that name that decision. Keep its rule, rationale, qualifying conditions, exceptions, and decision examples together. A shared technology or broad subject does not make independent decisions one responsibility.

For example, this proposed draft mixes independent agreements:

```text
Testing: factories return fresh nested state; elapsed-time tests supply a clock.
```

Write separate `Fixture independence` and `Fixed test clocks` conventions: fixing a mutation leak can require the first without the second. Two headings in a single `Testing` file would preserve the discovery problem. Conversely, canonical option spelling and the exception retaining an old spelling for supported callers belong together: both decide whether an alias may exist. See case 09 for complete split files and case 08 for a rule whose exception must remain attached.

During ordinary authorship, keep the requested convention focused and propose destinations for independent material. Discover agentscli-optimize-conventions by identity when an existing collection needs a structural plan; do not silently rename, split, consolidate, or delete neighboring conventions during a local wording edit. An already approved concrete reorganization supplies the target scope for this skill.

Start from the concrete difficulty in applying the agreement: what question or decision remains ambiguous? Choose an example that resolves it, then choose how to present that information. Input and output can clarify a transformation, annotated code can explain an abstraction, an explained scenario can delimit an exception, and a table can compare alternatives or conditions. These are possible uses, not a mapping from subjects to required formats. Explain the relevant difference in positive and negative examples rather than leaving the reader to infer the rule from code. Keep examples consistent with the established agreement and limited to the detail needed to understand it.

Teach the decision with concrete examples wherever the reader could plausibly choose incorrectly. For responsibility boundaries, exceptions, precedence, transformations, and non-obvious technical rules, include the relevant input or situation, the compliant outcome, a plausible inadequate alternative, and why the difference matters. Use complete before/after documents when a structural change is the point. Do not call an unexplained snippet or a restatement of the rule an example.

For example, "do not share fixture state" alone leaves shallow copies ambiguous. Show two factory results, mutate a nested array in the first, and show that the second remains empty; explain why copying only the outer object fails. This teaches the implementation boundary without prescribing a fixture library.

A literal choice such as the lowercase `.snap` extension can stay short when no decision ambiguity remains. Concision is not a reason to omit a useful example. Choose the presentation for the information: repeated before/after examples are welcome when each teaches a real distinction. Do not impose variety, quotas, minimum length, or a fixed outline, and do not expand conventions into generic tutorials or parallel code documentation.

## Preserve the file contract

Each convention starts with YAML containing required nonempty string `trigger` and optionally `reviewedHash` and `reviewPolicyVersion`, followed by one H1 outside examples and its body. `reviewedHash` is a 64-character lowercase SHA-256 hexadecimal string; `reviewPolicyVersion` is a positive decimal string such as `'1'`. Either field may be absent: existing trigger-only conventions remain valid and await refactoring review. Other frontmatter keys are rejected. Derive its `.md` basename from the H1: normalize with NFKD, remove combining marks, lowercase, collapse runs other than Unicode letters or numbers to hyphens, trim outer hyphens, then normalize to NFC. For example, `日本語` becomes `日本語.md`. Keep the trigger short and precise about when to read the rule. Keep the body self-contained: no links to conventions or skill entrypoints, directories, or support files. Ordinary non-resource links and own fragments are allowed. Trigger links resolve from root AGENTS; body links resolve from the convention's actual location. Skills have their own activation description: move misplaced procedural content only through a separately authorized skill-authoring request.

Preserve existing review fields when editing content. They describe the version actually reviewed, so changing a trigger, H1, body, example, or path makes the old receipt stale without any manual reset. Do not stamp or invalidate a receipt, advance its policy version, or run the review filter merely because authorship or its checker succeeded. Discover agentscli-optimize-conventions when the user requests that distinct review operation. New conventions can omit both fields; a split source's receipt must not be treated as proof that each new target was reviewed.

Use verified project facts within the authorized convention. When an authorized title change requires a canonical filename rename, update references within this skill's target scope; rebuild the convention index mechanically as part of completing the change.

## Review and validate

Review the prose semantically: does it describe a recurring agreement, use clear and precise language, give applicable criteria, and fit the actual subject and authorized scope? Check for contradictions and unsupported choices. Apply the document to a plausible task and a competing interpretation: can the reader distinguish the compliant outcome using the document alone? Saying that a technical rule is already clear does not demonstrate that it can be applied. For each added example, can the reader now make a decision that was ambiguous before? Does it add context rather than repeat the rule in other words? Does its presentation make the information easier to understand, or merely rearrange it? Revise or remove additions without an informative gain; check the accuracy of their details and keep the explanation proportional. In a batch, review those reasons across the files: repeated form alone is not a defect, and varied form alone is not evidence of quality. Keep rules that are already clear concise; enrich rules whose application remains ambiguous.

For responsibility, apply the convention to a task needing its main agreement and another needing only a suspected secondary agreement. Split independent decisions within the approved scope; retain conditions necessary to interpret the same rule. Check that examples distinguish actual alternatives and do not introduce unverified policies. Report unresolved contradictions instead of deciding them through wording changes.

After edits rerun the checker. Scripts prove only mechanically decidable checks; do not approximate editorial quality with keyword searches, mandatory sections, or example counts.

A request to create or update a convention includes synchronizing the generated root AGENTS.md as part of the same delivery, without a separate request or approval. Mention agentscli-build-agents, discover its actual project location through project skills, and follow its validation, preview, synchronization, and freshness-check workflow after the final authored changes. Respect an explicit request to leave the index unchanged; review-only requests remain read-only. Preserve handwritten root instructions if the build skill reports DOCUMENT_CONFLICT, and report the completed convention edits and blocked index update separately.

For example, after creating `Test focus`, the delivery is complete only when the generated AGENTS.md includes its title, trigger, and link and the freshness check passes. Passing the authoring checker alone leaves discovery unfinished. Report edited conventions, index synchronization, actual checks, and any remaining work.
