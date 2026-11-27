---
trigger: Read when changing package boundaries, runtime declarations, or dependency metadata.
reviewedHash: '65567e01731c0557e14f39dd9d1d3ab3a91b5d8206fe8dacfdadf799a10d32b5'
reviewPolicyVersion: '1'
---

# Workspace identity

- The repository root is the single public npm package, with one lockfile and no workspace orchestration. Keep its existing package/bin identity, package tags, declared Node.js lines, and dependency pins unless a required implementation change justifies an update. Publish only the reviewed package inventory.

For example, adding a convention skill changes the package resources. Keep its source in the canonical asset templates and include only its derived distribution in the package; making the root public does not justify shipping installed project skills or local release tooling. A required runtime change must update the actual package contract rather than silently changing a dependency pin.
