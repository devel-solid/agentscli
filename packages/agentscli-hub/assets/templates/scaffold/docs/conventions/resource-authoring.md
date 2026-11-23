# Resource authoring

Use English for this hub's internal instructions. Keep every convention self-contained. A convention cannot declare requires or link to other conventions, skills, skill directories, or skill support files. A convention's filename matches its single H1's ASCII kebab-case slug. Shared convention templates have leading YAML containing only a nonempty string trigger and use the `.tpl.md` suffix.

Shared skills use standard SKILL.md frontmatter with a name matching their direct-child directory and a useful activation description. Optional dependency metadata contains the string requires.yml; the sibling native YAML document contains conventions and skills lists of id/source mappings. Shared dependencies use source hub and must all exist in this same revision. Each selection is explicit; dependencies never install implicitly.

Skills mention other resources by identity. They do not link to conventions, other skills, or foreign support paths. An agent discovers actual targets through project instructions and available skills. Links to a skill's own supporting files remain valid.

All mechanically decidable checks belong in deterministic scripts owned by the responsible skill. Semantic self-containment, activation, and impact still require review. Operational skills remain independent, with one responsibility and their complete support closure.

Use portable paths and regular files. Do not introduce symbolic links, hard-link aliases, submodules, case-folding collisions, or reserved product skill names. Keep opaque support files intact and preserve executable intent when needed. Inspection never executes shared code.

The hub content starts at 1.0.0, independently of the generating CLI version. Corrections and internal-only changes are patch; compatible resource additions are minor; incompatible rules, identity removal or rename, and new required dependencies are major. Use the highest impact, native Git credentials, scoped commits, immutable tags, and verified branch/tag delivery. Preserve unrelated work and staging.
