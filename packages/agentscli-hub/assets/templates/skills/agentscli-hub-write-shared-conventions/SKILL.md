---
name: agentscli-hub-write-shared-conventions
description: 'Create, review, and maintain shared convention templates in a hub. Use for portable conventions intended for explicit consumption by other projects; internal hub rules have their own author.'
license: MIT
compatibility: Requires Node.js >= 22.
---

# Shared conventions

Edit only shared `shared/conventions/**/*.tpl.md` templates. Their ID is the relative path below the sharing root without `.tpl.md`. Do not edit internal conventions, operational skills, consumer output, or publication state.

Start each template with YAML containing only one nonempty string `trigger`, followed by exactly one H1 outside examples. The filename must match the H1's ASCII kebab-case slug. Preserve authored Markdown and examples. Conventions cannot declare requires, link to other conventions, or link to skills or their support files. Make the content self-contained; procedural activation belongs in a skill. Review semantic self-containment separately from mechanical links.

Run this skill's own [scripts/validate.mjs](scripts/validate.mjs) before and after the edit:

```sh
node <this-skill>/scripts/validate.mjs --repo-root <hub>
```

Resolve `<this-skill>` from this skill's actual directory and `<hub>` from the active project root. This is read-only validation. Fix all mechanical diagnostics, then review meaning, activation, and scope. Report changed files and actual checks; do not generate, import, commit, or publish implicitly.
