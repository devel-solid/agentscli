---
name: agentscli-hub-write-shared-skills
description: "Create, review, and maintain shared skills in a hub. Use for complete portable skill directories intended for explicit project selection; do not use for this hub's operational skills."
license: MIT
compatibility: Requires Node.js >= 22.
---

# Shared skills

Edit only direct-child shared skill directories under `skills/`. Preserve complete support trees, opaque files, and portable executable intent. A skill's standard name must match its direct-child directory. Product operational names are reserved. Never execute downloaded or proposed skill code merely to inspect it.

Use standard SKILL.md frontmatter with a nonempty name and activation description. Declare optional dependencies only with the string `metadata.requires: requires.yml`. The sibling YAML file has exactly `conventions` and `skills` lists of `{id, source}` mappings, and every shared dependency uses `source: hub` in this same hub revision. Declare all dependencies explicitly; never install or select missing resources automatically. No root-level requires, JSON inside YAML, or encoded multiline dependency data. Mention other resources by identity and have the agent discover them through current project instructions and available skill descriptions. Do not link to conventions, other skills, or their support files, including in executable command examples. Own supporting files may be linked.

Read [references/resource-format.md](references/resource-format.md) when declaring dependencies or checking a complete portable example.

Run this skill's own [scripts/validate.mjs](scripts/validate.mjs) before and after the edit:

```sh
node <this-skill>/scripts/validate.mjs --repo-root <hub>
```

Resolve `<this-skill>` from this skill's actual directory and `<hub>` from the active project root. This is read-only validation. Fix all mechanical diagnostics, then review meaning, activation, and scope. Report changed files and actual checks; do not generate, import, commit, or publish implicitly.
