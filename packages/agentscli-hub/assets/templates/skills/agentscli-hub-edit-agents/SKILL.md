---
name: agentscli-hub-edit-agents
description: "Curate the hub project's root AGENTS.md instructions and resource discovery. Use when changing how agents navigate or work in this hub, without editing conventions or shared resources."
license: MIT
compatibility: Requires Node.js >= 22.
---

# Hub instructions

Edit only the handwritten English root `AGENTS.md`. Discover existing conventions and available operational skills by their purpose and identity. Preserve useful discovery links in AGENTS.md; the no-cross-resource-link rule applies to conventions and skills, not this discovery file.

Keep instructions concise and preserve the separation between internal rules and shared resources. Route internal convention work, shared convention work, shared skill work, and requested publication to their separate skills by identity. Do not embed a second copy of their procedures or run publication while editing instructions.

Run this skill's own [scripts/validate.mjs](scripts/validate.mjs) before and after the edit:

```sh
node <this-skill>/scripts/validate.mjs --repo-root <hub>
```

Resolve `<this-skill>` from this skill's actual directory and `<hub>` from the active project root. This is read-only validation. Fix all mechanical diagnostics, then review meaning, activation, and scope. Report changed files and actual checks; do not generate, import, commit, or publish implicitly.
