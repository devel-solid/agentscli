---
name: agentscli-build-agents
description: Validate or regenerate AGENTS.md and convention outputs in an existing agentscli consumer. Use for offline checks, generation previews, synchronization, and freshness checks.
license: MIT
compatibility: Requires Node.js >= 22.
---

# Build project instructions

Identify the consumer root. Use the shipped [private script](scripts/build-agents.mjs); Node and versioned project files are sufficient, with no installed CLI, compiler, Git, or network:

```sh
node <this-skill>/scripts/build-agents.mjs validate --repo-root <root> --json
node <this-skill>/scripts/build-agents.mjs sync --repo-root <root> --dry-run --json
node <this-skill>/scripts/build-agents.mjs sync --repo-root <root> --json
node <this-skill>/scripts/build-agents.mjs sync --repo-root <root> --check --json
```

Validate and preview before authorized synchronization; continue to apply an already authorized matching preview without another approval. Review-only requests stop after read-only checking. The same deterministic engine validates strict config, trigger-only conventions, skill requirements, supported links, safe paths, dependencies, collisions, and resulting files.

Skills use optional `metadata.agentscli: agentscli-skill.yml` for their own general configuration. Its `requires` list contains only skill references with `id` and `source: local`, never conventions. Validate the complete available local skill graph without installing dependencies. Reject the former pointer/file and unsupported structure without converting authored sources. Each skill carries its own procedure and bundled support; configuration and templates are work inputs, not providers of missing execution instructions.

Authored templates and configuration are protected. Sync replaces generated documents, removes stale managed outputs, and keeps authored bodies/languages literal. It does not restore package operational assets; use the public `agentscli apply` only when setup/refresh is requested. Never change language, migrate, or reset protected trees implicitly. The one public apply command uses its own installed package engine; this private script never wraps it.

Exit 0 means success; 1 means freshness drift under --check; 2 means usage, source, state, or collision failure before writes; 3 means operational failure. JSON has schemaVersion, command, ok, changes with pending/completed status, and diagnostics. Report partial effects and retry the same authorized operation after fixing its cause; there is no rollback. Legacy input requires explicit `agentscli apply --migrate` preview/application. Discover other skills by identity through project instructions, never fixed foreign paths.
