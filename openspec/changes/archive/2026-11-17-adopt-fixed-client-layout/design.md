# Design

## Context

See [proposal.md](proposal.md) for motivation and the three delta specs for behavioral contracts. The current runtime already separates planning (`src/plan.ts`) from applying ordered file effects (`src/runtime.ts`), injects a small `FileSystem`, checks portable paths and aliases, and replaces files individually. Reuse those boundaries.

Today `src/manifest.ts` stores language and two configurable roots; init deliberately overwrites that manifest. The planner discovers every non-main template under the configured template root and derives outputs relative to that whole root. `src/render.ts` already accepts explicit source/output paths and renders localized notices plus root-relative AGENTS discovery links. Resource packaging copies both locale trees and the complete three skill directories selected by the internal manifest. Units already supply small resource maps and an in-memory filesystem.

## Goals / Non-Goals

**Goals:** One predictable client layout, stable language preference, an explicit conservative migration, and convergence after individual file failures while retaining the existing safety and offline execution boundaries.

**Non-Goals:** A fourth public command, custom-layout options, translation, a general-purpose document mover, a permanent legacy generation mode, a new dependency, recovery metadata, modification of consumer projects, and release/versioning work. This proposal authorizes only planning artifacts; implementation remains a separate workflow.

## Decisions

### 1. Separate fixed paths from the only configurable value

Use fixed project-relative constants for `.agentscli/config.yml`, `.agentscli/templates`, its `AGENTS.tpl.md`, its `conventions` subtree, and `.agentscli/conventions`. Retain the current shared language validation and engine-error/result contracts. Isolate the old three-field parser behind migration-only entrypoints rather than passing legacy roots into normal generation. Its existing path restrictions remain in force, with an additional rejection of roots overlapping `.agentscli/`.

Parse the new configuration as strict YAML: exactly one string field, lowercase `en` or `pt-br`, no duplicate keys, aliases, additional mappings, or invalid UTF-8. Keep CLI language-value normalization, so `--lang PT-BR` may normalize to the stored `pt-br`. Invalid stored configuration blocks init rather than being overwritten.

Alternative: keep root fields with fixed defaults. Rejected because that leaves the unwanted mapping contract and two sources of layout truth.

### 2. Discover against the full convention-source prefix

Read the main template separately. Recursively collect only `*.tpl.md` under `.agentscli/templates/conventions/`; unrelated files and templates outside that subtree do not participate. For relative source `testing/unit.tpl.md`, remove only `.tpl.md`, then emit `.agentscli/conventions/testing/unit.md`. Nested `AGENTS.tpl.md` within the convention subtree is a convention, not the root main template. Retain portable ordering and destination collision checks.

Keep the current Markdown structural contracts and renderer behavior. Render root discovery URLs from actual output paths using existing escaping; carry AGENT-CARD applicability into the index and remove only its operational block from each body. Source notices name the full new project-relative template paths.

Alternative: move the old template root without changing discovery. Rejected because adding a conventions subtree would duplicate that segment in outputs.

### 3. Initialize missing setup without resetting content

Language precedence for ordinary init is explicit `--lang`, then valid existing configuration, then `en`. Keep existing valid source bytes, regular skill files, and marked output bytes; create missing required main source, skills, and expected outputs from the effective sources. Never overwrite manual required outputs. Only explicit language changes or missing configuration produce configuration effects; byte-equal configuration requires no rewrite.

Use the presence of valid configuration or the existing main template to distinguish initialized setup from first-time seeding. Preserve the current ordering principle: seed default convention sources before the main source and write new configuration after complete setup. An interruption before publication is therefore completed by repeating the same command; an initialized project does not resurrect removed convention defaults. If the default main exists but a default convention is absent and no configuration exists, retain the current main-template completion rule rather than inventing ownership metadata.

An explicit language change only updates the preference and selects resources for missing content. Existing generated notices remain until a requested sync. Normal sync still replaces full marked output bodies and fully restores managed skill directories; init remains conservative.

### 4. Make migration an explicit init option

Extend only init with `--migrate`, optional `--lang`, and existing `--dry-run`; retain common `--repo-root`/`--json`. Do not add migration `--check` or a fourth command. Existing sync check remains write-free and reports valid document/skill drift with exit 1. Any remaining old manifest blocks ordinary init/validate/sync with exit 2 and migration guidance; it is not ordinary drift.

With no old manifest, `init --migrate` validates an existing new client and returns no effects, regardless of `--lang`; a later preference change uses ordinary init. With neither configuration, report a missing legacy client instead of implicitly initializing. The source-repository ancestor guard runs before all modes.

