# Design

## Context

See `proposal.md` for motivation. The source repository keeps handwritten English instructions and selects three distributed skill directories through `agentscli.yml`. The fourth owned skill, `agentscli-release`, and the OpenSpec skills are not client resources.

The exploration found no support files in the four owned skill trees. Counts include frontmatter and use whitespace-separated words:

| Canonical entrypoint | Baseline words |
| --- | ---: |
| `.agents/skills/agentscli-write-conventions/SKILL.md` | 808 |
| `.agents/skills/agentscli-update-agents/SKILL.md` | 593 |
| `assets/templates/skills/agentscli-build-agents/SKILL.md` | 679 |
| `.agents/skills/agentscli-release/SKILL.md` | 585 |
| Total | 2,665 |

`src/manifest.ts` fixes the client layout and language-only configuration. Existing Markdown parsing, planning, and package tests cover markers, source/output ownership, context rejection, and complete skill-tree delivery. This change does not need a runtime implementation or a new test suite.

The SGO convention is reusable in substance. Its generated notices, Portuguese prose, links to SGO-specific conventions, and blanket wording about external relative paths are not directly portable. The current source package and installed global command are both `0.3.0`; these observations must be refreshed before delivery.

## Goals / Non-Goals

**Goals:** preserve decisions while reducing reading; keep distributed skills independently usable; distinguish movable resources from fixed contracts; provide durable authoring guidance; and make the released artifact reach the existing local installation and SGO client.

**Non-Goals:** changing CLI commands, layout, markers, dependencies, or document templates; adding a shared skill runtime or validation infrastructure; publishing the internal convention as a client default; modifying OpenSpec skills; refactoring SGO-owned skills again; or implementing this change during proposal creation.

## Decisions

### Adapt the SGO convention while preserving its substantive guidance

Create `docs/conventions/skill-authoring.md` with H1 `Skill authoring` through `agentscli-write-conventions`, and add its task trigger in the handwritten `AGENTS.md` through `agentscli-update-agents`. Translate the source convention's rules and five example pairs, remove generated framing, and adapt internal references to `development.md` and `instruction-safety.md` only where relevant. Keep the convention free of external links and bibliography.

Clarify that fixed public contract paths are allowed: removing `.agentscli/templates/AGENTS.tpl.md` would hide an actual input contract. Mutable internal locations instead come from current project instructions and their maintained links. This preserves the SGO convention's intent without importing an incompatible blanket prohibition. Byte-for-byte copying was rejected because its language, formatting, and references would be wrong here; inventing a separate policy would discard reusable guidance.

### Keep four short, self-contained entrypoints

Use `skill-creator` when implementing the refactor. Consolidate repeated conditions within each skill and retain only guidance that changes execution:

- `write-conventions`: keep context selection, semantic curation, canonical filenames, cards, generated-link bases, and the distinction between authored and generated files. Condense repeated warnings and discover internal convention locations through the project's instructions.
- `update-agents`: keep context selection, the concise entrypoint role, fill-in comment replacement, insertion-marker preservation, and authored-link checks. Consolidate repeated authorization and format guidance.
- `build-agents`: keep installed-command discovery, requested-operation selection, validation/preview/apply/check, managed-tree restoration, manual-file protection, bounded cleanup, and the correct retry for partial failures. Reduce migration narration that does not alter the next action, while retaining legacy detection and explicit migration boundaries.
- `release`: keep current candidate discovery, native Git/npm preparation and delivery, immutable identities, artifact verification, and actual-result reporting. Remove first-release chronology, old candidate hashes, and instructions to repeat a completed repository rename.

Do not create support files merely to shorten entrypoints or move redundant prose into the new convention. Necessary context checks can remain concise in each independently usable distributed skill. A cross-skill shared reference was rejected because packaging currently distributes independent trees; it would create hidden client dependencies or another maintained copy.

### Separate mutable facts from stable contracts

For movable project sources, specify where discovery starts, how to recognize the responsible source, and how to confirm consumers or current links. Resolve multiple candidates through evidence before choosing. For release state, inspect current package/lockfile metadata, refs, remote, and registry during preparation.

