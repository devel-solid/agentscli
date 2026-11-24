# Versioning

Read when planning contract changes, assessing compatibility, choosing versions, or preparing releases.

- A package with major version zero is beta. Production versions begin at `1.0.0`.
- Choose beta releases by completed impact while keeping production promotion a separate release decision.
- Version the CLI package according to its completed impact and current release state. The private workspace root has no aggregate product version and is never published.
- Preserve immutable published package versions, tags, and history. Beta status does not permit overwriting an existing release or deleting authored inputs. Choose unused release identities from actual current state.
