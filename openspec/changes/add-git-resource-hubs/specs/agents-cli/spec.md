# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: The public interface has three operations`
- TO: `### Requirement: The public interface exposes apply only`

- FROM: `### Requirement: Initialization preserves configured language and existing content`
- TO: `### Requirement: Apply preserves authored content and project state`

## MODIFIED Requirements

### Requirement: The installed CLI runs with Node alone

The package SHALL expose agentscli apply on supported Node lines without a lifecycle build or resource download. Apply SHALL use installed assets; the shipped agentscli-build-agents scripts SHALL validate/generate using Node and versioned project files alone, without the installed CLI executable, source checkout, compiler, Git, or network. All required custom runtime code SHALL ship in that skill. Hub acquisition SHALL remain separate.

#### Scenario: A project has only Node and the installed CLI
- **WHEN** the developer initializes through the CLI and later validates/synchronizes through the shipped build-skill scripts
- **THEN** apply uses installed assets and later generation needs only Node and versioned project files, without an agentscli executable or external resource lookup

#### Scenario: A user installs the published artifact
- **WHEN** npm installs the prepared package
- **THEN** its executable and resources are ready without compiling TypeScript or fetching setup resources through install scripts

#### Scenario: A configured hub is unavailable remotely
- **WHEN** the project has a valid accepted local snapshot and runs the build script's validate or sync mode
- **THEN** the operation uses only local files and does not consult the remote or require Git

### Requirement: The public interface exposes apply only

The CLI SHALL expose only apply plus help/version, retaining --repo-root/--json and apply --lang/--dry-run/--migrate in valid combinations. It SHALL reject init, public validate/sync, aliases, hidden forwarding, and layout overrides without writes. Documentation SHALL distinguish managed replacement from authored/state preservation and direct agent-only validation/generation to agentscli-build-agents scripts.

#### Scenario: Public help is requested
- **WHEN** agentscli --help runs
- **THEN** it describes only apply, first-use setup, repeatable managed replacement, protected content/state, preview, explicit migration, and the separate private build workflow

#### Scenario: An obsolete option is requested
- **WHEN** a caller requests init, validate, sync, release, a removed/layout option, or a disguised generation-only apply flag
- **THEN** the CLI returns actionable usage failure without writes or forwarding to a private script

#### Scenario: Migration is requested explicitly
- **WHEN** apply --migrate --lang pt-br --dry-run --json is parsed
- **THEN** it selects migration with the explicit language and write-free preview, using command apply in the existing JSON envelope

#### Scenario: Migration is misplaced
- **WHEN** sync --migrate, validate --migrate, or apply --migrate --check is requested
- **THEN** the CLI returns usage failure without dispatching writes

### Requirement: Validation and synchronization share one project plan

Build-skill validate/sync/preview/check SHALL share input/path/state validation. Consumer apply SHALL reuse the same generation plan with packaged-skill replacement added. Managed document/installed-skill edits and extras SHALL be replaceable drift: check returns 1 and preview 0 without writes. Invalid authored input, accepted snapshot integrity, unsafe paths, or unmanaged collisions SHALL fail with exit 2 before writes. Neither workflow SHALL merge managed edits.

#### Scenario: Only a managed skill has drifted
- **WHEN** documents match but an accepted imported skill support file is missing
- **THEN** the build script's sync --check reports drift with exit 1 and preview describes the skill repair without writing

#### Scenario: A source is invalid
- **WHEN** validation finds an invalid template or unsafe managed destination
- **THEN** preview, check, and sync report the same blocking diagnostic without changing files

#### Scenario: A hub-owned skill was edited
- **WHEN** an installed selected skill has edited content or extra regular files and the accepted snapshot is valid
- **THEN** validation treats that installed tree as replaceable managed drift, preview describes replacement/removal, and check returns 1
- **AND** apply or private sync restores the complete accepted tree without merging or asking to preserve those edits

#### Scenario: An installed hub skill file is missing
- **WHEN** its accepted snapshot is valid and all present files remain unchanged
- **THEN** sync --check reports repairable drift with exit 1 and sync can restore the missing file offline