Preserve contractual paths, public options, markers, names, language values, and resolution bases. If a support resource is genuinely needed later, link it relative to the skill and state when to read it. Removing all paths was rejected because it would make fixed inputs ambiguous; replacing paths with an unqualified instruction to find a file was rejected because it would remove recognition criteria.

### Verify semantic preservation and actual reduction

Use the same word-count method before and after across all four trees, including any new support files. Report the three distributed trees separately from the four-skill total, and compare the material read in ordinary operations. The new convention is an intentional maintained policy, not a place to store deleted skill paragraphs. There is no percentage target.

Review representative decisions against the prior skills: direct authorship; valid Portuguese client authorship; missing, malformed, conflicting, and legacy configuration; internal ancestors; review/preview/check without writes; authorized generation without redundant approval; marker and filename handling; manual destinations; bounded stale cleanup; partial sync versus migration retries; and current-state release preparation. Include movable-source and multiple-candidate discovery. These are documentary behavior reviews, not an automated fixture or integration suite.

Run the available skill-format validator and check links and descriptions. Use the existing `review` workflow after implementation to look for lost conditions. Run focused existing units when relevant and `npm run check` for readiness. Build and archive inspection establish delivery contents; neither establishes installed-package test coverage.

### Treat rollout as delivery with explicit checkpoints

Use the refactored internal release skill. A patch release is appropriate because runtime and public contracts remain unchanged. Refresh metadata and published refs before selecting the exact unused version, tentatively `0.3.1`, and its `agentscli-v<version>` tag. Update package/lockfile metadata and the README version statement consistently. Do not change dependencies or document defaults.

Record the reviewed source identity, archive contents, SHA-512 integrity, and intended remote/registry effects before delivery. Use the existing native authentication and the authorization available during the later execution request; proposal creation grants none of these effects. Preserve all existing tags and history. If the final source changes, rebuild and inspect the final candidate before publishing it.

## Risks / Trade-offs

- Removing a condition can broaden a rule, as happened during the SGO refactor -> compare the decisions and exceptions before and after, not just word counts.
- Excessive abstraction can hide fixed inputs -> retain verified contract literals and review them against their actual readers.
- Deduplication can make a distributed skill depend on repository-only instructions -> keep each packaged tree independently usable and inspect the archive.
- The SGO sync can also regenerate documents or overwrite local managed-skill edits -> inspect the target's current instructions, status, configuration, and exact preview before mutation; preserve unrelated work and resolve unexpected effects within scope first.
- Native authentication, registry availability, global-install permissions, or target-checkout permissions can block delivery -> report the actual blocking operation and keep the corresponding tasks open; do not mark a prepared artifact as published or a package update as a completed SGO rollout.

## Migration Plan

1. Complete the convention, entrypoint refactors, semantic review, and package readiness in the source repository. Do not run client init or sync there.
2. Prepare the available patch version and final artifact, then perform the authorized source commit/tag/push and publication. Verify the public source/tag and registry integrity against the artifact; inspect remote state before retrying an ambiguous response.
3. Update the existing global `@devel-solid/agentscli` installation to that exact published version using native npm. Verify the resolved executable and version. This is the requested real installation update, not an installation test environment.
4. Locate SGO Prototype through available project metadata and its instructions, rather than storing a machine path in maintained guidance. Read its applicable conventions and inspect existing work and `.agentscli/config.yml` before the client operation. The SGO update is a target-client delivery operation requiring the permissions applicable there, not authorization to edit its application from this repository.
5. Run the installed command against the explicit SGO root: `validate`, `sync --dry-run`, authorized `sync`, then `sync --check`. The expected writes are the three managed agentscli trees. If preview includes unexpected generated-document changes or a conflict, resolve the scope before applying; do not invent a skill-only flag or bypass the planner by hand-copying files.
6. Confirm the installed version, managed skill contents, clean freshness result, and preservation of SGO-owned/OpenSpec skills, authored templates, and unrelated work. No SGO commit or application build is implied. Completion requires publication, global update, and client refresh actually verified; unfinished delivery remains open.

Published identities are immutable: correct a published defect with a new patch. For partial client operations, inspect completed/remaining effects and retry the same supported operation/options. Do not add rollback journals, overwrite tags, or reset either checkout.
