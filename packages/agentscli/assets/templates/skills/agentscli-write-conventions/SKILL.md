---
name: agentscli-write-conventions
description: Create, review, or update local convention templates in an existing agentscli consumer project. Use for project rules, trigger text, self-contained guidance, and convention naming; never for tool administration.
license: MIT
compatibility: Requires Node.js >= 22.
---

# Maintain client conventions

Identify the consumer root from the request and project instructions. Run the read-only [checker](scripts/check.mjs) before edits: `node <this-skill>/scripts/check.mjs --repo-root <root>`. A nonzero result blocks authorship until the reported context/input issue is resolved; do not initialize, migrate, generate, or repair beyond the request.

Read `.agentscli/config.yml` and use its language for authored text. Edit only local convention templates discovered under the configured fixed template tree. Generated output is managed; customize its authored template instead. Existing template text remains authored and is preserved by apply.

Each template starts with YAML containing only nonempty string `trigger`, followed by one H1 outside examples. Derive its `.tpl.md` basename by normalizing the H1 to ASCII lowercase kebab case. Keep the trigger short and precise about when to read the rule. Keep the body self-contained: no links to conventions or skill entrypoints, directories, or support files. Ordinary non-resource links and own fragments are allowed. Trigger links resolve from root AGENTS; body links resolve from the generated convention. Skills have their own activation description: move misplaced procedural content only through a separately authorized skill-authoring request.

After edits rerun the checker. Review usefulness, contradictory rules, and scope semantically; scripts prove only mechanically decidable checks. For authorized generation, mention agentscli-build-agents and discover its actual project location through project skills; do not assume its path. Authorship alone does not authorize generation. Report edited sources and actual validation.

Replace applicable fill-in HTML comments only with verified project facts within the authorized source. Do not invent architecture, tools, or policy. Preserve technical contract comments. Review-only requests report unfinished fill-in guidance without editing. When an authorized title change requires a canonical filename rename, update references within this skill's target scope; the convention index is rebuilt mechanically during authorized generation.
