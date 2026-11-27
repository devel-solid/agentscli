---
trigger: Read when defining a skill operation, activation description, or completion criteria.
reviewedHash: 'ed2b4293ec3577571e9f1238c5c66266d2348491f79fd63ac00400e38b35f2c1'
reviewPolicyVersion: '1'
---

# Skill responsibility

Use the available skill creation guidance. Each skill performs one coherent operation. Its description states what activates it and what it changes; validate inputs needed by that operation before writes.

For example, agentscli-write-conventions owns drafting within a responsibility; agentscli-optimize-conventions owns structural diagnosis and reorganization of existing conventions; agentscli-build-agents owns mechanical validation and index generation. Auditing, proposing, applying an approved reorganization, and verifying preservation are stages of the refactoring outcome. Adding npm publication to that skill would introduce an independently requested outcome.

Before: "Maintain project knowledge" attracts writing, indexing, publication, and arbitrary cleanup. After: "Refactor convention responsibilities" identifies the structural outcome and its approval boundary. Its completion evidence includes the preserved agreements and final discovery entries, not merely successful tool calls.
