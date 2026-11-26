---
trigger: Read when writing, translating, or reviewing the language of skill prose and examples.
reviewedHash: '9890539981e8099a61236119b993c836fd33170fe30d535bef6c6d5b1a38d2dd'
reviewPolicyVersion: '1'
---

# Skill language

Keep each skill's prose and examples in one language. Preserve exact technical literals, including command flags, API names, and resource names; those literals do not make the surrounding prose multilingual.

For example, when translating a skill into Portuguese, an inadequate result keeps "Validate the source" in the entrypoint and "Valide a origem" in its example explanation. A consistent result uses "Valide a origem" in both, while retaining `--repo-root`, `recordReview`, and `SKILL.md` exactly. Translating those literals to `--raiz-do-repositorio`, `registrarRevisao`, or `HABILIDADE.md` would change the interfaces or resource being referenced, not merely the prose. The same distinction applies when the chosen language is English or another language.
