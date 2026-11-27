---
trigger: Read when preparing local changes for delivery or refreshing checkout resources.
reviewedHash: '7e90f01f351a5d5b09d0d0ec9a8e14f7f88471bc97a19401a44f9e5773b5cb9b'
reviewPolicyVersion: '1'
---

# Checkout verification

- Run focused units while changing behavior and root `pnpm run check` before reporting readiness. Keep pre-push and CI on the same gate, including read-only checks of authored conventions, the generated index, and installed resource drift. Do not format generated resources independently of their canonical installation. Treat builds, real local application, and package/archive inspection as separate delivery operations; report their actual evidence without claiming installed-package or live-provider coverage.

- Use the pnpm version pinned in package metadata. After cloning, `pnpm ci` installs dependencies from the frozen lockfile and `pnpm run setup` enables the native Git pre-push hook. Keep dependency installation explicit: checks and hooks fail on a stale installation rather than installing implicitly. The versioned conventions and installed skills must work before rebuilding. Dogfooding builds canonical package sources, initializes resources with the compiled checkout CLI, and synchronizes the index using the canonical build skill support. Resource checks reuse that support for read-only index validation and freshness; no duplicate generator, global CLI, or published package is required.

Before: format generated SKILL.md copies until checks pass while their templates still differ. After: format canonical sources, rebuild and refresh through dogfooding, then run the shared check gate. A successful unit suite establishes the tested boundaries; inspect the actual package archive separately before claiming delivery inventory coverage.