Alternative: migrate automatically during init or sync. Rejected because the old init resets language/roots and because ordinary generation must not silently move/delete project sources. A standalone migrate command is unnecessary given the existing init planner and option dispatch.

### 5. Plan migration as preparation followed by cleanup

Keep migration-specific planning in a small runtime module using the existing IO/path helpers and `Effect` representation. It returns the same create/update/delete effects consumed by `execute`; preview and application share that list. It does not call another CLI, Git, npm, or the network.

Let `T` and `O` be the legacy manifest's actual template/output roots. Construct a deterministic mapping:

| Legacy artifact | New artifact |
| --- | --- |
| `T/AGENTS.tpl.md` | `.agentscli/templates/AGENTS.tpl.md` |
| `T/<relative>.tpl.md`, excluding the main | `.agentscli/templates/conventions/<relative>.tpl.md` |
| `O/<relative>.md` | `.agentscli/conventions/<relative>.md` |
| root `AGENTS.md` | root `AGENTS.md` with rebuilt discovery and notices |

Keep the full legacy relative source path. For example, a real legacy subdirectory named `conventions` remains a subdirectory; do not strip it heuristically. Do not seed an absent default context during migration: zero conventions is valid.

Before returning any effects, validate the manifest, all source structures, the old and new path inventories, expected output conflicts, managed skill destinations, link conversions, and every planned deletion. Read-only phases use the same checks. Reject overlapping old/new namespace roots, portable aliases, file/directory collisions, unsafe ancestors, symlinks/junctions, hard links, and escaped paths.

Preserve valid source bytes except URL edits, including source newline style. Compare expected legacy outputs with their legacy render to catch direct edits, including localized old notices. Missing old outputs are allowed. On a preparation retry, root AGENTS may already equal the planned new render; accept that exact result as well. An unmarked expected old/new output or a divergent occupied new source/output is a conflict, even if a new output carries the generated marker. Report the source/destination and preserve all files rather than selecting a winner. Obsolete marked Markdown under `O` has the same disposable cleanup contract as legacy sync; unmarked files and non-Markdown resources remain untouched.

Ordered application:

1. Create/verify transferred main and convention sources.
2. Create/verify the new convention outputs, replace root AGENTS, and restore the complete three packaged skill trees, including removal of extra files only inside those managed trees.
3. Recheck the prepared inputs/destinations against their planned bytes, then publish language-only `.agentscli/config.yml`. Before this publication no old source or old convention output is removed.
4. Delete each eligible old generated `.md` under `O` and each transferred old source only after checking its converted content against the new equivalent. Recheck original snapshots before mutation; target verification is an additional deletion precondition, not an unchecked consequence of an earlier write.
5. Remove now-empty legacy subdirectories/roots only when they contain nothing else. Delete `agentscli-compose.yml` last, after new-layout verification and cleanup success.

Add a narrow verification barrier/deletion precondition to the existing effect application boundary as needed; do not add new public result actions or persistent state. Configuration publication and old-manifest removal must never advance past a failed verification. Keep all predictable validation in preflight; verification during application detects changes since that preflight and reports operational failure.

### 6. Resume from files that already exist

The old manifest is retained until cleanup finishes and the new configuration is published only after preparation. These existing artifacts define two retry states without adding a status flag or journal:

| State | Retry behavior |
| --- | --- |
| Old manifest, no new configuration | All old sources still exist. Recompute the complete conversion; accept only identical new copies/planned outputs and finish preparation. |
| Old manifest and new configuration | Require the configured language to match the same requested migration options and validate the complete new template/render/skill inventory. Perform only verified remaining cleanup. |
| New configuration, no old manifest | Validate the new client and finish with no migration effects. |

For cleanup retries, reconstruct old source/output paths by inverse mapping from the complete new template inventory and union them with remaining old sources/marked outputs. Missing old files are already completed effects. Each remaining old source must still convert to its new counterpart; unexpected sources or divergence block cleanup. Existing expected old outputs are checked against the old render wherever their legacy source remains available; once a source has already been removed, the published complete new client plus the exact generated marker bounds removal of its remaining old output. Remove convention outputs before sources to minimize that case.

If both configurations were independently present, the same equivalence/freshness checks must establish a valid cleanup state; otherwise report a conflict. Do not silently treat arbitrary coexistence as completed preparation. Reject a changed language/options set during retry rather than mixing partial destinations from different plans.

Operational failure returns exit 3 and completed/pending effects. Advise retrying `init --migrate` with the same options; ordinary sync stays blocked until the old manifest is gone. No rollback occurs, and concurrent or intervening edits are unsupported and diagnosed by snapshot/equivalence checks. Removing a now-empty legacy directory needs no recovery record.

### 7. Rewrite only understood document references

