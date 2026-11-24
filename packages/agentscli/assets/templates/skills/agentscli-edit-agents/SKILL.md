---
name: agentscli-edit-agents
description: Create, review, or update the project-owned AGENTS template in an existing agentscli consumer. Use for concise project orientation and convention discovery; never edit generated AGENTS output directly.
license: MIT
compatibility: Requires Node.js >= 22.
---

# Maintain client orientation

Identify the requested consumer root. Before editing run the read-only [checker](scripts/check.mjs): `node <this-skill>/scripts/check.mjs --repo-root <root>`. Resolve context/input failures without silently initializing, migrating, or generating.

Read `.agentscli/config.yml`, use its language, and edit only the project-owned `.agentscli/templates/AGENTS.tpl.md`. Preserve one H1 and exactly one full-line `<!-- agentscli:conventions -->` outside examples. The renderer replaces that marker with local convention discovery. Do not maintain a parallel catalog or place convention bodies or skill procedures here. Keep orientation short and project-specific, preserve useful unrelated content, and discover conventions through current project instructions.

Root AGENTS.md is managed and replaced by generation. Authored templates and language are protected. Do not edit managed operational skills as an authoring shortcut. Rerun the checker after edits; review relevance and clarity semantically. When generation is authorized, mention agentscli-build-agents and discover its actual entrypoint through project skill discovery. Report source edits and executable checks.

Replace applicable fill-in HTML comments only with verified project facts within the authorized source. Do not invent architecture, tools, or policy. Preserve technical contract comments. Review-only requests report unfinished fill-in guidance without editing. Keep the fixed main template filename even when its H1 changes; route convention authorship by skill identity and existing authorization.
