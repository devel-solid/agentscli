---
name: agentscli-build-agents
description: Validate or regenerate AGENTS.md and convention outputs in an existing agentscli consumer. Use for offline checks, generation previews, synchronization, and freshness checks.
license: MIT
---

# Build project instructions

Identify the consumer root. Use the shipped [private script](scripts/build-agents.mjs); Node and versioned project files are sufficient, with no installed CLI, compiler, Git, or network:

```sh
node <this-skill>/scripts/build-agents.mjs validate --repo-root <root> --json
node <this-skill>/scripts/build-agents.mjs sync --repo-root <root> --dry-run --json
node <this-skill>/scripts/build-agents.mjs sync --repo-root <root> --json
node <this-skill>/scripts/build-agents.mjs sync --repo-root <root> --check --json
```

Validate and preview before authorized synchronization; continue to apply an already authorized matching preview without another approval. Review-only requests stop after read-only checking. The same deterministic engine validates trigger-only conventions, skill frontmatter, supported links, safe paths, collisions, and resulting files. No client configuration is required; an empty convention tree produces only the index frontmatter and title.

Each skill carries its own procedure and bundled support. Discover other skills by identity through project instructions when their distinct operation is needed. Templates are work inputs, not providers of missing execution instructions.

AGENTS.md is a mechanical convention index: fixed `generatedBy: "@devel-solid/agentscli"` frontmatter, `# AGENTS.md`, and convention links with their titles and triggers. It has no authored template or additional prose. Existing root instructions without that exact generator identity are protected.

Authored convention templates are protected. Sync replaces generated documents, removes stale managed outputs, and preserves authored titles, triggers, and bodies in any language. Generated conventions retain only the technical ownership marker before their bodies. It does not restore package operational assets; use the public `agentscli apply` only when setup/refresh is requested. Never rewrite or reset protected trees implicitly. The one public apply command uses its own installed package engine; this private script never wraps it.

Exit 0 means success; 1 means freshness drift under --check; 2 means usage, source, state, or collision failure before writes; 3 means operational failure. JSON has schemaVersion, command, ok, changes with pending/completed status, and diagnostics. Report partial effects and retry the same authorized operation after fixing its cause; there is no rollback. Discover other skills by identity through project instructions, never fixed foreign paths.
