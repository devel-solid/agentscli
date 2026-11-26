---
trigger: Read when writing skill procedures, choosing support files, or removing guidance.
reviewedHash: '394297f4bcd806d7e8e4988dcb5e2b2c26705f6fab1d37da194160e8585a26c5'
reviewPolicyVersion: '1'
---

# Skill support

- Include necessary inputs, decisions, procedures, non-obvious constraints, and completion criteria. Prefer short common-path guidance and directly linked own support with an explicit consultation condition. Avoid generic tutorials, duplicated catalogs, deep reference chains, and session history.

- Before removing content, identify consumers and retain operational guarantees. Semantic review must distinguish declarative conventions from procedures that belong in a separately scoped skill.

- Keep all required guidance for a skill's own operation in its entrypoint or bundled support. Another skill can own a distinct operation; conventions cannot supply a missing procedure. Reading project instructions, configuration, templates, package metadata, source code, or the convention being edited as work inputs remains valid and does not make them instruction dependencies. Ordinary tools and libraries retain their existing prerequisites.

For example, the ordinary refactoring path explains how to diagnose independent decisions in SKILL.md. A complete case comparing a split with a rule-and-exception pair belongs in bundled support, linked where that distinction matters. Moving all essential decisions to an unshipped document leaves the skill incomplete. Show before/after behavior and explain the rejected alternative whenever a non-obvious boundary could be misapplied; short prose alone does not teach that distinction.
