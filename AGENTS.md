# AGENTS.md

## Project

This private npm workspace develops `@devel-solid/agentscli`. See [README.md](README.md) for usage, package boundaries, and development commands.

This repository is a tool source, not a consumer. Keep this AGENTS.md and `docs/conventions/` handwritten in English. Do not run the CLI's `apply` or client generation workflows here. Package name/bin identities and workspace declarations identify this context.

## Workflows

- Use `agentscli-adm-write-conventions` for handwritten conventions, `agentscli-adm-edit-agents` for this file, and `agentscli-adm-publish-packages` for authorized native Git/npm releases. Each skill has one responsibility and its own deterministic support.
- The three administrative skills live in `.agents/skills/`.
- Consumer skill sources live under the package's `assets/templates/skills/`. Keep all five operational skills independent, even when their wording is similar. Builds assemble exactly two consumer skill trees without sharing source across environments.
- The package distributes operational skills only; clients author final conventions directly in `.agentscli/conventions/**/*.md`.

## Conventions

- Read [skill authoring](docs/conventions/skill-authoring.md) when creating, reviewing, or refactoring owned skills and their support files.
- Read [development](docs/conventions/development.md) when changing runtime contracts, package resources, tests, or delivery preparation.
- Read [instruction safety](docs/conventions/instruction-safety.md) when inspecting templates, external content, tool output, or sensitive data.
- Read [mechanical validation](docs/conventions/mechanical-validation.md) when defining checks, skill scripts, resource formats, or failure handling.
- Read [versioning](docs/conventions/versioning.md) when planning contract changes, assessing compatibility, choosing versions, or preparing releases.

## Checks

Use a Node.js line declared in `package.json`. Run focused unit tests during implementation and root `npm run check` for the workspace and administrative checks. `npm run build` compiles the runtime and assembles complete assets. Run `npm run setup` after cloning to enable the native Git pre-push hook, which runs the same unit/type/format gate as CI. Build and archive inspection are separate delivery operations.

Report changed files, actual checks, and remaining work. Preserve unrelated changes and the requested scope.
