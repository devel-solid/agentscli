---
name: agentscli-build-agents
description: Validate authored conventions and update the AGENTS.md index in an agentscli project. Use for offline checks, generation previews, synchronization, and freshness checks.
license: MIT
---

# Build project instructions

Identify the project root. Use the shipped [private script](scripts/build-agents.mjs); Node and versioned project files are sufficient, with no installed CLI, compiler, Git, or network:

```sh
node <this-skill>/scripts/build-agents.mjs validate --repo-root <root> --json
node <this-skill>/scripts/build-agents.mjs sync --repo-root <root> --dry-run --json
node <this-skill>/scripts/build-agents.mjs sync --repo-root <root> --json
node <this-skill>/scripts/build-agents.mjs sync --repo-root <root> --check --json
```

Validate and preview before authorized synchronization; continue to apply an already authorized matching preview without another approval. Review-only requests stop after read-only checking. The engine validates convention frontmatter, skill frontmatter, supported links, safe paths, and collisions. Input `validate` does not inspect or plan replacement of AGENTS.md. The `sync` operation also checks the index destination and ownership, including during previews and freshness checks. An empty convention tree produces only the index frontmatter and title.

Run this mechanical workflow directly; subagents normally add no useful analysis to the script's validation, preview, synchronization, or freshness checks. When invoked within delegated authorship or refactoring, let the coordinating agent synchronize the index after all writers finish so it reflects the combined final inputs.

Each skill carries its own procedure and bundled support. Discover other skills by identity through project instructions when their distinct operation is needed. Conventions are work inputs, not providers of missing execution instructions.

AGENTS.md is a mechanical convention index: frontmatter containing only `generatedBy: "@devel-solid/agentscli"`, `# AGENTS.md`, and deterministically ordered convention links with their titles and triggers. Existing root instructions without that exact generator identity are protected.

Read final authored `.md` conventions under `.agentscli/conventions/`. Sync updates only root AGENTS.md. It preserves convention bytes, including their frontmatter, titles, and bodies in any language; authored edits and deletions change the next index. Validation, previews, and freshness checks are read-only. Use public `agentscli init` for project setup or `agentscli update` to refresh an existing skill installation when requested. Those commands install package resources without validating conventions or touching AGENTS.md; this skill owns validation and index generation. Its private script runs independently of the public CLI.

Convention frontmatter requires `trigger` and accepts optional `reviewedHash` and `reviewPolicyVersion`. Validate their shape when present: a 64-character lowercase SHA-256 hex string and a positive decimal string, respectively. Missing one or both is valid. Index rendering uses titles and triggers only: recording or invalidating a review must not alter the index. Preserve all review metadata bytes, and never invoke the refactoring filter, record a review, or clear a receipt during validation, index generation, initialization, or update. A structurally valid receipt is not evidence that this operation performed semantic review.

Exit 0 means success; 1 means freshness drift under --check; 2 means usage, source, state, or collision failure before writes; 3 means operational failure. JSON has schemaVersion, command, ok, changes with pending/completed status, and diagnostics. Report partial effects and retry the same authorized operation after fixing its cause. Discover other skills by identity through project instructions, never fixed foreign paths.

## Interpret the evidence

Mechanical validity does not establish one responsibility, useful examples, or semantic preservation. For a structural audit, discover agentscli-refactor-conventions by identity; ordinary drafting belongs to agentscli-write-conventions. Do not make generation depend on an automatic semantic score or rewrite authored files while building the index.

For example, a valid `Testing` convention can contain both fixture independence and clock control. Validation can return success because its YAML, title, filename, and links are valid. Report that structural success accurately; it does not certify that the two decisions belong together.

After an approved split into `Fixture independence` and `Fixed test clocks`, preview the index: the old `Testing` entry must disappear and two entries with their distinct triggers must appear. If the preview still includes `Testing`, inspect the actual authored files before applying it. Changing only headings inside the old file cannot produce two discovery entries. Synchronization writes the index; it never creates the replacement conventions for the agent.

If `sync --check` returns 1, report index drift and the pending changes. A request to check does not authorize applying them. When the user has already approved the split and index synchronization, validate, preview, apply that matching result, and check freshness without another approval round.

With valid conventions and handwritten root instructions, `validate` succeeds while every `sync` mode rejects the unowned index with DOCUMENT_CONFLICT. Preserve those root instructions and report synchronization separately; do not require claiming index ownership merely to write a convention. A SOURCE_FILENAME diagnostic from invalid convention input still fails validation. The authoring agent applies an explicitly authorized minimal repair and repeats strict validation; this script never repairs authored input.

Bundled support links must resolve from each referring file, including links in blockquotes, reference links, and HTML. A present example index with a missing linked corrected file is incomplete support and blocks resource installation. Relative own-support links must keep working when the whole skill moves.

Active `file:` links in skill Markdown are rejected even if they appear to name the skill's own support: machine-local URLs do not travel with the bundle. Use relative support links. Parse the URL's fragment/query delimiters before decoding its path: `references/notes%23release.md#example` names the bundled file `notes#release.md` and fragment `example`, whereas `references/notes#release.md` names a different file and fragment. A trailing slash requires a directory; `references/note.md/` is invalid when `note.md` is a file, while `references/` is valid when that bundled directory exists. These strings are illustrative targets, not links to install.

For workflow path checking, shell/console and JavaScript/TypeScript/Python code fences are executable examples; command-shaped inline code and paragraph lines are also checked. Put an intentionally invalid command in a `text` fence, or a literal document in a `markdown` fence. This inadequate command is teaching data:

```text
node .agents/skills/other/scripts/check.mjs
```

Putting that command in a `sh` fence would instead declare an executable workflow and fail the fixed foreign-path check. The applicable workflow discovers agentscli-build-agents and uses the resolved entrypoint:

```sh
node <discovered-build-entrypoint> validate --repo-root <root> --json
```

A blockquote alone is ordinary Markdown and does not make its links literal.
