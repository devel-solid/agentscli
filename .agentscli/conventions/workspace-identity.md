---
trigger: Read when changing package boundaries, runtime declarations, or dependency metadata.
reviewedHash: '65567e01731c0557e14f39dd9d1d3ab3a91b5d8206fe8dacfdadf799a10d32b5'
reviewPolicyVersion: '1'
---

# Workspace identity

- The private root orchestrates one public npm workspace and one lockfile. Keep its existing package/bin identity, package tags, declared Node.js lines, and dependency pins unless a required implementation change justifies an update. Never publish the root.

For example, adding a convention skill changes the public workspace resources. It does not justify adding an aggregate root version or publishing the private root. A required runtime change must update the actual package contract rather than silently changing a dependency pin.
