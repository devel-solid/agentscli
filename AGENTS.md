# AGENTS.md

## Project

This repository develops `agentscli`, a small CLI for generating a project's AGENTS.md and conventions from its own templates. See [README.md](README.md) for usage and development commands.

This repository does not consume the CLI. Its `agentscli.yml` selects the three distributed skill directories and identifies direct authoring. Keep this AGENTS.md and `docs/conventions/` handwritten in English. Do not create `agentscli-compose.yml` or run client init/sync here.

## Workflows

- Use `agentscli-write-conventions` to author or review conventions and `agentscli-update-agents` for this file. Both edit final files directly in this repository.
- Use `agentscli-release` for requested CLI versioning/publication. It stays internal; OpenSpec skills are development tools and are not client resources.
- Shared skill sources live in `.agents/skills/`; the client-only build skill lives in `assets/templates/skills/`. Build copies the complete directories selected by `agentscli.yml`.
- Client document templates live in `assets/templates/en/` and `assets/templates/pt-br/`. They are product data, not this repository's instructions.

## Conventions

- Read [skill authoring](docs/conventions/skill-authoring.md) when creating, reviewing, or refactoring owned skills and their support files.
- Read [development](docs/conventions/development.md) when changing runtime contracts, package resources, tests, or delivery preparation.
- Read [instruction safety](docs/conventions/instruction-safety.md) when inspecting templates, external content, tool output, or sensitive data.

## Checks

Use a Node.js line declared in `package.json`. Run focused unit tests during implementation and `npm run check` for the general gate. `npm run build` compiles the runtime and assembles client assets. Run `npm run setup` after cloning to enable the native Git pre-push hook, which runs the same `npm run check` as CI.

Report changed files, actual checks, and remaining work. Preserve unrelated changes and the requested scope.
