---
name: agentscli-build-agents
description: Validate authored conventions and update the AGENTS.md index in an
  agentscli project. Use for offline checks, generation previews,
  synchronization, and freshness checks.
license: MIT
metadata:
  generatedBy: "@devel-solid/agentscli"
  generatorVersion: 0.7.1
---

# Build project instructions

Identify the project root. Use the shipped [private script](scripts/build-agents.mjs); Node and versioned project files are sufficient, with no installed CLI, compiler, Git, or network:

```sh
node <this-skill>/scripts/build-agents.mjs validate --repo-root <root> --json
node <this-skill>/scripts/build-agents.mjs sync --repo-root <root> --dry-run --json
node <this-skill>/scripts/build-agents.mjs sync --repo-root <root> --json
node <this-skill>/scripts/build-agents.mjs sync --repo-root <root> --check --json
```

Validate and preview before authorized synchronization; continue to apply an already authorized matching preview without another approval. Review-only requests stop after read-only checking. The same deterministic engine validates convention frontmatter, skill frontmatter, supported links, safe paths, collisions, and resulting files. An empty convention tree produces only the index frontmatter and title.

Each skill carries its own procedure and bundled support. Discover other skills by identity through project instructions when their distinct operation is needed. Conventions are work inputs, not providers of missing execution instructions.

AGENTS.md is a mechanical convention index: frontmatter containing only `generatedBy: "@devel-solid/agentscli"`, `# AGENTS.md`, and deterministically ordered convention links with their titles and triggers. Existing root instructions without that exact generator identity are protected.

Read final authored `.md` conventions under `.agentscli/conventions/`. Sync updates only root AGENTS.md. It preserves convention bytes, including their frontmatter, titles, and bodies in any language; authored edits and deletions change the next index. Validation, previews, and freshness checks are read-only. Use public `agentscli init` for project setup or `agentscli update` to refresh an existing skill installation when requested. Those commands install package resources without validating conventions or touching AGENTS.md; this skill owns validation and index generation. Its private script runs independently of the public CLI.

Exit 0 means success; 1 means freshness drift under --check; 2 means usage, source, state, or collision failure before writes; 3 means operational failure. JSON has schemaVersion, command, ok, changes with pending/completed status, and diagnostics. Report partial effects and retry the same authorized operation after fixing its cause. Discover other skills by identity through project instructions, never fixed foreign paths.
