---
trigger: Read when planning contract changes, assessing compatibility, choosing versions, or preparing releases.
reviewedHash: '2fe0df201f77c000e59b8f5faa127f0f834896682e85a3fd92e5a9e077f1ef3f'
reviewPolicyVersion: '1'
---

# Versioning

- A package with major version zero is beta. Production versions begin at `1.0.0`.

- Choose beta releases by completed impact while keeping production promotion a separate release decision.

- Version the CLI package at the repository root according to its completed impact and current release state. There is one product version; do not introduce an independent aggregate version.

- Preserve immutable published package versions, tags, and history. Beta status does not permit overwriting an existing release or deleting authored inputs. Choose unused release identities from actual current state.

For example, adding a third installed product skill changes the delivered resource inventory and requires assessing its completed impact. It does not automatically promote a beta package to production. If an earlier candidate is already published, choose an unused identity; never overwrite it merely because its major version is zero.
