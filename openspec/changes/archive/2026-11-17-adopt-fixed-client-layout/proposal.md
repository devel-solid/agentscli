# Proposal

## Why

Client templates currently occupy a generic directory, generated conventions live under documentation, and a client manifest maps both roots. A dedicated fixed layout makes ownership and editing surfaces predictable, but changing initialization, discovery, language persistence, skills, and existing clients requires an explicit contract migration rather than a path hotfix.

## What Changes

- **BREAKING** Replace the client `agentscli-compose.yml` contract with `.agentscli/config.yml`, containing exactly `language: en` or `language: pt-br`. Remove client directory mappings without adding equivalent flags.
- **BREAKING** Fix the main source at `.agentscli/templates/AGENTS.tpl.md`, convention sources at `.agentscli/templates/conventions/**/*.tpl.md`, and generated conventions at `.agentscli/conventions/**/*.md`. Keep generated `AGENTS.md` at the project root and the three distributed skills under `.agents/skills/`.
- Discover convention sources only in the expected subtree and map paths relative to that subtree, preserving nesting without adding another `conventions` segment. Retain independent conventions, discovery cards, structural validation, localized source notices, and relative AGENTS links.
- Make repeated initialization preserve the stored language and authored content. Explicit `--lang` changes the preference without translating or replacing existing text; missing resources use the selected language.
- Add explicit `init --migrate [--lang en|pt-br] [--dry-run]`, reusing the existing plan/effect mechanism. Read legacy roots only for migration, preflight all conflicts, preserve content, adjust managed links and notices, prepare the new tree before cleanup, and remove the old manifest last. Ordinary operations reject unfinished legacy contexts rather than supporting two generation contracts.
- Update both shared authoring skills and the client build skill to discover the fixed client context while retaining direct handwritten authorship through the internal `agentscli.yml`.
- Document that clients version all of `.agentscli/`, including sources and generated files. Preserve write-free previews/checks, safe-path checks, manual-document protection, bounded cleanup, and partial-effect reporting with retry.

## Capabilities

### New Capabilities

None. Migration extends the existing instruction workflow.

### Modified Capabilities

- `agents-cli`: fixed-layout initialization/validation, the explicit migration option, unchanged operation names and result semantics, and migration-aware recovery guidance.
- `project-instruction-workflows`: language-only configuration, fixed discovery and output roots, non-destructive initialization, explicit resumable migration, source notices, cleanup boundaries, and source-repository isolation.
- `convention-authoring`: fixed client authoring targets, configuration-based context discovery in all three distributed skills, and explicit legacy-context diagnostics.

## Impact

Implementation affects `src/manifest.ts`, `src/plan.ts`, `src/runtime.ts`, `src/cli.ts`, related renderer/Markdown/path/IO helpers, and lightweight units in `tests/unit/`. Existing YAML/Markdown dependencies and the injected `FileSystem` boundary are sufficient; client execution remains Node-only and offline.

Move the default context template into `conventions/` in both `assets/templates/en/` and `assets/templates/pt-br/`. Update the canonical two shared skills, the client-only build skill, CLI help, README, and resource-packaging units; continue deriving compiled assets from their current canonical sources.

This change intentionally supersedes the current client-manifest, configuration-replacement, and whole-template-root discovery requirements through deltas for the three capabilities above. Keep `release-publication`, archived changes, the internal distribution manifest, and this repository's handwritten instructions unchanged. Modifying or migrating consumer projects is outside this change's execution scope.

Creating this proposal changes planning artifacts only. Later implementation requires a separate request. Package version selection, version changes, installation, commits, tags, pushes, and publication are separate authorized work; no release is performed or required to finish these planning artifacts.
