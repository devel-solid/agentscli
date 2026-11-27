---
trigger: Read when assigning validation to an agent operation or defining its evidence.
reviewedHash: 'd023aaa5b77c9d4800e0aaa6ad469a2726f47a5333c51ad9c75f34f07ef7b608'
reviewPolicyVersion: '1'
---

# Operation checks

Keep agent-facing checks inside the skill responsible for the operation, with its complete custom support. Each skill states when its checks run and how failures affect continuation. Another skill may own a distinct operation; do not expand the public CLI to host agent tasks. The repository uses the same installed product skills as clients and checks their exact derived contents against canonical package resources.

For example, convention authorship requests input validation from agentscli-build-agents, whose operation owns the deterministic validator. The authoring agent diagnoses and applies an explicitly authorized input repair; the checker itself stays read-only and must pass again before prose edits. Index ownership is checked only when planning synchronization. A handwritten AGENTS.md must not prevent input validation.

Review selection, receipt recording, and invalidation belong to agentscli-optimize-conventions. The other operations do not run this filter implicitly.
