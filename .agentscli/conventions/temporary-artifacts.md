---
trigger: Read when producing temporary files or adding runtime resource dependencies.
reviewedHash: '4930d2c4423247c15cc2a1ba9f09ff8a93062f52f3e4831b787e2a5e36c3a544'
reviewPolicyVersion: '1'
---

# Temporary artifacts

- Keep temporary work in ignored locations. Versioned resources must not depend on session artifacts, cached checkouts, local machine paths, or unshipped modules.

For example, put a local package-inspection report in ignored `.tmp/`. Keep the actual skill reference in its versioned canonical resource tree. A SKILL.md that requires the report from a previous session fails this agreement even if it works on the author's machine.
