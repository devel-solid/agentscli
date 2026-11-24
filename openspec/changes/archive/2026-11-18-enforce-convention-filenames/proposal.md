# Proposal

## Why

Convention filenames and displayed titles can drift because the planner derives paths from the source name while the renderer uses the H1 for discovery. A canonical filename makes a convention easier to find and gives authors a check before generation.

## What Changes

- **BREAKING**: Reject a convention template whose filename does not match the normalized H1, including in sync previews and migration. Report the source and expected filename before any writes.
- Align the English and Portuguese starter templates, shared authoring guidance, and client upgrade instructions.
- Release the breaking beta version of `@devel-solid/agentscli` and update the installed local CLI from the published package.

## Capabilities

### New Capabilities

### Modified Capabilities

- `convention-authoring`: Require a canonical filename when authoring or renaming conventions.
- `project-instruction-workflows`: Specify canonical filenames, pre-write rejection, locale-specific starter paths, and how the rule applies to legacy migration.

## Impact

- Shared input validation, bundled client resources, skills, README, and unit tests.
- Clients with divergent filenames must align their authored templates and references before syncing with the new CLI.
