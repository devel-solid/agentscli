# Skill authoring

Read when creating, reviewing, or refactoring owned skills and their support files.

## Content and consultation

- Use the available `skill-creator`. Keep each skill a coherent unit of work, with a short description of its purpose and when it applies. Preserve the existing request and authorization; instructions do not expand scope or require additional approval where authorization already suffices.
- Include only what changes a decision or execution: necessary inputs, procedure, non-obvious constraints, and completion criteria. Consult configuration and rules at their responsible source before the dependent action instead of copying their values or policies. Do not add generic tutorials, history, or parallel catalogs.
- Keep common-path guidance in the body. Support files must teach a distinct criterion or serve a specific operation; state when to consult each and avoid deep reference chains. A short skill needs no support files. Do not transfer the same excess into references or conventions.
- Keep authored skill content in one language, including descriptions, headings, and examples. Chat language does not change the established language; examples in an English skill remain English.
- Before removing content or a resource, check its consumers and guarantees. Preserve necessary criteria or ensure the responsible source is consulted before the dependent action. Do not impose size quotas that remove useful information.

## Discovering project files

Start from the identified root and applicable instructions. Guide discovery by purpose, configuration, or metadata; explain how to recognize the responsible source and confirm its use through consumers. When candidates look similar, check current links and report unresolved material ambiguity. Avoid both fixed locations for movable resources and vague instructions to "find the file."

Do not embed machine-specific absolute paths, assumed directory depth, or relative paths to movable resources outside the skill's distribution. A source that moves or is renamed, with its maintained links updated, must remain discoverable. Preserve exact names, paths, options, markers, symbols, and resolution bases when a verified public contract requires them. For example, `.agentscli/templates/AGENTS.tpl.md` is a fixed CLI input, not a location to guess. Obtain mutable locations and resolution bases from the current contract or reader. This does not authorize moving private sources or changing their protection.

Resources distributed with the skill can use paths relative to its directory, with a direct link and a consultation condition. Moving the complete directory must preserve those links. Distributed skills must remain usable with their shipped resources, without requiring repository-only conventions or unshipped sibling files.

| Topic | Inappropriate | Appropriate |
| --- | --- | --- |
| Discovery | "Open the catalog at that fixed application path." | "Identify the catalog through project instructions, confirm its consumers, and follow item metadata." |
| Secrets | "Use `.secrets` three levels above the consumer." | "Locate `.secrets` through the current contract and calculate the reference from the base used by the reader." |
| Concision | "Copy the entire policy into the skill and every example." | "Keep the procedure and consult the responsible source before the action that depends on its policy." |
| Selective consultation | "Read every example for every operation." | "Consult the index example when evaluating or changing an index." |
| Precision | "Follow best practices and validate everything." | "Check accepted options in the contract and confirm that the reader resolves the selected file." |

## Verification

Compare the body, support files, and common reading path before and after. For content-reduction refactors, verify actual reduction across the complete set without losing guarantees or relocating redundancy. Review representative cases, including moved or renamed sources and multiple candidates; distinguish documentary review from actual execution.

For substantial changes, run the available `skill-creator` format validator. Also check activation descriptions, internal links, and procedural decisions: valid format does not establish usefulness. Follow [development](development.md) for proportionate checks and package-source boundaries; do not create tests that merely mirror skill or document wording. Keep canonical skill sources and assembled resources distinct. Follow [instruction safety](instruction-safety.md) when inspecting source material or sensitive data.
