# Design

## Context

See `proposal.md` for the motivation and scope. The current source versions are `@devel-solid/agentscli-hub@0.2.0` and `@devel-solid/agentscli@0.5.1`. Hub scaffold and discovery currently assume top-level resource roots. The consumer's Git adapter filters those same physical paths, and snapshot construction currently uses captured Git paths directly as local inventory keys.

The local snapshot is a distinct protected contract: the offline engine recognizes `conventions/` and `skills/` inside `.agentscli/hub/`, validates the original manifest and file descriptors, and materializes existing consumer destinations. Its format does not need to change when the hub's authoring directories move.

Hub repeat apply replaces README and the five operational skill trees. Authored instructions, conventions, resources, manifest version, Git state, and unrelated paths remain protected. All five hub skills own independent support implementations; package asset assembly uses the publication skill's contract for its own prepared resources. These are multiple maintained touchpoints, not an opportunity to share skill implementations.

## Goals / Non-Goals

**Goals:**

- Make the physical hub roots explicit while keeping logical resource IDs, dependency references, and consumer destinations stable.
- Validate physical Git inputs before mapping them into the existing snapshot namespace.
- Carry the change through both shipped packages and exact host installation, using existing administrative delivery support.

**Non-Goals:**

- Alternate roots, a catalog, new manifest fields, a schema increment, or additional public CLI commands.
- Compatibility readers, migration, automatic relocation, transition workflows, or special checks for former root-directory names.
- Reorganizing existing user hubs, publishing their content, moving the personal `review` skill, or changing the SGO.
- Changing the consumer's unrelated existing migration features, offline generation architecture, or operational skill inventory.

## Decisions

### 1. Fixed shared roots with unchanged identities

Create new hubs with `shared/conventions/.gitkeep` and `shared/skills/.gitkeep`. A convention ID is its path relative to `shared/conventions/` without `.tpl.md`; a skill ID is the direct-child directory name under `shared/skills/`. For example, `shared/conventions/testing/unit.tpl.md` remains `testing/unit`, and `shared/skills/review/` remains `review`.

Keep `.agents/skills/` operational and `docs/conventions/` internal. The package source directory `assets/templates/skills/` and assembled operational destinations do not move under `shared/`. The name describes distribution purpose without implying public repository access.

Configurable roots or manifest catalogs would add a separate product contract and are unnecessary for this fixed layout.

### 2. Apply the current contract directly

Keep `agentscli-hub.yml` at exactly `schemaVersion: 1` plus the independent content `version`. The manifest's fields and representation are unchanged; no schema or content-version bump follows automatically from updating a CLI.

Use only current roots for shared discovery and authoring. Do not scan former roots to provide fallback, conversion, warnings, dedicated rejection, or empty-directory exceptions. Missing selected current sources fail through ordinary source validation. Existing unrelated root content is preserved through the normal ownership rules, without any compatibility treatment.

In `src/runtime.js`, update bootstrap directory allowance, current authored-root scans, first-use directory effects, and complete prospective validation. Maintain write-free previews, interrupted-bootstrap proof, and whole-file failure reporting. Repeat apply still replaces only its managed areas; it does not create missing authored resources or rewrite an existing hub's AGENTS to update its prose.

Automatic movement would cross the authored-content boundary. Special blocking of old empty directories would add a transition mechanism without improving validation of the current layout.

### 3. Update each owning hub skill and publication scope

Review all five `assets/templates/skills/agentscli-hub-*/scripts/support.mjs` implementations independently. Update resource discovery, relative-ID extraction, inspection roots, collision checks, and source/output link aliases. Replace numeric offsets tied to the former prefix with correct extraction for the current roots; retain direct-child skill identity and nested convention paths.

Separate physical shared roots from consumer aliases: `shared/skills/review/` corresponds to `.agents/skills/review/` and `.agentscli/hub/skills/review/`. Blindly prefixing the existing alias expressions would produce incorrect `.agents/shared/skills/` paths. Preserve correct trigger/output bases, own-support links, and prohibitions on cross-resource links and fixed foreign workflow paths.

Update the two shared-authoring entrypoints and any support guidance that names resource paths. The internal author and root editor keep their assigned targets, while their checks recognize current shared resources. Update content-publication eligibility in `agentscli-hub-publish/scripts/release.mjs` to the current `shared/conventions/` and `shared/skills/` scopes, preserving its separate internal, operational, manifest, and Git-policy responsibilities. Content version selection continues to assess actual published content impact; npm CLI version selection remains independent.

Update scaffold AGENTS/README and relevant internal resource-authoring guidance, package/root READMEs, and complete examples. Each moved shared skill remains a complete tree with its own configuration and support. Build still collects exactly five independent hub skill sources and stamps them from their owning package metadata.

### 4. Map physical capture paths to logical snapshot paths

Use the following fixed mapping only for selected shared files:

