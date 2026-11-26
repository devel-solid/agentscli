---
trigger: Read when planning contract changes, assessing compatibility, choosing versions, or preparing releases.
reviewedHash: '4353825a3717fc22b3611644640a083184e454ec429f86e368b2ded59292d6c5'
reviewPolicyVersion: '1'
---

# Versioning

- A package with major version zero is beta. Production versions begin at `1.0.0`.

- Choose beta releases by completed impact while keeping production promotion a separate release decision.

- Version the CLI package according to its completed impact and current release state. The private workspace root has no aggregate product version and is never published.

- Preserve immutable published package versions, tags, and history. Beta status does not permit overwriting an existing release or deleting authored inputs. Choose unused release identities from actual current state.

For example, adding a third installed product skill changes the delivered resource inventory and requires assessing its completed impact. It does not automatically promote a beta package to production. If an earlier candidate is already published, choose an unused identity; never overwrite it merely because its major version is zero.
