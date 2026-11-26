---
trigger: Read when changing resource ownership, installation recognition, or replacement plans.
reviewedHash: 'cb66c54d6f5e260c401b62bfda76ee1ad027121995c0a8d170f1501cbe54f6ff'
reviewPolicyVersion: '1'
---

# Managed installation

- Authored conventions, local skills, unrelated files, and Git state are protected inputs. Init and update preserve all convention and root AGENTS.md bytes, without requiring valid convention content or index ownership. Sync and check may validate conventions while preserving their bytes, including authored edits and deletions. Repeat installation replaces managed skill trees and removes obsolete skill files without merging edits.

- Recognize an existing installation from at least one product SKILL.md with its matching name, exact generatedBy package identity, and valid semantic generatorVersion. Update can recover any missing product skill or entrypoint. Init accepts missing or empty skill directories. Preserve foreign or ambiguous resource content rather than adopting it. Do not add installation manifests, markers, or configuration.

- Validate roles, inputs, paths, source integrity, and collisions before mutation. Reject unsafe symbolic links, junctions, hard links, escapes, and portable filename collisions. Preserve unmarked handwritten root instructions and unrelated paths.

- Treat validation as read-only preflight. Installation plans use complete canonical package resources and check their integrity and safe destinations independently of authored convention content or root index ownership. Build operations validate authored inputs before index writes. Edited recognized managed copies are drift to replace; authored resources remain authoritative. Ambiguous unmanaged collisions block the affected operation before writes.

For example, updating an older recognized installation adds the new refactoring skill and preserves every authored convention and root instruction byte. If that target already contains a handwritten SKILL.md with another identity, reject the collision before writes. A matching package stamp on one existing product skill authorizes recovery of missing siblings, not adoption of a foreign entrypoint.