#### Scenario: Only executable state or equivalent installed text needs repair
- **WHEN** accepted content is intact but a supported execute mode differs or installed text needs canonical LF endings
- **THEN** check returns 1 and sync repairs materialization offline, reporting mode-only changes as updates in the existing JSON model
- **AND** preview/check does not write content or change permissions

#### Scenario: A filesystem cannot represent executable permissions
- **WHEN** the client runs on Windows or an injected unsupported filesystem
- **THEN** it retains accepted Git modes and does not report execute-only drift or change ACLs

### Requirement: Validation checks project inputs without repairs

The private validate mode SHALL check root, config, language, authored inputs, accepted state, paths, and unmanaged collisions without repair. Installed managed edits SHALL NOT be source-integrity failures. Missing unrelated packaged skills SHALL NOT block a present build script; apply repairs them. Legacy configuration SHALL require explicit apply --migrate. Offline package/workspace identity and hub markers SHALL protect tool/hub roots without agentscli.yml.

#### Scenario: A convention lacks its discovery card
- **WHEN** the read-only checker inspects a convention lacking nonempty trigger frontmatter, declaring requires, or actively linking to another convention
- **THEN** it identifies the source/schema or forbidden-link target with validation exit 2 and writes nothing

#### Scenario: Client skills are absent
- **WHEN** valid fixed-layout inputs and the build script exist but another packaged skill is missing
- **THEN** the script can validate/generate without restoring packaged trees and directs apply for their repair
- **AND** if the build skill itself is missing, apply restores it from installed assets before that script can run

#### Scenario: Migration has not finished
- **WHEN** apply without --migrate, validate, or sync in any mode encounters agentscli-compose.yml, even beside new configuration
- **THEN** it returns exit 2 with guidance to preview or finish apply --migrate, without using the legacy roots for normal generation

#### Scenario: Desired hub selection differs from accepted state
- **WHEN** configuration changes without a corresponding accepted snapshot update
- **THEN** validation reports the mismatch and directs the hub-management skill without fetching or repairing it

#### Scenario: Client generation targets a hub project
- **WHEN** an operation detects agentscli-hub.yml in its root or an ancestor
- **THEN** it reports the authoring context and writes no consumer configuration or generated documents

#### Scenario: A fixed-layout client still uses discovery cards
- **WHEN** ordinary apply or private validate/sync encounters a local operational AGENT-CARD template
- **THEN** it reports explicit apply --migrate preview/application guidance without silently replacing protected authored metadata

### Requirement: Maintained CLI text is English

CLI help, diagnostics, and maintained developer documentation SHALL be English from 0.1.0. Apply --lang SHALL select project document resource text without changing command names or prescribing the agent's chat language. All packaged product skills SHALL remain English. Hub-imported resource text SHALL retain its authored language independently of client language.

#### Scenario: Portuguese instructions are requested
- **WHEN** agentscli apply --lang pt-br runs
- **THEN** new project templates/notices use Portuguese while CLI text, technical identifiers, and packaged product skills remain English

#### Scenario: A selected third-party skill is authored in Portuguese
- **WHEN** an English client imports the complete skill
- **THEN** its text remains Portuguese without translation or rejection based only on language

### Requirement: Apply preserves authored content and project state

Apply SHALL create missing setup and replace managed documents/skills, deleting obsolete managed files without merging edits. It SHALL preserve the authored template tree, configured language unless explicit, and accepted hub config/snapshot/pin. Invalid sources/state, unsafe paths, or unmanaged destinations SHALL block writes. It SHALL NOT fetch a hub, reset state, or delete/recreate protected trees. Completed-migration retries SHALL remain no-ops.

#### Scenario: Initialization is repeated
- **WHEN** apply encounters an existing valid client with customized templates, edited generated documents/managed skills, and extra managed files
- **THEN** it preserves authored sources and project state, recomputes outputs, restores four packaged skills and selected imported skills, and deletes obsolete managed files without a merge

#### Scenario: The language is explicitly changed
- **WHEN** apply --lang en runs on that client
- **THEN** it updates the preference and generated notices while preserving existing authored/imported bodies without translation