| Physical path in selected Git commit | Local inventory key under `.agentscli/hub/` |
| ------------------------------------ | ------------------------------------------- |
| `agentscli-hub.yml`                  | `agentscli-hub.yml`                         |
| `shared/conventions/<id>.tpl.md`     | `conventions/<id>.tpl.md`                   |
| `shared/skills/<id>/<file>`          | `skills/<id>/<file>`                        |

The import skill's `scripts/git.mjs` selects current physical paths and inspects the exact requested commit through the existing native Git boundary. Check entry paths and regular modes and obtain committed attributes using those real paths. No downloaded code, hooks, filters, checkout, or submodule execution is added.

Its `scripts/contracts.mjs` validates the selected physical inventory and then maps each validated resource path once into the local inventory. Validate portable uniqueness and containment for both physical and logical inventories. Mapping is fixed, selection-bound, and unambiguous; it is not arbitrary prefix stripping or an alternate-root reader. Keep the root manifest byte content unchanged and apply existing text/opaque canonicalization, SHA-256, and mode rules.

Keep consumer config selections, lock `schemaVersion: 1`, accepted snapshot paths, generated convention paths, and installed skill paths unchanged. The build engine's `scripts/lib/hub.mjs` and `plan.mjs` continue consuming that same local contract; extend their regression coverage without moving their storage roots or rewriting protected accepted sources. Valid existing snapshots work because the local format is unchanged. New remote acquisition uses only the current physical roots.

Moving the snapshot under `shared/` would unnecessarily change local state, offline inventory validation, and installed-source reconstruction. Rewriting the manifest or previously accepted descriptors would violate protected source integrity.

### 5. Preserve safety at the new parent and mapping boundary

Preflight the `shared/` parent and descendants, including occupied file/directory conflicts, symlinks, junctions, hard links, containment, and portable name aliases. Detect collisions in complete prospective plans before writes. Preserve reserved operational names, explicit dependency selection, local-versus-hub origins, unmanaged destination rejection, and accepted-source integrity checks.

Test link handling with current physical shared paths and unchanged consumer aliases, including encoded targets, fragments, HTML/Markdown references, support files, and executable examples. Mapping must not make an invalid physical path valid or classify a foreign resource as ordinary project content.

### 6. Reuse existing release and host workflows

The existing `release-publication` capability already requires independent beta releases of both affected packages, verified immutable delivery, and exact installation in the active host. Its behavior, along with the existing offline CLI, project-instruction, and general skill-authoring contracts, remains in force without additional delta specs.

Prepare each version from actual current package metadata, completed impact, registry identities, and local/remote tags. Do not preallocate versions during planning or promote packages to production for this beta break. Use `agentscli-adm-publish-packages` for native version preparation, gates, candidate archives, source review, Git/npm delivery, and verification.

Build and inspect both real tarballs in ignored storage. In addition to the administrative checker's complete inventory/byte and metadata comparison, verify the hub's two current scaffold placeholders, absence of former shared scaffold roots, all five/four operational closures, actual generator stamps, and consumer importer mapping. Adjust existing checker fixtures or expectations only if needed to enforce those concrete artifact guarantees.

After each publication is verified, install its exact version in the active global npm environment. Check global versions, command resolution, and both executables' reported versions. Resolve relevant PATH mismatches without changing unrelated prefixes or packages. Global installation never applies either CLI to a project.

## Risks / Trade-offs

- A missed independent validator can disagree with runtime discovery. Mitigation: exercise all five owning validators with the same small current-layout fixtures while keeping their implementations separate.
- Incorrect ID slicing or aliases can add `shared/` to identities or weaken link checks. Mitigation: nested convention IDs, complete skill trees, own-support links, and forbidden physical/local aliases receive focused unit coverage.
- Mapping before attribute inspection can corrupt opaque payloads or execute intent. Mitigation: inspect real Git paths first and assert byte, descriptor, and mode preservation through injected-boundary capture and offline tests.
- A CLI upgrade can leave authored AGENTS prose unchanged in an existing hub. Mitigation: document the ownership boundary and keep that hub's explicit layout/instruction update in its own OpenSpec; add no migration machinery here.
- Publishing only one package or failing host installation leaves delivery incomplete. Mitigation: track each exact release and host result separately and keep unfinished tasks open without allocating another identity on retry.

## Migration Plan

There is no data or layout migration. Deploy through these existing delivery operations after an apply request:

1. Implement the current hub layout and consumer acquisition mapping; update documentation and focused units.
2. Select available independent beta versions, update package/lock metadata, run the root unit/type/format gate, and build both workspaces.
3. Pack, inspect, and review exact artifacts and source; deliver native Git/npm releases and verify immutable remote and registry identities.
4. Install and verify both exact releases in the active host. Report completion and remaining effects without applying to user projects.

Previously published artifacts and tags remain immutable. Partial delivery is inspected and resumed for the same identity through the existing administrative workflow. No automatic rollback, recovery database, or old-layout support is introduced. Any later update to a user hub or the SGO is planned and executed in its own project.
