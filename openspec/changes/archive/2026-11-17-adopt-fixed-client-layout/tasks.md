# Tasks

All boxes describe future implementation. This planning request performs none of these tasks and does not authorize a release or modification of any real client.

## 1. Fixed configuration and discovery

- [x] 1.1 Introduce fixed client-path constants and strict language-only configuration parsing, isolating the supported three-field legacy parser for migration; verify small units reject invalid YAML/UTF-8, aliases, duplicate/unknown fields, unsupported languages, and layout overrides.
- [x] 1.2 Update the normal planner to read the main source separately and discover only .agentscli/templates/conventions/**/*.tpl.md; verify units cover nested/dotted names, nested AGENTS.tpl.md, empty discovery, ignored out-of-subtree templates, and portable collisions without duplicated conventions segments.
- [x] 1.3 Retarget rendering/notices and bounded normal cleanup to the fixed outputs; verify units assert root-relative escaped AGENTS links with applicability text, new source notices, exact first-line markers, preserved manual files, and untouched old roots.
- [x] 1.4 Update the README's configuration/tree/mapping examples and complete-tree versioning guidance; verify examples match the planner contract and include no client root customization or automatic Git effects.

## 2. Initialization, locales, and CLI options

- [x] 2.1 Preserve stored language/content during ordinary init, applying explicit --lang only to the preference and missing resources; verify in-memory units cover first/repeated init, unchanged configuration, both languages, malformed configuration, edited outputs/skills, and deliberately removed convention sources.
- [x] 2.2 Preserve safe initial-seeding/configuration-publication ordering; verify injected failures at meaningful init file boundaries converge on retry without missing defaults or resurrecting removed initialized sources.
- [x] 2.3 Move each locale's default project.tpl.md into its conventions/ resource subtree and update resource fixtures; verify packaging/resource units include both locales at the new paths with unchanged localized bodies, main defaults, cards, and fill-in comments.
- [x] 2.4 Add init-only --migrate dispatch while retaining existing option placement rules, three operation names, JSON schema, and exit codes; verify injected CLI units cover accepted combinations, rejected migration --check, rejected layout overrides, and no runtime dispatch on usage errors.
- [x] 2.5 Update CLI help and README initialization/language/preview examples; verify they explain preference persistence, literal existing text, missing-only initialization, and separate sync notice updates.

## 3. Migration planning and references

- [x] 3.1 Add migration-only legacy discovery and deterministic source/output mappings, rejecting unsafe/overlapping roots and unsupported composition schemas; verify in-memory units cover default/custom roots, both languages, empty conventions, preserved relative conventions/ subdirectories, and source-repository ancestor rejection.
- [x] 3.2 Plan conservative content transfers and document regeneration, accepting only old-render or exact planned-result states where applicable; verify units cover absent old outputs, direct legacy output edits, manual expected outputs, divergent/identical new targets, and all-conflicts-before-writes behavior.
- [x] 3.3 Implement Markdown URL-span rebasing for inline/reference links and images using generated body versus root-card contexts; verify pure units retain targets/fragments/queries, preserve source formatting/external URLs/code examples, rebase unchanged repository resources, and reject incompatible definitions, escapes, ambiguous encodings, and affected unsupported HTML.
- [x] 3.4 Include complete packaged managed-skill restoration and all planned legacy cleanup effects in migration preview/JSON; verify preview and application plans agree, previews perform no IO mutations, extra files are removed only within managed skill trees, and other skills/resources remain intact.
- [x] 3.5 Document explicit migration preview/application, supported manifest shape, conflicts, skill replacement, and review of incoming references in unmanaged files; verify all commands use installed offline CLI operations without implicit installation or real-client changes.

## 4. Safe application, cleanup, and retry

- [x] 4.1 Apply migration in preparation/configuration/cleanup order with verification barriers and per-source deletion preconditions; verify injected units prove old sources/outputs survive until the new client is verified, changed sources/targets block deletion, and the old manifest is always the final removal.
- [x] 4.2 Implement retry classification from the retained legacy manifest and published new configuration, reconstructing cleanup paths from the new inventory when old sources are missing; verify failures during copying, output deletion, source deletion, and final manifest removal converge with the same options and no recovery metadata.
- [x] 4.3 Reject inconsistent coexistence, changed retry options, and unsafe aliases/links in both preparation and cleanup; verify units assert no preflight writes and safe partial-failure reporting for changes detected after planning.
- [x] 4.4 Route any remaining legacy manifest to migration guidance for ordinary init/validate/sync, and make completed migration a validated no-op; verify all normal preview/check modes reject legacy state with exit 2 and valid new clients retain ordinary check drift semantics.
- [x] 4.5 Update partial-effect diagnostics and README retry/cleanup guidance; verify unit results retain completed/pending statuses, exit 3, operation-specific retry instructions, preservation of unrelated/manual files and nonempty directories, and no rollback claims.

## 5. Distributed skill context

- [x] 5.1 Update the canonical agentscli-write-conventions and agentscli-update-agents skills for language-only client configuration and fixed template/generated-link targets; verify semantic review covers direct/client/missing/invalid/legacy/conflicting contexts and internal ancestor protection without imposing generated markers on handwritten source instructions.
- [x] 5.2 Update the client-only agentscli-build-agents skill for fixed discovery, explicit migration guidance, and fixed cleanup scope; verify it preserves operation authorization, installed-CLI-only behavior, manual protection, full managed-skill ownership, and no implicit init/migration/install.
- [x] 5.3 Update the README skill/context table and inspect resource-unit expectations; verify the unchanged internal distribution manifest still selects exactly the three complete canonical English skill directories and excludes release/OpenSpec skills.

## 6. General verification and scope review

- [x] 6.1 Run the relevant focused units and npm run check on a package-declared Node line; verify passing unit/type/format results and confirm no subprocess, integration, installed-package, network, Git, disposable-project, or historical-matrix tests were added.
- [x] 6.2 Review requirement-to-unit/manual-review coverage and the final diff; verify changes match these three delta capabilities, all acceptance scenarios are addressed, and real clients, source handwritten instructions, internal manifest, dependencies/lockfile pins, release-publication, archived changes, version metadata, and external Git/npm state are untouched.

## Workflow follow-up

- After implementation and review, archive through the separate OpenSpec archive workflow when requested; preserve the current permanent specs until that workflow or an explicitly requested spec sync.
- Build and inspect package resources/archive as later delivery preparation, reporting actual evidence without claiming installed-package or integration coverage.
- Select/change the CLI version and perform commits, tags, pushes, installation, or publication only as separate requested release work using agentscli-release. No release is required to complete this proposal.
