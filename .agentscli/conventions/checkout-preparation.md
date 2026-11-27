---
trigger: Read when preparing a checkout or changing dependency installation and hook setup.
reviewedHash: '0ab00b2d97744d0517afdb9044f7e0d7ba73610dd88f9052d7d325ae55f6a04f'
reviewPolicyVersion: '1'
---

# Checkout preparation

Use the pnpm version pinned in package metadata. After cloning, `pnpm ci` installs dependencies from the frozen lockfile and `pnpm run setup` enables the native Git pre-push hook.

Keep dependency installation explicit: checks and hooks fail on a stale installation rather than installing implicitly.

For example, prepare a new checkout with the pinned pnpm version, install from the frozen lockfile, and explicitly enable the hook. If dependencies later become stale, a check reports that condition; silently installing them from the check would hide the missing preparation and introduce an unrequested mutation.
