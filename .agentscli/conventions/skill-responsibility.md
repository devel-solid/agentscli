---
trigger: Read when defining a skill operation, activation description, or completion criteria.
reviewedHash: '40e7608882d92815d02c446f570c513dbb6b46a3a6f91a5fc89df85890a72e68'
reviewPolicyVersion: '1'
---

# Skill responsibility

Use the available skill creation guidance. Each skill performs one coherent operation. Its description states what activates it and what it changes; validate inputs needed by that operation before writes.

For example, agentscli-write-conventions owns drafting within a responsibility; agentscli-optimize-conventions owns structural diagnosis and reorganization of existing conventions; agentscli-build-agents owns mechanical validation and index generation. Auditing, proposing, applying an approved reorganization, and verifying preservation are stages of the refactoring outcome. Adding npm publication to that skill would introduce an independently requested outcome.

Before: "Maintain project knowledge" attracts writing, indexing, publication, and arbitrary cleanup. After: "Refactor convention responsibilities" identifies the structural outcome and its approval boundary. Its completion evidence includes the preserved agreements and final discovery entries, not merely successful tool calls.
