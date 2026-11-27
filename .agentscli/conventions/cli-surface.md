---
trigger: Read when adding commands, flags, or agent operations.
reviewedHash: '06bd124e05a5e259ccb4a1892dddbf5ef7deac1c67ccae64ba6eb223168162b0'
reviewPolicyVersion: '1'
---

# CLI surface

- The CLI exposes `init` and `update`, plus help/version. Init prepares the convention directory and installs the three product skills; update refreshes an existing installation from the running package version. Both use one installer. Agent operations belong to separately scoped skills and their deterministic scripts.

For example, auditing convention responsibilities belongs to agentscli-optimize-conventions. Adding an `audit` public command to invoke agent judgment would move that operation into the wrong interface. `init` and `update` install its resources through the existing installer.
