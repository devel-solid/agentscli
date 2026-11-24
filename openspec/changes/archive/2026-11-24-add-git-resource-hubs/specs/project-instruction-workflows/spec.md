# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: The package distributes three complete English client skills`
- TO: `### Requirement: The package distributes complete English client skills`
- FROM: `### Requirement: Client configuration stores language only`
- TO: `### Requirement: Client configuration stores language and one optional hub`
- FROM: `### Requirement: The internal manifest selects distributed skill directories`
- TO: `### Requirement: Package asset roots determine distributed skill directories`
- FROM: `### Requirement: Synchronization restores the complete managed client skill trees`
- TO: `### Requirement: Managed skill trees are replaced from authoritative resources`

- FROM: `### Requirement: Initialization creates usable instructions without resetting authored content`
- TO: `### Requirement: Apply creates and refreshes instructions without resetting authored content`

- FROM: `### Requirement: Initialization preview leaves every file unchanged`
- TO: `### Requirement: Apply preview leaves every file unchanged`

## MODIFIED Requirements

### Requirement: Package asset roots determine distributed skill directories

The repository SHALL remove agentscli.yml and SHALL NOT use a replacement distribution manifest. Consumer and hub builds SHALL discover complete skill directories only under their respective packages/*/assets/templates/skills roots, validating expected names, entrypoints, safe contained paths, and unique portable destinations. Root administrative/OpenSpec skills SHALL NOT become package inputs. Each environment SHALL retain its own authored source trees.

#### Scenario: Shared and client-only sources are listed
- **WHEN** consumer packaging reads its approved asset root without agentscli.yml
- **THEN** it assembles exactly the four independent consumer skill trees and excludes all root administrative, hub, and OpenSpec skills

#### Scenario: Two entries target the same skill name
- **WHEN** asset discovery finds duplicate portable destinations or name/directory mismatches
- **THEN** it identifies the offending paths and validation error before assembling package resources

### Requirement: Apply creates and refreshes instructions without resetting authored content

First apply SHALL create config, templates, four skills, and generated instructions. Default conventions SHALL use project-context.tpl.md for en and contexto-do-projeto.tpl.md for pt-br. Repeated apply SHALL preserve authored templates and deliberate convention removals, regenerate managed outputs, refresh four packaged/selected imported skill trees, and remove obsolete managed files. Accepted hub state SHALL remain pinned/local. No administrative/hub operational skill SHALL be installed.

#### Scenario: A new client initializes
- **WHEN** apply succeeds in an empty project
- **THEN** the fixed configuration, editable main/context templates, four packaged client skills, and generated instructions exist
- **AND** the context template and output use the canonical filename for the configured language

#### Scenario: Authored setup already exists
- **WHEN** apply finds customized valid templates alongside edited generated documents and managed skill files
- **THEN** it preserves authored sources/language/state, replaces managed outputs/skills from authoritative inputs, and removes obsolete managed files

#### Scenario: A convention was deliberately removed
- **WHEN** a client removes its context convention template and repeats apply
- **THEN** apply does not restore that source or add another default convention

#### Scenario: First initialization was interrupted
- **WHEN** apply is retried with the same options after a partial initial setup
- **THEN** it finishes the missing default setup without resetting the sources already created

### Requirement: Apply preview leaves every file unchanged

Apply --dry-run SHALL use the application plan for setup, explicit language changes, generated document/installed skill replacements, extra/obsolete managed-file deletions, protected-path preservation, and conflicts. Apply --migrate --dry-run SHALL use the explicit migration plan. Neither preview SHALL create files/directories, change content/permissions, reset state, or alter Git metadata.

#### Scenario: Manifest replacement is previewed
- **WHEN** apply --migrate --dry-run runs beside a supported legacy client manifest
- **THEN** it describes fixed-layout configuration and final legacy manifest removal while leaving every file unchanged

#### Scenario: Configuration is previewed
- **WHEN** apply --dry-run runs beside a valid pt-br configuration without --lang
- **THEN** it preserves the preference, reports any packaged-skill refresh, and leaves all files unchanged without proposing a language reset

#### Scenario: Migration cleanup is previewed
- **WHEN** apply --migrate --dry-run can migrate a supported legacy client
- **THEN** effects include source transfers, generated documents, four packaged skills, configuration, and legacy cleanup without writing

### Requirement: Every convention template participates automatically

Every valid local `*.tpl.md` below `.agentscli/templates/conventions/` SHALL participate recursively. Exactly the selected accepted imported templates under `.agentscli/hub/conventions/` SHALL also participate. Both SHALL map their relative IDs to `.agentscli/conventions/` with suffix `.md`. The main source SHALL remain `.agentscli/templates/AGENTS.tpl.md`. Ordering SHALL use portable normalized paths; equivalent destinations SHALL fail. Directories SHALL create no inheritance.

#### Scenario: Nested and dotted sources are present
- **WHEN** local `testing/unit.tpl.md` has the heading “Unit” and `policy.details.tpl.md` has the heading “Policy details”
- **THEN** validation reports `policy-details.tpl.md` as the expected filename before writing
- **AND** after the source is renamed, both sources generate independent root AGENTS entries and the nested source keeps its directory

#### Scenario: Portable destinations collide
- **WHEN** local or imported source paths differ only by case or Unicode normalization at the generated destination
- **THEN** every generation mode rejects the collision before writing

#### Scenario: Discovery has no conventions
- **WHEN** the main template is valid, the local convention subtree is empty or absent, and no imported conventions are selected
- **THEN** generation succeeds with an empty convention index

#### Scenario: Templates are outside the convention subtree
- **WHEN** unrelated `*.tpl.md` files exist elsewhere, including directly beside `.agentscli/templates/AGENTS.tpl.md`
- **THEN** they do not become convention sources or generated outputs unless they are explicitly selected accepted hub convention sources

#### Scenario: Local and shared conventions are selected together
- **WHEN** their generated paths are distinct and both source sets are valid
- **THEN** one deterministic AGENTS index contains both sets, and no unselected hub convention participates

### Requirement: Manifest language selects document resource text

The only stored client language SHALL be language in .agentscli/config.yml. First apply SHALL default to en; repeated apply SHALL preserve the stored preference unless --lang is explicit. New default resources and generated notices SHALL use the selected language. Existing authored and imported bodies SHALL remain literal. Packaged product skills SHALL stay English and SHALL NOT prescribe chat language; imported skills SHALL keep their authored language.

#### Scenario: Portuguese client content is authored
- **WHEN** an independent English consumer authoring skill handles a client with language pt-br
- **THEN** it guides Portuguese local template authorship without translating itself or adding a chat-language rule

#### Scenario: A configured project synchronizes later
- **WHEN** .agentscli/config.yml contains pt-br
- **THEN** renderer-added notices use pt-br while authored text remains literal and packaged product skills remain English

#### Scenario: Language changes after initialization
- **WHEN** apply --lang en runs on a valid pt-br client with existing templates and outputs
- **THEN** it changes the preference and regenerates notices in English without translating/replacing authored or accepted imported bodies

#### Scenario: A hub resource uses a different language
- **WHEN** a selected resource's language differs from the client's configured language
- **THEN** its body is retained without translation, fallback, or variant lookup

### Requirement: Generated documents identify their editing contract

Every generated document SHALL retain the exact generated marker and localized notice identifying its local or accepted imported source. Imported notices SHALL direct the hub workflow. Root AGENTS SHALL link relatively to generated conventions and include each trigger text. Convention outputs SHALL omit their operational YAML frontmatter, not authored body/examples. AGENTS discovery links SHALL remain allowed; conventions themselves SHALL NOT link to other conventions or skills.

#### Scenario: An output is inspected
- **WHEN** its local template is rendered
- **THEN** its first line identifies generated output and its readable notice identifies the local template editing surface

#### Scenario: Convention discovery is rendered
- **WHEN** a nested convention with a valid trigger is generated
- **THEN** its root AGENTS entry contains the actual generated path and trigger, and its generated convention body contains no operational frontmatter

#### Scenario: An imported convention is rendered
- **WHEN** an accepted selected convention with a valid trigger participates
- **THEN** its notice identifies imported ownership, its trigger contributes discovery, and the complete operational frontmatter is absent from its generated body

### Requirement: The package distributes complete English client skills

Consumer build SHALL distribute exactly agentscli-write-conventions, agentscli-edit-agents, agentscli-build-agents, and agentscli-manage-hub-imports from its own package asset root. Each independent English SKILL.md and complete custom support tree SHALL be included. Administrative, hub, and OpenSpec skills SHALL be excluded. No source manifest, source checkout, or shared cross-environment skill implementation SHALL be required.

#### Scenario: A shared skill contains references or scripts
- **WHEN** build assembles package resources
- **THEN** each consumer skill's own support files accompany its independent SKILL.md, without reading another environment's skill source

#### Scenario: The hub-management skill is packaged
- **WHEN** the consumer archive is assembled
- **THEN** its scripts and required runtime code are included inside its skill directory without a repository-only dependency

#### Scenario: Consumer metadata is installed from a prepared artifact
- **WHEN** apply installs or replaces the four packaged operational skill trees
- **THEN** it copies MIT, exactly compatibility: Requires Node.js >= 22., generatedBy @devel-solid/agentscli, and generatorVersion matching that installed package's real version
- **AND** accepted imported skill frontmatter and preserved hub content state are not stamped or rewritten

### Requirement: Managed skill trees are replaced from authoritative resources

Consumer apply SHALL restore four packaged trees from installed assets and selected imported trees from accepted local state. Private sync SHALL replace only documents/imported installations. Edits, missing files, and extra files in managed trees SHALL be replaceable drift, not merge conflicts. Remove obsolete managed files and preserve unrelated skills/protected sources/state. Completed-migration retries SHALL stay no-ops. No self-repair cache or ownership history SHALL be added.

#### Scenario: A client edits a packaged skill and adds an extra file
- **WHEN** apply applies the installed package resources
- **THEN** the skill returns to packaged content, including support files, and the extra file is removed

#### Scenario: Another skill exists beside the managed skills
- **WHEN** apply refreshes packaged directories or build-skill sync updates selected hub-managed directories
- **THEN** that unmanaged skill and its files remain unchanged

#### Scenario: A hub skill has a missing support file
- **WHEN** its accepted snapshot is valid and a managed installed support file is missing
- **THEN** apply/private sync restores the complete accepted installation offline regardless of edits to other installed files

#### Scenario: A hub skill was modified locally
- **WHEN** an accepted managed installed hub skill contains an edited file or extra regular file
- **THEN** apply/private sync replaces that tree from its accepted snapshot and removes extras without merging
- **AND** preview/check reports repairable drift while invalid snapshot integrity still blocks writes

#### Scenario: A hub script needs only newline or executable repair
- **WHEN** its accepted content matches but installed LF endings or a supported execute mode differ
- **THEN** sync restores materialization offline as repairable updates, without rewriting imported sources or changing the Git index

#### Scenario: A consumer upgrades from the former AGENTS editor name
- **WHEN** apply finds the previously product-owned agentscli-update-agents tree
- **THEN** its validated initialization preview/application removes that reserved retired tree and installs agentscli-edit-agents without keeping an alias or deleting unrelated user skills
- **AND** hub selection cannot claim the retired name and is rejected before any cleanup if it tries

### Requirement: Preview and check include document and skill drift

Private sync preview/check SHALL share the document/imported-installation plan without writes. Managed edits, missing files, extras, LF/mode repairs, and obsolete outputs SHALL produce check drift 1; matching state returns 0. Invalid sources/state, unsafe paths, and unmanaged collisions SHALL fail. Packaged-skill replacement SHALL appear in CLI apply preview/application only; private generation SHALL NOT embed a packaged baseline or repair its own scripts.

#### Scenario: Only a support file is stale
- **WHEN** documents and SKILL.md match but an accepted imported support file is missing
- **THEN** private script check returns 1 and preview describes restoration without writing

#### Scenario: An imported source has changed
- **WHEN** its digest under the recorded representation disagrees with accepted integrity
- **THEN** preview and check fail without writing or contacting the remote

### Requirement: Project writes converge without recovery databases

All input/path/conflict validation SHALL precede mutation. Individual-file replacement SHALL preserve whole files and reject unsafe aliases. Operational failure SHALL report completed/remaining document, skill, configuration, and migration effects and advise retrying the same operation. No transaction lock, ownership history database, journal, rollback backup, or mutex record SHALL be maintained. A hub's current snapshot/integrity record SHALL NOT be treated as recovery history.

#### Scenario: A later skill write fails
- **WHEN** documents or earlier skill files have already been replaced during ordinary sync
- **THEN** failure reports partial completion and repeated sync recomputes remaining work without rollback claims

#### Scenario: Migration cleanup fails
- **WHEN** the new client is prepared but removal of a legacy file fails
- **THEN** failure identifies completed/pending effects, retains the old manifest, and directs repeating apply --migrate with the same options

#### Scenario: A remote hub update leaves ambiguous partial state
- **WHEN** the management script cannot prove ownership or accepted integrity after an operational failure
- **THEN** it reports the affected paths and requires explicit reconciliation before retry rather than inventing a recovery journal or deleting ambiguous files

### Requirement: Client configuration stores language and one optional hub

Clients SHALL use .agentscli/config.yml with language set to en or pt-br and at most one optional hub object. Hub fields SHALL be exactly repository, full commit ID, conventions, and skills, with explicit unique ID lists. Invalid UTF-8/YAML, duplicate or unknown keys, YAML aliases, unsupported languages, and non-object values SHALL fail. Directory mappings, multiple hubs, implicit selection, and tracking refs SHALL NOT be supported.

#### Scenario: Language-only configuration is valid
- **WHEN** configuration contains exactly language: pt-br
- **THEN** validate and sync use the fixed paths and Portuguese resource text without requiring a hub or migration

#### Scenario: A client requests custom roots
- **WHEN** configuration contains templates_dir or conventions_dir
- **THEN** all operations reject it without writing or adopting those roots

#### Scenario: Invalid configuration would otherwise be replaced
- **WHEN** apply encounters invalid configuration, even with --lang
- **THEN** it fails before any mutation and preserves the existing bytes

#### Scenario: A client configures a hub
- **WHEN** the optional hub has one remote, a full commit ID, and explicit convention/skill lists
- **THEN** validation requires a matching accepted local snapshot and never fills it from the network

### Requirement: Client instruction sources and outputs are versioned together

The documented client workflow SHALL version the complete .agentscli/ tree, including configuration, local authored templates, accepted hub sources/current integrity, and generated conventions, alongside root AGENTS.md and installed skill trees. Initialization, migration, synchronization, and hub-management scripts SHALL NOT commit, change ignore rules, or otherwise modify the project's Git state.

#### Scenario: A new client reviews the workflow
- **WHEN** the README and initialization guidance explain generated-file ownership
- **THEN** they instruct versioning the complete .agentscli/ tree, root AGENTS.md, and installed skills without running Git commands

#### Scenario: A selected snapshot is reviewed
- **WHEN** a hub update is prepared
- **THEN** its remote, exact commit, selected source changes, generated output changes, and installed skill changes are reviewable through the project's ordinary Git diff

### Requirement: The source repository keeps direct handwritten instructions

The monorepo SHALL keep handwritten English AGENTS and final conventions, without agentscli.yml or consumer configuration. Offline package/workspace identities SHALL protect tool roots/ancestors from consumer apply/migration and private build scripts. Only the three administrative operational skills SHALL be active at root; package skill assets SHALL remain product data. No replacement source marker SHALL be introduced.

#### Scenario: A maintainer updates source instructions
- **WHEN** package/workspace identity validates the monorepo and administrative authorship is requested
- **THEN** the appropriate agentscli-adm-* skill edits final files directly without running apply or sync

#### Scenario: Client init targets the source repository
- **WHEN** apply detects the monorepo through its package/workspace identities
- **THEN** it reports incompatible context before creating configuration or changing files

#### Scenario: Migration targets a source-repository subtree
- **WHEN** apply --migrate targets a descendant of a tool source root identified through package metadata
- **THEN** it rejects that context without changing files

### Requirement: Cleanup preserves manual documents and stays inside the current output root

Apply/private sync SHALL replace expected managed outputs and remove obsolete regular files throughout the exclusive .agentscli/conventions subtree, including unmarked extras. The generated root AGENTS SHALL retain its exact marker; an unmarked handwritten root destination SHALL block as an unmanaged collision. Preserve authored/state areas, unrelated documents, and old output roots outside current managed scopes; explicit migration alone owns legacy cleanup.

#### Scenario: A template is renamed or removed
- **WHEN** apply/private sync computes outputs from the preserved current template set
- **THEN** it updates the index and removes obsolete regular files under .agentscli/conventions, including edited or unmarked managed extras, without restoring the removed template

#### Scenario: A manual file mentions the generated marker
- **WHEN** an unmarked handwritten root AGENTS destination mentions the marker only in its body or an example
- **THEN** it remains an unmanaged collision and blocks preflight rather than being adopted
- **AND** this safeguard does not preserve arbitrary regular files inside the exclusive generated conventions subtree

#### Scenario: An old output directory remains elsewhere
- **WHEN** ordinary apply/private sync runs after migration with marked files outside the current managed output scope
- **THEN** it preserves those unrelated documents and does not recursively delete the project

### Requirement: Legacy clients require explicit migration

Only apply --migrate SHALL convert supported legacy custom roots or fixed-layout local AGENT-CARD templates. Supported custom-root manifests remain exactly language/templates_dir/conventions_dir, preserving language unless explicit. Malformed/older composition schemas, unsafe overlaps, contradictory formats, convention requires, and convention-to-convention or convention-to-skill links SHALL block before writes.

#### Scenario: Ordinary operations encounter old discovery cards
- **WHEN** ordinary apply or private build scripts encounter local AGENT-CARD templates
- **THEN** they diagnose the old cards and direct the explicit apply --migrate workflow without implicitly converting them

#### Scenario: A custom-root client migrates
- **WHEN** the legacy manifest names rules/sources and rules/final with language pt-br
- **THEN** migration discovers those actual roots and preserves pt-br without assuming templates/ or docs/conventions/

#### Scenario: An unsupported manifest is present
- **WHEN** the manifest is malformed or contains an older entries-based composition schema
- **THEN** migration reports the unsupported input and preserves all files

#### Scenario: Legacy roots overlap the target namespace
- **WHEN** a legacy root equals, contains, or is contained by .agentscli/
- **THEN** migration reports the overlapping paths without performing in-place destructive conversion

### Requirement: Migration resumes using existing project artifacts

Repeating apply --migrate SHALL recompute deterministic remaining effects from existing files without journals. Converted fixed-layout sources SHALL remain usable alongside remaining old cards during an interrupted explicit conversion. For custom roots, new copies/configuration and the remaining legacy manifest SHALL still govern safe cleanup. Divergent/ambiguous input SHALL block rather than guess. Fully current valid clients without legacy inputs SHALL remain no-ops.

#### Scenario: Copying was interrupted
- **WHEN** some new files exist but configuration has not been published
- **THEN** retry accepts only identical planned copies and completes preparation before deleting old artifacts

#### Scenario: Source deletion was interrupted
- **WHEN** valid new configuration exists, some old templates are gone, and the legacy manifest remains
- **THEN** retry uses the validated new layout to identify and verify remaining legacy artifacts and deletes the manifest only after cleanup succeeds

#### Scenario: Both contracts appear independently occupied
- **WHEN** existing new content is inconsistent with the deterministic migration or validated cleanup state
- **THEN** migration reports conflicting context and makes no new writes

#### Scenario: A fixed-layout client converts discovery cards
- **WHEN** apply --migrate --dry-run encounters valid local AGENT-CARD templates and a fixed config without a legacy manifest
- **THEN** it previews deterministic trigger conversion and regenerated documents without any writes or remote access
- **AND** application preserves authored body/language, desired hub state, and unrelated files

#### Scenario: Fixed-layout conversion was interrupted
- **WHEN** the same explicit migration is retried with some valid trigger templates and remaining old-card templates
- **THEN** it preserves completed conversions, converts remaining eligible inputs, and never resets authored bodies or accepted hub state

### Requirement: Convention filename mismatches block generation

A convention basename SHALL equal its H1 in ASCII lowercase kebab case plus `.tpl.md`. Normalize the parsed title using Unicode NFKD, remove combining marks, and replace non-alphanumeric runs by single hyphens. Reject empty results and mismatches before any writes in apply, validate, sync, previews, check, and migration.

#### Scenario: A client submits a mismatched filename
- **WHEN** `componentes.tpl.md` has the H1 “Aplicação web e componentes”
- **THEN** the CLI fails with validation exit code 2 and identifies the source and expected filename `aplicacao-web-e-componentes.tpl.md`
- **AND** it makes no changes to templates, outputs, or managed skills

#### Scenario: A convention has a valid nested path and a formatted heading
- **WHEN** `testing/api-e-validacao.tpl.md` has the H1 “**API** e validação”
- **THEN** the containing directory is preserved and the generated file is `testing/api-e-validacao.md`

#### Scenario: An H1 cannot produce a portable slug
- **WHEN** the parsed H1 has no ASCII letters or digits after normalization
- **THEN** validation fails with a diagnostic identifying the title to correct

#### Scenario: A legacy migration would transfer an invalid convention
- **WHEN** a legacy convention would produce a mismatched basename in the fixed layout
- **THEN** migration and its preview fail before writing and identify the required source correction

### Requirement: Fill-in comments preserve ordinary source rendering and ownership

Bundled fill-in hints SHALL remain ordinary HTML comments, not visible Markdown or specially stripped content. Rendering SHALL preserve generated notices and literal examples, use trigger-based discovery, and omit only operational convention frontmatter. Updated defaults SHALL NOT overwrite valid authored templates through ordinary apply/private sync; explicit format migration alone SHALL convert legacy discovery metadata.

#### Scenario: Untouched defaults are rendered
- **WHEN** the bundled main/context templates are rendered in either supported language
- **THEN** fill-in hints remain HTML comments and generated notices remain; the main insertion marker becomes the trigger-based index and the context frontmatter is absent from its generated convention body

#### Scenario: An existing client uses older or customized templates
- **WHEN** the updated CLI applies resources or the private build script synchronizes that client
- **THEN** its valid source templates remain unchanged and any regenerated document body continues to follow those sources rather than the updated package defaults

### Requirement: Document format validation distinguishes examples from operational syntax

Templates SHALL be valid UTF-8 with one H1 in the Markdown body outside examples. Convention templates SHALL have leading strict YAML frontmatter containing only a nonempty string trigger, no requires, and no links to other conventions or skills. Mechanical checks SHALL resolve supported link targets in trigger/body before writes. The renderer SHALL use H1/trigger for discovery, omit frontmatter from convention output, and preserve ordinary Markdown/examples.

#### Scenario: A template teaches Markdown syntax
- **WHEN** literal examples contain H1 headings, frontmatter, old cards, or insertion comments
- **THEN** examples remain unchanged and do not satisfy or duplicate the actual leading frontmatter/body structure
- **AND** active links resolving to another convention are mechanically rejected while literal examples do not declare active links

### Requirement: Bundled context templates separate discovery from fill-in guidance

Each bundled context template SHALL have trigger-only YAML frontmatter with localized discovery text, its localized H1, and one body HTML comment requesting actual project context. No AGENT-CARD block, requires declaration, or convention-to-convention or convention-to-skill link SHALL be generated. Existing fill-in paragraphs/additional generic rules SHALL remain absent.

#### Scenario: English context is initialized
- **WHEN** a new English client receives the context template
- **THEN** its title is `# Project context`, its trigger reads `Read when starting work or choosing the project's development workflow.`, and its body contains only `<!-- Replace this comment with the project's actual context. -->`

#### Scenario: Portuguese context is initialized
- **WHEN** a new `pt-br` client receives the context template
- **THEN** its title is `# Contexto do projeto`, its trigger reads `Leia ao iniciar um trabalho ou escolher o fluxo de desenvolvimento do projeto.`, and its body contains only `<!-- Substitua este comentário pelo contexto real do projeto. -->`

### Requirement: Migration repairs managed document references

Explicit migration SHALL preserve ordinary link targets outside convention and skill trees, including fragments/queries, while rebasing moved sources/notices. Converted trigger links SHALL use root AGENTS as base. Convention-to-convention or convention-to-skill links SHALL block rather than be rewritten or inlined automatically. Ambiguous supported references SHALL fail with source locations; examples/external URLs SHALL not be fetched or broadly rewritten.

#### Scenario: A convention links to another generated document
- **WHEN** an old convention actively links to another convention or a skill source/output, with or without a fragment
- **THEN** explicit migration reports the forbidden link before writes and requires self-contained authored rules rather than silently preserving, rebasing, or merging the dependency

#### Scenario: A convention links to an unchanged repository file
- **WHEN** moving a convention changes the base for its README or image reference
- **THEN** migration rebases the reference to the same unchanged repository file without moving unrelated resources

#### Scenario: An AGENT-CARD contains a link
- **WHEN** old card text being converted to trigger links to an ordinary repository file outside convention and skill trees
- **THEN** migration preserves/rebases that target using the root AGENTS output context
- **AND** a link to another convention or a skill blocks the complete conversion instead

#### Scenario: A reference is ambiguous
- **WHEN** a shared definition used in different output contexts needs incompatible URLs or an affected embedded HTML reference cannot be safely rebased
- **THEN** migration identifies the source location and blocks without a broad text replacement

### Requirement: Migration preserves sources and rejects content conflicts

Explicit migration SHALL transfer supported legacy roots without losing relative convention paths and convert operational AGENT-CARD text to trigger frontmatter. Preserve authored Markdown/language except that metadata conversion and safe required link edits. Different occupied targets, manual outputs, unsupported/contradictory formats, and forbidden convention links SHALL block all writes; deterministic equivalent results support retry.

#### Scenario: Old cards use the current fixed layout
- **WHEN** local templates already occupy the fixed layout but retain operational AGENT-CARD metadata
- **THEN** explicit apply --migrate converts those cards to trigger frontmatter while preserving their authored rules

#### Scenario: Nested legacy sources migrate
- **WHEN** rules/sources/testing/unit.tpl.md belongs to a supported legacy root
- **THEN** it becomes .agentscli/templates/conventions/testing/unit.tpl.md and generates .agentscli/conventions/testing/unit.md

#### Scenario: A legacy source has a conventions subdirectory
- **WHEN** the legacy relative source path is conventions/rule.tpl.md
- **THEN** migration preserves that relative subdirectory without heuristically stripping its name; generation adds no further conventions segment

#### Scenario: A destination or legacy output has authored divergence
- **WHEN** a new source differs from its planned transfer or an expected legacy generated document differs from both its old render and the planned migrated result
- **THEN** migration reports the conflict and writes nothing, allowing useful content to be reconciled in its template first

#### Scenario: Expected old outputs are missing
- **WHEN** valid legacy templates exist but some generated outputs do not
- **THEN** migration creates the new expected outputs from those templates

### Requirement: Migration prepares destinations before removing legacy artifacts

Explicit migration SHALL prepare/verify converted sources, generated documents, and managed skills before applicable configuration publication/legacy cleanup. Remove only transferred equivalent sources, eligible old outputs, and empty legacy directories; remove agentscli-compose.yml last when present. Fixed-layout card conversion SHALL update only its authorized local metadata/output effects, preserving hub config/snapshot and unrelated authored files without creating a legacy manifest.

#### Scenario: Migration completes
- **WHEN** all new files and configuration have been prepared and verified
- **THEN** it removes only eligible legacy artifacts, deletes the manifest last, and leaves one usable client contract with updated notices and discovery links

#### Scenario: Generic legacy directories contain unrelated files
- **WHEN** the source/output roots also contain non-template resources or unmarked manual documents
- **THEN** migration preserves them and their nonempty directories instead of deleting either tree recursively

#### Scenario: A transferred source changed before deletion
- **WHEN** an old source or its new equivalent changes after planning
- **THEN** migration refuses to delete that source and reports a partial operational failure

## ADDED Requirements

### Requirement: Package metadata distinguishes protected source contexts

Source guards SHALL verify the private root's declared tool workspaces against child package names and bins for @devel-solid/agentscli/agentscli and @devel-solid/agentscli-hub/agentscli-hub. A standalone/installed tool package's matching name/bin SHALL also identify a protected context. Mere private/workspace status or agentscli.yml presence SHALL NOT select administrative authorship or reject unrelated clients. Ancestor checks SHALL remain offline.

#### Scenario: An unrelated private workspace initializes a consumer
- **WHEN** its packages do not identify the two tool workspaces or a tool package root
- **THEN** its private/workspace metadata alone does not block ordinary client operations

#### Scenario: A tool package directory is targeted directly
- **WHEN** the root or an ancestor has the actual tool package name and executable identity
- **THEN** consumer operations reject that context even without agentscli.yml

### Requirement: Apply preserves protected consumer areas in place

Apply SHALL preserve the complete authored .agentscli/templates tree and accepted config/snapshot state unless an explicit language, migration, or hub-import workflow changes its own state. It SHALL replace only declared managed scopes and SHALL NOT copy protected areas out, delete/recreate the project, merge managed edits, or require a backup. Project Git metadata/policy and unrelated paths SHALL remain untouched.

#### Scenario: An upgrade removes a managed support file
- **WHEN** installed package assets no longer contain that file in a managed operational skill tree
- **THEN** apply removes its old installed copy while preserving templates, language, hub commit/selection/snapshot/lock, and Git metadata

#### Scenario: Repeated application has no differences
- **WHEN** authoritative managed resources and protected state already match the desired setup
- **THEN** apply reports no changes and leaves authored/state files untouched