Reuse the existing Markdown parser to locate inline-link/image destinations and reference definitions, then edit URL spans in source text rather than serializing the whole AST or replacing path strings globally. This preserves unrelated prose, examples, comments, and formatting. Keep suffix fragments/queries and encode rewritten path segments consistently with rendered links. Preserve external/scheme/protocol-relative URLs and same-document anchors.

Resolve a main-template body link relative to root AGENTS output, and a convention body link relative to its old generated output. Map targets that are transferred sources or generated documents; preserve the resolved repository target for unrelated files and resources, then rebase to the new output location. Resolve operational card links in the root AGENTS context because that is where their text is emitted. Inspect literal examples without rewriting them. Preserve source-notice technical strings by rebuilding notices through the renderer rather than editing generated prose.

If one reference definition is used in both card and body with incompatible required destinations, block with its source location. A relative link that escapes the repository, has an invalid/ambiguous encoding, or uses affected unsupported embedded HTML is a blocking diagnostic. HTML local `href`/`src` references whose target or document base changes must be converted explicitly by the author; the migrator does not parse/rewrite arbitrary HTML or executable content. An unchanged-base, unaffected reference remains literal.

The migrator owns only managed sources and outputs. It does not scan or edit arbitrary project prose for incoming links; documentation instructs clients to update references from unmanaged files separately when reviewing the migration preview. Unrelated resources remain in their original directories and managed links are rebased to them.

### 8. Keep resource and skill ownership unchanged

Move only each locale's default `project.tpl.md` to `assets/templates/<locale>/conventions/project.tpl.md`; retain the localized body and existing main defaults. The current whole-tree packaging should naturally preserve these paths; adjust resource/unit expectations rather than create another maintained copy.

Update the two canonical shared authoring skills and the client-only build skill. Their context table is: internal manifest only means direct handwritten English authorship; valid new config only means fixed client templates; old manifest means migration is required; missing/invalid/conflicting context means no writes. An internal ancestor prevents nested client interpretation. Build continues to use the installed CLI and never installs/upgrades or implicitly migrates clients. Refreshing all three skills during explicit migration ensures they no longer point to the removed manifest. Other skills remain untouched.

Keep `agentscli.yml`, source AGENTS/conventions, `openspec/config.yaml`, `release-publication`, and archived specs unchanged. The old one-off guide/publication requirements in permanent specs are not new tasks for this change. Supersede only the active client-contract requirements listed in the proposal.

## Risks / Trade-offs

- [A conservative migration rejects direct output edits or divergent destinations] -> Preserve all content, identify conflicts before writes, and instruct reconciling useful content into templates first.
- [Failure can leave a mixture of old and new artifacts] -> Publish new configuration after preparation, remove the old manifest last, report partial effects, and verify deterministic retry states.
- [Managed skill edits are replaced by migration] -> Include full tree replacement and extra-file removal in preview, matching the existing sync ownership contract.
- [Links in arbitrary project files can become stale] -> Repair understood managed references, block ambiguous ones, and document explicit review of incoming references outside the managed scope.
- [Hidden-directory content may be omitted from version control by client policy] -> Document versioning the complete tree; do not invoke Git or rewrite ignore policies automatically.
- [Source deletion is more sensitive than ordinary generated cleanup] -> Require a verified converted destination and unchanged source at each deletion, never recursive tree removal.

## Migration Plan

Implement the runtime, resources, skills, documentation, and unit coverage together before any separate release. Clients using the eventual compatible CLI run `agentscli init --migrate --dry-run`, reconcile reported conflicts/review unmanaged incoming references, then explicitly run `agentscli init --migrate` with the same language options. After success, run validate, sync preview, and sync check; document/skill drift must be zero. Version the complete new tree and root AGENTS through the client's normal workflow.

There is no automated rollback or saved backup. Before cleanup, old sources remain; after migration, source control is the client's restoration mechanism if they independently choose to revert. The CLI itself performs no Git operation. No real client is migrated during this change's planning or repository implementation.

## Verification

Use small parser, renderer, planner, CLI-dispatch, and packaging units under `tests/unit/`, including injected IO failures before configuration publication, during old-output/source deletion, and immediately before old-manifest removal. Assert source/target verification and retry convergence at each meaningful effect boundary using the existing in-memory filesystem. Cover both supported languages, custom legacy roots, nested/dotted paths, an empty convention set, link contexts, conflicting destinations, manual protection, aliases/links, and write-free preview/check behavior.

Run focused units during implementation and `npm run check` for the general gate on a declared Node line. Build and package/archive inspection remain later delivery operations. Do not add subprocess/CLI execution, installation, network, disposable-project, Git, integration, end-to-end, or historical compatibility-matrix tests. No implementation decision remains open.
