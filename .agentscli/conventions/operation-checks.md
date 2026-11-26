---
trigger: Read when assigning validation to an agent operation or defining its evidence.
reviewedHash: '34494549bae97ad05fda2f1cdc004705a9324f01748cb31011f1d8044aefab17'
reviewPolicyVersion: '1'
---

# Operation checks

Keep agent-facing checks inside the skill responsible for the operation, with its complete custom support. Each skill states when its checks run and how failures affect continuation. Another skill may own a distinct operation; do not expand the public CLI to host agent tasks. The repository uses the same installed product skills as clients and checks their exact derived contents against canonical package resources.

For example, convention authorship requests input validation from agentscli-build-agents, whose operation owns the deterministic validator. The authoring agent diagnoses and applies an explicitly authorized input repair; the checker itself stays read-only and must pass again before prose edits. Index ownership is checked only when planning synchronization. A handwritten AGENTS.md must not prevent input validation.

Review selection, receipt recording, and invalidation belong to agentscli-refactor-conventions. Selection and metadata previews stay read-only; recording sets only the two control fields, while invalidation removes them to keep a reopened review pending. Both writes require matching expected content and criteria plus safe targets. A successful parser, selection, or invalidation run must never be reported as a completed semantic review, and the other operations do not run this filter implicitly.

Before: a proposed audit command claims that a format pass proves every convention has one responsibility. After: the agent reviews semantic responsibility, while deterministic checks establish formats, paths, links, ownership for the affected operation, and resource completeness. Those are different kinds of evidence; successful parsing cannot choose a policy or prove the quality of an example.