#### Scenario: Handwritten content occupies an output destination
- **WHEN** an unmarked AGENTS.md would be overwritten by initialization
- **THEN** apply fails before setup writes and explains preserving useful content in the template and resolving the destination

#### Scenario: Invalid configuration is present
- **WHEN** apply --lang pt-br encounters malformed .agentscli/config.yml
- **THEN** it reports a validation failure instead of replacing the configuration

#### Scenario: A client with a hub changes document language
- **WHEN** apply --lang en runs on a valid client with an accepted hub
- **THEN** it preserves repository, commit, selection, imported bytes, and hub resource language without a remote operation

#### Scenario: An imported skill has a local edit during init
- **WHEN** apply finds an edited installed hub skill but its accepted local source/state remains valid
- **THEN** it overwrites that managed installation from the snapshot and removes extras
- **AND** modified snapshot content instead blocks the complete plan as invalid project state without implicit fetching

### Requirement: Migration reuses the installed offline CLI

Apply --migrate SHALL use Node, installed assets, and project files for supported legacy-root transfer or explicit fixed-layout AGENT-CARD conversion. Retain dry-run/root/JSON options and no runtime Git/network/install. A fully current valid client with no legacy inputs SHALL remain a no-op, including --lang; ordinary apply refreshes packaged skills. With neither supported client configuration it SHALL fail without implicit setup.

#### Scenario: A legacy client previews migration
- **WHEN** apply --migrate --dry-run runs with the installed CLI
- **THEN** it reports the same validated effects as application without Git, network, package installation, or writes

#### Scenario: Migration is repeated after completion
- **WHEN** apply --migrate runs with no legacy manifest and an already valid fixed-layout client
- **THEN** it succeeds without changes, including with --lang or older packaged skills, and directs ordinary apply for any requested skill refresh

#### Scenario: No client exists
- **WHEN** apply --migrate encounters neither supported client configuration
- **THEN** it returns exit 2 and explains using ordinary apply for a new client

### Requirement: Results have stable JSON and exit semantics

Public apply and private build-script modes SHALL support one JSON envelope with schemaVersion: 1, command, ok, changes, and diagnostics. Command SHALL identify apply, validate, or sync without exposing new public CLI operations. Exit codes SHALL be 0 success, 1 check drift, 2 usage/validation/conflict, and 3 operational failure. Effects SHALL distinguish plans from completed writes, including initialization/migration creations, updates, and deletions.

#### Scenario: A caller requests JSON preview
- **WHEN** the private build script runs sync --dry-run --json
- **THEN** stdout is one JSON result describing planned document/imported-skill changes without claiming completed writes or packaged-skill repair

#### Scenario: A file operation fails
- **WHEN** a planned write cannot complete
- **THEN** exit 3 identifies partial completion and unfinished work without claiming success

#### Scenario: Migration fails after some effects
- **WHEN** an operational failure interrupts apply --migrate
- **THEN** the result reports completed/pending effects and directs repeating apply --migrate with the same options rather than ordinary build-script sync

## ADDED Requirements

### Requirement: The build skill owns the executable generation engine

agentscli-build-agents SHALL own its real generation engine and complete runtime support. Its private scripts/build-agents.mjs SHALL accept validate and sync modes, with sync --dry-run/--check and common --repo-root/--json. It SHALL reject invalid options without writes and SHALL NOT invoke removed public commands. Apply SHALL reuse this engine from installed package assets, not the project's mutable skill copy. No separate generation implementation or self-repair cache SHALL be maintained.

#### Scenario: Generation runs after cloning without the CLI
- **WHEN** supported Node, versioned inputs, and the complete build skill are present
- **THEN** its private script validates, previews, synchronizes, and checks freshness without package installation, Git, network, or an agentscli executable

#### Scenario: Bootstrap encounters a modified local build script
- **WHEN** apply refreshes an existing consumer
- **THEN** it uses the trusted installed package's engine for preflight and replaces the product-owned copy without executing that project copy

#### Scenario: Private generation is requested with invalid options
- **WHEN** the script receives migration/language flags, repeated flags, validate --check, or incompatible preview/check options
- **THEN** it returns usage exit 2 without writes or implicit initialization/migration
