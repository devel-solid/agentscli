---
name: agentscli-adm-write-conventions
description: Create, review, and maintain this tool monorepo's handwritten conventions. Use for internal convention work, never consumer templates.
---

# Maintain monorepo conventions

Run `node scripts/check.mjs --repo-root <root>` from this skill's discovered directory before editing and after changes. Its own checker verifies the real private tool workspaces, handwritten format, canonical filenames, and forbidden resource links. Missing configuration alone never grants this context.

Discover conventions through the root AGENTS Conventions section, confirm their subject, and keep their English handwritten format. Edit only conventions within the request. For a new or moved file not yet in discovery, pass `--file <project-relative-file>` to the post-edit checker as well; optional prose cannot exempt a convention from validation. AGENTS discovery belongs to agentscli-adm-edit-agents, located through project skill discovery.

Make each convention self-contained. Do not add links to other conventions or skills, or instructions invoking a skill. Route misplaced procedures through the separately scoped responsible skill author, preserving needed behavior rather than duplicating workflows in policy.

Keep one H1 and its matching ASCII lowercase kebab-case filename. The checker applies NFKD, removes combining marks, and collapses non-alphanumeric runs to hyphens. Ordinary project-file links and same-document anchors remain allowed; other convention/skill targets, including support files, are rejected. Examples do not declare operational rules.

Review applicability, contradictions, useful examples, exceptions, and unverified facts separately from mechanical evidence. Review-only requests write nothing. Report changed conventions, actual checks, and unresolved issues. Do not initialize clients, generate documents, or publish resources.
