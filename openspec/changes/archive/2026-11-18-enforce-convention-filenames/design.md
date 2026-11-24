# Design

## Context

The planner maps conventional source paths to generated paths, and the Markdown parser extracts the H1 used as the discovery label. Legacy migration renders both the previous and proposed documents for conflict detection. The current package is 0.2.0 and ships `project.tpl.md` for both languages.

## Goals / Non-Goals

**Goals:** Use one deterministic filename rule in all client modes, fail before writes, ship conforming defaults, and document the beta upgrade.

**Non-Goals:** Automatic renames during ordinary sync, changes to the language-only configuration, or rewrites of client-specific references by the CLI.

## Decisions

- Derive the basename from the existing parsed H1. Apply NFKD, drop combining marks, lowercase the ASCII letters, replace runs outside `[a-z0-9]` with `-`, and trim separators. Compare the exact basename before `.tpl.md`. Folders are preserved. Dots in a basename become separators in the suggested name. Keep the original H1 for display.
- Run the check in the shared preflight used by init, validate, sync, check, and previews. Return an English diagnostic in text and JSON. Include the source path and expected name, or explain why a title produces no usable basename. Keep path safety and destination collision checks.
- Apply strict validation to the proposed fixed-layout sources during explicit migration. Preserve the old rendering used to recognize existing generated files. If legacy sources fail the new rule, report the source to correct and give a write-free upgrade path. Review the existing rebase rules for managed references as part of migration verification.
- Rename the English and Portuguese context assets and update the authoring guidance, client build guidance, examples, and unit fixtures. Do not recreate a removed convention during repeated init.
- Prepare `0.3.0` as the candidate for the breaking beta release, subject to verifying unused npm and Git identities. Package and verify the exact release before publication through `agentscli-release`. Update the active local installation from the verified publication using its existing npm scope and confirm the resolved executable and version. Keep consumer-specific migration outside this repository.

## Risks / Trade-offs

Existing clients and migration candidates with mismatches will fail immediately by design. Document how to rename authored inputs and update links before syncing. Tests should cover unchanged inputs on rejection, successful nested paths, Unicode normalization, blank slugs, portable collisions, both locale defaults, and valid and invalid legacy migrations.
