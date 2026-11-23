---
name: agentscli-hub-write-shared-skills
description: "Create, review, and maintain shared skills in a hub. Use for complete portable skill directories intended for explicit project selection; do not use for this hub's operational skills."
license: MIT
compatibility: Requires Node.js >= 22.
---

# Shared skills

Edit only direct-child shared skill directories under `skills/`. Preserve complete support trees, opaque files, and portable executable intent. A skill's standard name must match its direct-child directory. Product operational names are reserved. Never execute downloaded or proposed skill code merely to inspect it.

Use standard SKILL.md frontmatter with a nonempty name and activation description. Optional general configuration uses the string `metadata.agentscli: agentscli-skill.yml` and one regular sibling YAML mapping. Its only current section is optional `requires`, a list of `id` and `source` mappings referring exclusively to skills. Every shared dependency uses `source: hub` in this same hub revision. A skill without configuration needs no extra file. A declared file must exist; an unreferenced reserved configuration file, old requires.yml, obsolete metadata.requires, unknown sections, or encoded structured data are rejected. Do not add speculative sections or a separate file for another purpose.

Declare required skills explicitly; never install or select missing resources automatically. Keep every instruction needed for this skill's own operation in its SKILL.md or bundled support. Conventions cannot supply a missing procedure or satisfy a dependency. Project files may still be work inputs, and another declared skill may own a distinct operation. Mention required skills by identity and have the agent discover them through current project instructions and available skill descriptions. Do not link to conventions, other skills, or their support files, including in executable command examples. Own supporting files may be linked.

Read [references/resource-format.md](references/resource-format.md) when declaring dependencies or checking a complete portable example.

Run this skill's own [scripts/validate.mjs](scripts/validate.mjs) before and after the edit:

```sh
node <this-skill>/scripts/validate.mjs --repo-root <hub>
```

Resolve `<this-skill>` from this skill's actual directory and `<hub>` from the active project root. This is read-only validation. Fix all mechanical diagnostics, then review meaning, activation, and scope. Report changed files and actual checks; do not generate, import, commit, or publish implicitly.
