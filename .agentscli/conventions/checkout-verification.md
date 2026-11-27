---
trigger: Read when preparing local changes for delivery or refreshing checkout resources.
reviewedHash: 'c8000a3e4a648681494de488e19b6eb17e163fdebea8ae4dba3b3647a6f4bd46'
reviewPolicyVersion: '1'
---

# Checkout verification

- Run focused units while changing behavior and root `pnpm run check` before reporting readiness. Keep pre-push and CI on the same gate, including read-only checks of authored conventions, the generated index, and installed resource drift. Do not format generated resources independently of their canonical installation. Treat builds, real local application, and package/archive inspection as separate delivery operations; report their actual evidence without claiming installed-package or live-provider coverage.

- The versioned conventions and installed skills must work before rebuilding. Dogfooding builds canonical package sources, initializes resources with the compiled checkout CLI, and synchronizes the index using the canonical build skill support. Resource checks reuse that support for read-only index validation and freshness; no duplicate generator, global CLI, or published package is required.

Before: format generated SKILL.md copies until checks pass while their templates still differ. After: format canonical sources, rebuild and refresh through dogfooding, then run the shared check gate. A successful unit suite establishes the tested boundaries; inspect the actual package archive separately before claiming delivery inventory coverage.
