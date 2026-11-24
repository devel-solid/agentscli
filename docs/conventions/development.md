# Development

Read when changing CLI contracts, resource packaging, tests, or delivery preparation.

## Runtime and resources

- The private root orchestrates one public npm workspace and one lockfile. Keep its existing package/bin identity, package tags, declared Node.js lines, and dependency pins unless a required implementation change justifies an update. Never publish the root.
- The CLI exposes only `apply`, plus help/version. Agent operations belong to separately scoped skills and their deterministic scripts. Do not introduce hidden command aliases or user-facing validation, synchronization, or release commands.
- Consumer generation is offline. Its real engine and complete executable closure belong to the build skill; the CLI uses its own packaged copy. Project scripts must run with Node.js and versioned project resources, without a global CLI, compiler, source checkout, implicit installation, Git, or network.
- Native Git is required only by operations that actually inspect or publish repositories. Use existing native authentication, argument arrays, and injected adapters. Do not collect tokens, assume a hosting vendor, execute downloaded code, or add a publication service.
- Maintain six independent operational skill source trees: three administrative and three consumer. Do not reuse skill sources, custom implementations, generated proxies, or symlinks across environments. Ordinary libraries and native tools are permitted dependencies. Built assets are derived from their owning sources; all distributed scripts and declared support files must be included.
- Authored templates, local skills, configuration, and Git state are protected inputs. Managed instructions, packaged operational skills, and exclusive generated convention outputs are replaceable. Repeat apply replaces its whole managed area and removes obsolete files without merging edits or resurrecting authored deletions.
- Validate roles, inputs, paths, source integrity, dependencies, and collisions before mutation. Reject unsafe symbolic links, junctions, hard links, escapes, and portable filename collisions. Preserve unmarked handwritten root instructions and unrelated paths.
- Previews and checks are write-free and use the same prospective plan as application. Replace files individually and report completed and pending effects on operational failure. Retry recomputes the same intent; do not add transaction journals, ownership history, rollback machinery, or ambiguous path adoption.

## Verification and delivery

- Version only lightweight unit tests under each applicable `tests/unit/`. Exercise parsers, renderers, planners, and injected filesystem/Git/npm boundaries with small inputs. Do not add subprocess, CLI/Git/npm, network, installation, disposable-project, integration, or end-to-end test suites, including opt-in variants.
- Run focused units while changing behavior and root `npm run check` before reporting readiness. Keep pre-push and CI within the same unit/type/format boundary. Treat builds and package/archive inspection as separate delivery operations; report their actual evidence without claiming installed-package or live-provider coverage.
- Preserve repository history, unrelated edits/staging, existing tags, and immutable published identities. External delivery needs authorization from the active request; reuse authorization already given. Local readiness does not establish a remote release. Ambiguous delivery responses require inspection of the exact remote identity before retrying.
- Keep temporary work in ignored locations. Versioned resources must not depend on session artifacts, cached checkouts, local machine paths, or unshipped modules.
