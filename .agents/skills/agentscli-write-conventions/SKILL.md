---
name: agentscli-write-conventions
description: Create, review, or update authored convention files in an agentscli
  project. Use for project rules, trigger text, self-contained guidance, and
  convention naming.
license: MIT
metadata:
  generatedBy: "@devel-solid/agentscli"
  generatorVersion: 0.6.0
---

# Maintain project conventions

Identify the project root from the request and project instructions. Run the read-only [checker](scripts/check.mjs) before edits: `node <this-skill>/scripts/check.mjs --repo-root <root>`. A nonzero result blocks authorship until the reported input issue is resolved; do not initialize, generate, or repair beyond the request.

Use the language requested by the user or already used in the project's relevant content. Write the final convention files directly under `.agentscli/conventions/`, including subdirectories when useful; if none exist, create the first convention there within the request. These files are authored content: apply, synchronization, and checking preserve their bytes.

Each convention starts with YAML containing only nonempty string `trigger`, followed by one H1 outside examples and its body. Derive its `.md` basename from the H1: normalize with NFKD, remove combining marks, lowercase, collapse runs other than Unicode letters or numbers to hyphens, trim outer hyphens, then normalize to NFC. For example, `日本語` becomes `日本語.md`. Keep the trigger short and precise about when to read the rule. Keep the body self-contained: no links to conventions or skill entrypoints, directories, or support files. Ordinary non-resource links and own fragments are allowed. Trigger links resolve from root AGENTS; body links resolve from the convention's actual location. Skills have their own activation description: move misplaced procedural content only through a separately authorized skill-authoring request.

After edits rerun the checker. Review usefulness, contradictory rules, and scope semantically; scripts prove only mechanically decidable checks. For an authorized index update, mention agentscli-build-agents and discover its actual project location through project skills; do not assume its path. Authorship alone does not authorize generation. Report edited conventions and actual validation.

Use verified project facts within the authorized convention. When an authorized title change requires a canonical filename rename, update references within this skill's target scope; the convention index is rebuilt mechanically during authorized generation.
