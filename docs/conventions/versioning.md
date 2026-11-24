# Versioning

Read when planning contract changes, assessing compatibility, choosing versions, or preparing releases.

- A package with major version zero is beta. Production versions begin at `1.0.0`; the beta exception ends when that package reaches major one.
- During beta, adopt changed contracts directly. Do not add transition periods, migrations, backward-compatibility readers, fallback formats, or mechanisms whose purpose is protecting old clients. Breaking a beta contract does not itself require promoting the package to production.
- For example, replacing a skill configuration format in `0.x.x` means implementing and documenting the current format and rejecting unsupported declarations. It does not require supporting both formats or converting the former one.
- Version the CLI package according to its completed impact and current release state. The private workspace root has no aggregate product version and is never published.
- Preserve immutable published package versions, tags, and history. Beta status does not permit overwriting an existing release or deleting authored inputs. Choose unused release identities from actual current state.
