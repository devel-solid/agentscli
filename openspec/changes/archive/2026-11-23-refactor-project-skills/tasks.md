# Tasks

## 1. Establish repository skill-authoring guidance

- [x] 1.1 Use `agentscli-write-conventions` to create handwritten English `docs/conventions/skill-authoring.md` from the SGO convention; verify preservation of its substantive rules and five positive/negative example pairs, valid local references, the fixed-contract exception, and absence of generated framing, external links, or bibliography.
- [x] 1.2 Use `agentscli-update-agents` to add the convention's discovery entry to handwritten `AGENTS.md`; verify the trigger covers creating, reviewing, and refactoring owned skills and supports, the link resolves, and the entrypoint does not duplicate the convention.

## 2. Refactor the four canonical skills

- [x] 2.1 Use `skill-creator` to condense `agentscli-write-conventions`; verify its frontmatter and representative direct/client authorship, context rejection, semantic curation, canonical filename, card, fill-in comment, and generated-link-base decisions against the previous source.
- [x] 2.2 Condense `agentscli-update-agents`; verify its frontmatter and context selection, concise entrypoint role, fill-in replacement, insertion marker, authored links, language, and review-only boundaries against the previous source.
- [x] 2.3 Condense `agentscli-build-agents`; verify its frontmatter and requested-operation sequence, legacy/internal-context rejection, installed-CLI use, managed-tree restoration, manual-file protection, bounded cleanup, and operation-specific failure retry guidance against the previous source.
- [x] 2.4 Refactor `agentscli-release` around current metadata, refs, registry, and authorization; verify its frontmatter, subsequent-release decisions, artifact checks, immutable identities, and delivery verification remain complete without first-release chronology or repeated rename instructions.
- [x] 2.5 Compare the four complete skill trees and ordinary reading paths against the baseline of 2,665 words; verify actual aggregate reduction without moving redundant paragraphs elsewhere, working resource links and descriptions, and independent usability of the three distributed skills. Run the available skill-format validator and use `review` to check the representative scope, context, discovery, contract, and partial-failure cases in the design; resolve concrete regressions before release preparation.

## 3. Prepare the patch candidate

- [x] 3.1 Use `agentscli-release` to refresh package/lockfile metadata, Git refs, remote, registry versions, and applicable execution authorization; select an unused patch version and `agentscli-v<version>` tag, tentatively `0.3.1`, and verify the selection preserves all published identities and the current repository destination.
- [x] 3.2 Update package/lockfile versions and the README version statement without changing dependencies; verify those identities agree and the diff contains only the planned source, documentation, planning, and version changes.
- [x] 3.3 Run the existing relevant units as needed and `npm run check`, then build and inspect both `npm pack --dry-run --json` and the actual candidate archive; verify the compiled runtime, both locales, three complete client skill trees, executable, license, and metadata are present, internal resources are excluded, and record the candidate's source identity and SHA-512 integrity.
- [x] 3.4 Check native Git/npm authentication and destination permissions without exposing credentials; verify the final candidate, tag, remote, registry destination, and authorized effects are concrete and ready, leaving any unavailable permission or account action explicitly pending.

## 4. Publish and update the existing local installation

- [x] 4.1 Within the execution authorization, create the reviewed source commit and unused tag and push those exact refs; verify the public commit/tag match the intended source and reconcile/reinspect the candidate if its source changed after preparation.
- [x] 4.2 Publish the inspected tarball through native npm with public access; verify public package/version, visibility, license, and `dist.integrity` against the candidate, checking remote state before retrying any ambiguous response.
- [x] 4.3 Update the existing global `@devel-solid/agentscli` installation to the exact verified published version; verify the resolved executable, `agentscli --version`, and global package metadata agree, without creating an installation test environment.

## 5. Refresh the SGO Prototype client

- [x] 5.1 Discover the intended SGO checkout, read its current instructions and applicable conventions, and inspect existing work, configuration, and managed skills using the target's available permissions; run the updated installed CLI's `validate` and `sync --dry-run` against that explicit root and verify the expected effects concern only the three managed agentscli trees. Resolve unexpected document drift or conflicts within scope before applying.
- [x] 5.2 Apply the previewed update with the installed CLI's `sync` and run `sync --check` against the same SGO root; verify freshness and that the managed skill contents match the newly published package, reporting completed and remaining effects if the operation fails.
- [x] 5.3 Inspect the target diff and report the actual source commit/tag, package/version/integrity, global executable version, managed-skill effects, and executed checks; verify SGO-owned skills, OpenSpec skills, authored templates, and unrelated work were preserved, and keep delivery tasks open for any unverified publication, installation, or client update.
