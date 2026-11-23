---
name: agentscli-hub-write-conventions
description: "Create, review, and maintain the hub project's handwritten internal conventions. Use for rules governing work in this hub; shared resource templates have their own author."
license: MIT
compatibility: Requires Node.js >= 22.
---

# Internal conventions

Edit only the handwritten English Markdown under `docs/conventions/`. Do not edit shared resources, root AGENTS.md, operational skills, or a consumer project. Discover the applicable internal conventions through this hub's instructions before editing.

Keep each convention self-contained: no requires declarations and no direct links to other conventions or any skill, including their directories and support files. Put procedures that activate a skill in that skill, rather than routing readers from a convention. Ordinary project-file links and self-fragments remain valid. Keep exactly one H1 outside examples and match its ASCII kebab-case slug to the filename.

Run this skill's own [scripts/validate.mjs](scripts/validate.mjs) before and after the edit:

```sh
node <this-skill>/scripts/validate.mjs --repo-root <hub>
```

Resolve `<this-skill>` from this skill's actual directory and `<hub>` from the active project root. This is read-only validation. Fix all mechanical diagnostics, then review meaning, activation, and scope. Report changed files and actual checks; do not generate, import, commit, or publish implicitly.
