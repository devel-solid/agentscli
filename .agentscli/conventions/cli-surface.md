---
trigger: Read when adding commands, flags, or agent operations.
reviewedHash: 'fa4c0de0f55bba1b4d14aac7844a25caf6f65358af7d07a12c7c42b516ca996e'
reviewPolicyVersion: '1'
---

# CLI surface

- The CLI exposes `init` and `update`, plus help/version. Init prepares the convention directory and installs the three product skills; update refreshes an existing installation from the running package version. Both use one installer. Agent operations belong to separately scoped skills and their deterministic scripts.

For example, auditing convention responsibilities belongs to agentscli-refactor-conventions. Adding an `audit` public command to invoke agent judgment would move that operation into the wrong interface. `init` and `update` install its resources through the existing installer.
