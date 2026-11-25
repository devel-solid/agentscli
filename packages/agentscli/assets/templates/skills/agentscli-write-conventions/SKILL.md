---
name: agentscli-write-conventions
description: Create, review, or update authored convention files in an agentscli project. Use for project rules, trigger text, self-contained guidance, and convention naming.
license: MIT
---

# Maintain project conventions

> A convention is an agreement that chooses a standard among possible ways of working to make work consistent and predictable. For example, a team might adopt Conventional Commits among the commit message formats accepted by Git.
>
> Conventions record choices for recurring situations in how we work. Product descriptions, feature requirements, and solutions limited to an isolated case belong in specifications and code.

Identify the project root from the request and project instructions. Run the read-only [checker](scripts/check.mjs) before edits: `node <this-skill>/scripts/check.mjs --repo-root <root>`. A nonzero result blocks authorship until the reported input issue is resolved; do not initialize, generate, or repair beyond the request.

Before creating or reviewing conventions, read the [writing examples](references/writing-examples.md). They teach writing and review criteria: apply the demonstrated concepts to the requested subject, without importing their topics, technologies, names, or decisions into unrelated conventions.

Use the language requested by the user or already used in the project's relevant content. Write the final convention files directly under `.agentscli/conventions/`, including subdirectories when useful; if none exist, create the first convention there within the request. These files are authored content: initialization, skill updates, synchronization, and checking preserve their bytes.

## Write applicable agreements

Identify the recurring situation and the choice that makes work consistent. State when the agreement applies, what to do, and any boundaries or exceptions needed to distinguish compliant work from plausible alternatives. Replace vague advice with criteria a reader can apply to the actual task. Use the request and verified project facts; surface material unresolved choices instead of inventing agreements, technologies, or exceptions merely to make the text concrete.

Give a decision its own title and explanation when that makes it easier to find and understand. Explain the reason when it helps the reader apply the agreement. Group related decisions around the work they govern rather than describing the current implementation or listing product features.

Add examples, snippets, or comparisons where they resolve ambiguity or show how a decision applies. Choose the form for the information: prose can explain the decision and its reason, a table can compare alternatives or conditions, and a snippet can demonstrate application. Positive and negative examples are useful when their difference teaches something; explain that difference rather than leaving the reader to infer the rule from code. Keep examples consistent with the stated agreement and limited to the relevant detail. A self-explanatory rule may need only one sentence. Do not impose a fixed outline, minimum length, or an example for every item, and do not expand conventions into tutorials, specifications, or parallel code documentation.

## Preserve the file contract

Each convention starts with YAML containing only nonempty string `trigger`, followed by one H1 outside examples and its body. Derive its `.md` basename from the H1: normalize with NFKD, remove combining marks, lowercase, collapse runs other than Unicode letters or numbers to hyphens, trim outer hyphens, then normalize to NFC. For example, `日本語` becomes `日本語.md`. Keep the trigger short and precise about when to read the rule. Keep the body self-contained: no links to conventions or skill entrypoints, directories, or support files. Ordinary non-resource links and own fragments are allowed. Trigger links resolve from root AGENTS; body links resolve from the convention's actual location. Skills have their own activation description: move misplaced procedural content only through a separately authorized skill-authoring request.

Use verified project facts within the authorized convention. When an authorized title change requires a canonical filename rename, update references within this skill's target scope; the convention index is rebuilt mechanically during authorized generation.

## Review and validate

Review the prose semantically: does it describe a recurring agreement, use clear and precise language, give applicable criteria, and fit the actual subject and authorized scope? Check for contradictions and unsupported choices. Assess whether examples clarify the agreement, whether their details are accurate, and whether the amount of explanation is proportional to the decision. Keep rules that are already clear concise; enrich rules whose application remains ambiguous.

After edits rerun the checker. Scripts prove only mechanically decidable checks; do not approximate editorial quality with keyword searches, mandatory sections, or example counts. For an authorized index update, mention agentscli-build-agents and discover its actual project location through project skills; do not assume its path. Authorship alone does not authorize generation. Report edited conventions and actual validation.
