---
name: agentscli-write-conventions
description: Create, review, or update authored convention files in an agentscli
  project. Use for project rules, trigger text, self-contained guidance, and
  convention naming.
license: MIT
metadata:
  generatedBy: "@devel-solid/agentscli"
  generatorVersion: 0.7.4
---

# Maintain project conventions

> A convention is an agreement that chooses a standard among possible ways of working to make work consistent and predictable. For example, a team might adopt Conventional Commits among the commit message formats accepted by Git.
>
> Conventions record choices for recurring situations in how we work. Product descriptions, feature requirements, and solutions limited to an isolated case belong in specifications and code.

Identify the project root from the request and project instructions. Run the read-only [checker](scripts/check.mjs) before edits: `node <this-skill>/scripts/check.mjs --repo-root <root>`. A nonzero result blocks authorship until the reported input issue is resolved; do not initialize, generate, or repair beyond the request.

Before creating or reviewing conventions, read the [writing examples](references/writing-examples.md). Transfer their writing and review concepts to the requested subject, without automatically copying their structure or importing their topics, technologies, names, or decisions. They are demonstrations, not templates for individual files or a batch.

Use the language requested by the user or already used in the project's relevant content. Write the final convention files directly under `.agentscli/conventions/`, including subdirectories when useful; if none exist, create the first convention there within the request. These files are authored content: initialization, skill updates, synchronization, and checking preserve their bytes.

## Write applicable agreements

Identify the recurring situation and the choice that makes work consistent. State when the agreement applies, what to do, and any boundaries or exceptions needed to distinguish compliant work from plausible alternatives. Replace vague advice with criteria a reader can apply to the actual task. Use the request and verified project facts; surface material unresolved choices instead of inventing agreements, technologies, or exceptions merely to make the text concrete.

Give a decision its own title and explanation when that makes it easier to find and understand. Explain the reason when it helps the reader apply the agreement. Group related decisions around the work they govern rather than describing the current implementation or listing product features.

Start from the concrete difficulty in applying the agreement: what question or decision remains ambiguous? Choose an example that resolves it, then choose how to present that information. Input and output can clarify a transformation, annotated code can explain an abstraction, an explained scenario can delimit an exception, and a table can compare alternatives or conditions. These are possible uses, not a mapping from subjects to required formats. Explain the relevant difference in positive and negative examples rather than leaving the reader to infer the rule from code. Keep examples consistent with the established agreement and limited to the detail needed to understand it.

A self-explanatory rule may need only one sentence. If no uncertainty remains, do not add material just to make the file look enriched. In a batch, make the editorial choice for each agreement; the same form can serve several files when their information calls for it. Do not impose variety, alternation, quotas, a fixed outline, minimum length, or an example for every item. This reasoning guides authorship; the final convention need not expose a checklist or report of it. Do not expand conventions into tutorials, specifications, or parallel code documentation.

## Preserve the file contract

Each convention starts with YAML containing only nonempty string `trigger`, followed by one H1 outside examples and its body. Derive its `.md` basename from the H1: normalize with NFKD, remove combining marks, lowercase, collapse runs other than Unicode letters or numbers to hyphens, trim outer hyphens, then normalize to NFC. For example, `日本語` becomes `日本語.md`. Keep the trigger short and precise about when to read the rule. Keep the body self-contained: no links to conventions or skill entrypoints, directories, or support files. Ordinary non-resource links and own fragments are allowed. Trigger links resolve from root AGENTS; body links resolve from the convention's actual location. Skills have their own activation description: move misplaced procedural content only through a separately authorized skill-authoring request.

Use verified project facts within the authorized convention. When an authorized title change requires a canonical filename rename, update references within this skill's target scope; the convention index is rebuilt mechanically during authorized generation.

## Review and validate

Review the prose semantically: does it describe a recurring agreement, use clear and precise language, give applicable criteria, and fit the actual subject and authorized scope? Check for contradictions and unsupported choices. For each added example, can the reader now make a decision that was ambiguous before? Does it add context rather than repeat the rule in other words? Does its presentation make the information easier to understand, or merely rearrange it? Revise or remove additions without an informative gain; check the accuracy of their details and keep the explanation proportional. In a batch, review those reasons across the files: repeated form alone is not a defect, and varied form alone is not evidence of quality. Keep rules that are already clear concise; enrich rules whose application remains ambiguous.

After edits rerun the checker. Scripts prove only mechanically decidable checks; do not approximate editorial quality with keyword searches, mandatory sections, or example counts. For an authorized index update, mention agentscli-build-agents and discover its actual project location through project skills; do not assume its path. Authorship alone does not authorize generation. Report edited conventions and actual validation.
