# skill-authoring Specification

## Purpose

Guide the creation and maintenance of concise agentscli skills whose discovery procedures, operational conditions, and packaged resources remain useful as projects evolve.

## Requirements

### Requirement: The repository exposes portable skill-authoring guidance

The repository SHALL provide handwritten English `docs/conventions/skill-authoring.md`, discoverable from `AGENTS.md` when creating, reviewing, or refactoring owned skills and their support files. It SHALL preserve the reusable rules and positive/negative examples for owned skills, using repository-local framing and references without adding external links or a bibliography.

#### Scenario: An agent starts maintaining an owned skill
- **WHEN** the agent consults the root instructions for a skill-authoring task
- **THEN** it finds the convention's applicability and link without loading the full guidance into `AGENTS.md`

#### Scenario: Reusable skill guidance is maintained locally
- **WHEN** the handwritten convention is reviewed
- **THEN** it retains the rules for scope, decision-relevant content, selective consultation, language, preservation, discovery, and verification
- **AND** it retains positive/negative examples for discovery, secrets, concision, selective consultation, and precision, translated into English
- **AND** generated notices and client-only formatting are absent, and its internal links resolve to this repository's applicable conventions

### Requirement: Skills contain decision-relevant instructions

Owned skills SHALL describe a coherent task with a concise activation description, necessary inputs, useful procedure, non-obvious constraints, and completion criteria. They SHALL omit generic tutorials, repeated guidance within the same skill, transient state, and historical narrative that does not change execution. Necessary conditions and exceptions SHALL remain explicit or be consulted before their dependent action.

#### Scenario: A paragraph is considered for removal
- **WHEN** maintainers shorten a skill containing a conditional restriction
- **THEN** they preserve both the restriction and its applicability or provide a reliable consultation step before the restricted action
- **AND** they do not turn a conditional rule into an unconditional requirement merely to shorten it

#### Scenario: Skill descriptions are reviewed
- **WHEN** an agent selects between convention authorship, AGENTS authorship, client generation, and package release
- **THEN** the descriptions distinguish those tasks without attracting unrelated work

### Requirement: Movable project resources are discovered through evidence

For resources whose location is not a fixed public contract, skills SHALL start from the identified project and applicable instructions, describe how to recognize the responsible source through purpose, configuration, metadata, or consumers, and verify its role before use. They SHALL avoid machine-specific paths, assumed directory depth, and vague discovery instructions that give no recognition criteria.

#### Scenario: A responsible project source moves
- **WHEN** the source is renamed or relocated and its maintained links or metadata are updated
- **THEN** the skill can still identify and use it without embedding its former location

#### Scenario: Several sources appear relevant
- **WHEN** discovery finds multiple plausible candidates
- **THEN** the agent checks their current links or consumers and reports any material ambiguity that remains before choosing a target

### Requirement: Fixed contracts and packaged references remain precise

Skills SHALL retain exact names, paths, markers, options, and resolution rules when required by a verified public contract. Resources distributed with a skill SHALL use links relative to that skill where useful. A portability rule SHALL NOT replace a fixed contract with speculative discovery or require changes to the CLI layout.

#### Scenario: The client template layout is described
- **WHEN** a skill directs client authorship
- **THEN** it preserves the fixed `.agentscli/config.yml`, `.agentscli/templates/AGENTS.tpl.md`, convention-source subtree, and applicable operational markers
- **AND** the convention explicitly permits these contractual paths

#### Scenario: A skill has bundled support files
- **WHEN** its entire directory is moved or packaged
- **THEN** the relative references still reach included resources without a source checkout or machine-specific base path

### Requirement: Support content is selective and distribution remains self-contained

Skills SHALL keep common-path guidance in their entrypoint and link substantial operation-specific content only when it has a concrete purpose, with a clear consultation condition. Every skill SHALL carry its required operation instructions in its own entrypoint or bundled support, with only other skills as declared resource dependencies. Deduplication SHALL NOT introduce a required reference to conventions or unshipped external instruction files.

#### Scenario: A short skill needs no supporting resource

- **WHEN** its useful instructions already fit a concise entrypoint
- **THEN** no router, placeholder reference, or additional support tree is required

#### Scenario: The new authoring convention is not installed in a client

- **WHEN** a client uses any of the four distributed consumer skills
- **THEN** the skill can complete its task without relying on this repository's authoring convention

#### Scenario: A skill's own support is needed

- **WHEN** its procedure uses its own scripts, references, assets, or general configuration
- **THEN** those resources remain inside its complete skill distribution and own relative links remain valid

#### Scenario: Project files are operation inputs

- **WHEN** a skill edits a convention, reads package metadata, or generates from project configuration and templates
- **THEN** it can read those files as work inputs without declaring them as instruction dependencies
- **AND** its procedure and required execution guidance remain within its own skill or declared skill dependencies

#### Scenario: A convention supplies a missing procedure

- **WHEN** review finds that executing a skill requires consulting a convention to learn its operation
- **THEN** the required procedure is maintained within the responsible skill and its convention dependency is removed
- **AND** project conventions remain general guidance without becoming skill entrypoints

#### Scenario: Resources are directly linked

- **WHEN** a skill entrypoint or support links directly to a convention or another skill's tree, including an executable fixed-path example
- **THEN** mechanical checks reject that target even if the other skill is a declared dependency
- **AND** the skill discovers required skills by identity while conventions remain self-contained without resource links

#### Scenario: Mechanical checks pass but instructions are incomplete

- **WHEN** schema, identity, path, link, and dependency checks pass
- **THEN** semantic review still assesses instruction completeness, activation, and one-responsibility boundaries
- **AND** passing structural checks alone does not prove self-containment

#### Scenario: A shared skill references another resource
- **WHEN** a shared skill needs another skill for its procedure
- **THEN** it declares the skill-only id/source in agentscli-skill.yml, requires explicit consumer selection, and discovers the target from the project
- **AND** project conventions may remain work inputs without becoming declared dependencies or supplying missing procedures

#### Scenario: A skill-local script uses shared validation logic
- **WHEN** its complete directory is distributed or moved
- **THEN** its own required custom runtime code remains included and local imports resolve without another environment's skill or a source checkout

### Requirement: Refactoring preserves operational context and authorization

All owned product skills SHALL preserve established editing targets, applicable language rules, context rejection, requested-operation boundaries, validation contracts, and failure guidance, with hub-specific extensions explicit. Simplification SHALL NOT imply installation, initialization, migration, generation, hub acquisition, Git mutation, or publication beyond the active request, nor add confirmation where existing authorization suffices.

#### Scenario: A repository maintainer authors instructions
- **WHEN** source package/workspace identity validates administrative authorship
- **THEN** only the appropriate agentscli-adm-* skill targets handwritten English files and performs no client operation in the monorepo or its descendants

#### Scenario: A Portuguese client requests source authorship
- **WHEN** valid configuration selects `pt-br`
- **THEN** the skill edits the appropriate local template in Portuguese while its own instructions remain English and generated documents remain replaceable

#### Scenario: The context is invalid or incompatible
- **WHEN** the selected skill's context is missing, malformed, conflicting, legacy, or belongs to another environment, including a protected tool-package ancestor
- **THEN** the skill diagnoses the applicable problem before edits and does not guess a valid mode or silently initialize or migrate

#### Scenario: Review or preview alone is requested
- **WHEN** the request is limited to review, preview, or checking
- **THEN** the skill performs no project writes and reports only actual findings and checks
- **AND** a remote hub preview clearly distinguishes disposable fetch storage from a fully offline local check

#### Scenario: Client generation is authorized
- **WHEN** the build skill's own scripts validate inputs and their preview matches the requested scope
- **THEN** those scripts perform the authorized sync and freshness check with Node/project files alone, without an extra approval solely because preview succeeded
- **AND** it preserves authored templates and accepted state while replacing edited managed documents/installed skills and removing obsolete managed files without a merge

#### Scenario: An operational update fails partway through
- **WHEN** sync, explicit migration, or a hub-management operation reports completed and remaining effects
- **THEN** the skill reports partial completion and directs retrying the same operation/options or explicitly reconciling ambiguous hub state rather than changing operations or claiming rollback

#### Scenario: Client generation encounters an outdated remote hub
- **WHEN** the local snapshot is accepted but a newer remote tag exists
- **THEN** the build skill does not discover or adopt that remote update without an explicit hub-management request

### Requirement: Content-reduction refactors verify size and decisions

Content-reduction refactors SHALL compare total skill content and common-path reading before and after, including support files, and demonstrate actual aggregate reduction without arbitrary size quotas or moving excess elsewhere. Verification SHALL review representative decisions, descriptions, links, and format; a valid frontmatter alone SHALL NOT establish behavioral correctness.

#### Scenario: Shortened entrypoints move their paragraphs into references
- **WHEN** the combined content or common reading retains the same unnecessary material
- **THEN** the refactor does not qualify as a verified reduction merely because `SKILL.md` files became shorter

#### Scenario: A substantial skill refactor is reviewed
- **WHEN** maintainers assess readiness
- **THEN** they check representative context, scope, discovery, contract, and failure decisions against the previous behavior and run the available skill-format validator
- **AND** they distinguish documentary review from actions actually executed, without adding tests that merely match skill wording

### Requirement: Skills use one optional general configuration document

A skill SHALL declare optional configuration through string `metadata.agentscli: agentscli-skill.yml` in standard SKILL.md frontmatter. The pointer SHALL identify one regular contained sibling YAML mapping. Initially only optional `requires` is supported. Without the pointer there SHALL be no declared configuration; an unreferenced reserved configuration file SHALL fail validation.

#### Scenario: A skill declares another skill

- **WHEN** the pointer references a sibling file containing `requires` as a list of skill references
- **THEN** all applicable authoring, generation, import, and publication checks read that file as the skill's configuration
- **AND** the frontmatter metadata remains a mapping of strings to strings

#### Scenario: No additional configuration is needed

- **WHEN** a skill has neither the pointer nor a reserved configuration file
- **THEN** validation accepts it without creating an empty file or inferring dependencies

#### Scenario: An explicit empty configuration is provided

- **WHEN** the pointer references an empty YAML mapping or a mapping containing `requires: []`
- **THEN** the skill declares no dependencies
- **AND** a blank document or `requires: null` fails rather than acquiring an implicit meaning

#### Scenario: Configuration is missing or unsafe

- **WHEN** the pointer differs from `agentscli-skill.yml`, its target is absent or unsafe, or the reserved sibling file exists without the pointer
- **THEN** validation reports the declaring skill and offending field or file before writes

#### Scenario: Unsupported structure is supplied

- **WHEN** configuration has malformed UTF-8/YAML, duplicate or unknown keys, aliases, explicit tags, a nonmapping root, encoded structured text, or a nonlist `requires`
- **THEN** deterministic validation rejects it
- **AND** future supported contexts must be defined as sections in this same document rather than additional configuration files

### Requirement: Skill dependencies reference only skills

Each `requires` entry SHALL contain exactly string `id` and `source`, with source `local` or `hub`. Resolution SHALL target skills exclusively, using the declared identity and origin. Invalid or duplicate references and missing targets SHALL fail before writes. Conventions SHALL never satisfy a skill dependency or declare their own dependencies.

#### Scenario: A convention has the required identity

- **WHEN** a declaration names `inspect-tests` but only a convention with that identity exists
- **THEN** validation reports a missing skill dependency rather than accepting the convention

#### Scenario: A convention dependency is encoded explicitly

- **WHEN** configuration uses `conventions`, a typed convention reference, extra entry fields, or the old conventions/skills mapping
- **THEN** validation rejects the unsupported structure even if its lists are empty

#### Scenario: Origins distinguish same-name skills

- **WHEN** a local skill declares a hub skill and only a same-name local skill exists
- **THEN** validation rejects the unresolved hub dependency without origin fallback or global lookup

### Requirement: Skill dependency closure retains explicit project selection

Local skills SHALL depend only on available local skills or explicitly selected hub skills. Shared skills SHALL depend only on skills from their own hub at the same accepted revision. Every transitive hub dependency SHALL be explicitly selected. Dependency checks SHALL terminate for cycles without automatically selecting, downloading, invoking, or executing skills.

#### Scenario: A transitive dependency was omitted

- **WHEN** selected skill A requires B and B requires C but C is not explicitly selected
- **THEN** the complete prospective operation fails before mutation and identifies the missing skill and source

#### Scenario: Shared content requests project-local behavior

- **WHEN** an exported shared skill declares `source: local`
- **THEN** authoring, acquisition, and content-publication validation reject the nonportable declaration

#### Scenario: A declared cycle is fully available

- **WHEN** A requires B and B requires A and both are explicitly available from valid origins
- **THEN** closure validation terminates and verifies each identity without introducing an execution order or recursion policy

#### Scenario: Hub removal would break a local skill

- **WHEN** an update, deselection, switch, or detach would remove a skill required by an authored local skill
- **THEN** its complete prospective plan fails before writes
- **AND** convention selection remains independent of skill dependency closure

### Requirement: Configuration adoption replaces the beta dependency contract directly

Current validation SHALL reject `metadata.requires`, reserved `requires.yml`, root skill `requires`, and obsolete dependency comments. It SHALL NOT read, convert, or fall back to the former declaration format. This change SHALL add no compatibility reader, transition workflow, migration option, or manifest schema increment solely to protect old clients.

#### Scenario: Old dependency metadata is present

- **WHEN** a skill contains the former pointer or reserved dependency file
- **THEN** the operation fails with the skill and unsupported declaration identified
- **AND** it neither silently discards dependencies nor rewrites authored or accepted source files

#### Scenario: Accepted source still uses the old contract

- **WHEN** ordinary validation encounters a pinned snapshot containing a former dependency declaration
- **THEN** it fails without rewriting commit identity, snapshot bytes, hashes, or the lock
- **AND** this change provides no special transition route for that snapshot

#### Scenario: Replaceable operational copies contain the old file

- **WHEN** desired package assets use the new contract and an installed managed operational skill still contains the old pointer or file
- **THEN** apply validates desired declarations and replaces the managed tree, removing obsolete files
- **AND** this is normal managed-resource replacement rather than conversion of authored or accepted sources

### Requirement: General skill configuration ships with its owning tree

Assembly, apply, snapshot acquisition, offline generation, and archive inspection SHALL preserve and validate declared configuration with the complete skill tree. They SHALL use authoritative desired assets or accepted sources rather than edited managed outputs. Operational generator stamps SHALL derive from the owning package; shared metadata SHALL remain authored content.

#### Scenario: A package distributes dependent operational skills

- **WHEN** either CLI's operational assets are assembled or inspected
- **THEN** every declared configuration file is included and its dependencies resolve in the prospective environment
- **AND** the four consumer and five hub trees retain MIT, exact `compatibility: Requires Node.js >= 22.`, and actual generator name/version stamps

#### Scenario: An installed configuration is damaged

- **WHEN** an installed managed skill's configuration is missing, edited, or accompanied by obsolete files while authoritative input remains valid
- **THEN** ordinary replacement restores the intended complete tree without adopting the output as a dependency declaration

#### Scenario: Accepted configuration integrity is invalid

- **WHEN** a versioned accepted source configuration differs beyond its recorded representation and digest rules
- **THEN** offline validation fails before writes rather than treating it as repairable installation drift

### Requirement: Operational skills remain independent during configuration changes

The three administrative, four consumer, and five hub operational skills SHALL retain separate sources, single responsibilities, and their own deterministic support. All applicable checkers SHALL enforce the same new configuration and dependency contracts without shared custom implementations across environments. OpenSpec development skills SHALL remain outside this operational refactor.

#### Scenario: Similar validators need the new format

- **WHEN** multiple environments implement equivalent configuration checks
- **THEN** each owned implementation is updated and verified independently without a shared skill tree, proxy, or generated source template

#### Scenario: A skill has no supported extra information

- **WHEN** an administrative or hub operational skill has no dependencies or other configuration sections
- **THEN** it needs no replacement configuration file merely to preserve the old file count

### Requirement: Operational skills are independent by environment and responsibility

The 12 operational skills SHALL have separate owned sources: three administrative, four consumer, and five hub skills. Each SHALL perform one defined responsibility in one environment and reject other targets. Equal bodies SHALL NOT justify a shared entrypoint, parent skill template, proxy, symlink, or cross-environment custom script implementation. Editing one environment's skill SHALL NOT rewrite another environment's skill.

#### Scenario: Similar authorship exists in two environments
- **WHEN** their instructions or validators initially have identical content
- **THEN** each remains in its own approved source directory with independent SKILL.md and support ownership

#### Scenario: Internal and shareable hub conventions coexist
- **WHEN** a hub convention task is selected
- **THEN** agentscli-hub-write-conventions handles only internal guidance and agentscli-hub-write-shared-conventions handles only shared templates

#### Scenario: One environment's skill is maintained
- **WHEN** its body or custom script changes
- **THEN** the other environments' skill sources remain unchanged and are not regenerated from that edit

#### Scenario: Operational source locations are reviewed
- **WHEN** the approved skill set is inspected
- **THEN** administrative sources are under root .agents/skills, consumer sources under packages/agentscli/assets/templates/skills, and hub sources under packages/agentscli-hub/assets/templates/skills

### Requirement: Mechanical validation has a monorepo convention

The monorepo SHALL provide handwritten English `docs/conventions/mechanical-validation.md`, discoverable from root AGENTS, covering both CLIs and all owned skills. It SHALL require deterministic code for mechanically decidable checks, explain skill-local custom script ownership, and distinguish executable evidence from semantic review with small examples. It SHALL NOT add public commands merely for agent-only checks.

#### Scenario: An existing agentscli-only skill is maintained
- **WHEN** an agent consults root instructions for an authoring, generation, or release skill change
- **THEN** the mechanical-validation convention applies just as it does to the new hub skills

#### Scenario: Format checking and policy review are compared
- **WHEN** the convention explains validation responsibilities
- **THEN** it assigns filenames, schemas, markers, dependencies, and file inventories to deterministic checks
- **AND** it retains usefulness, contradictions, and project policy choices as semantic review

### Requirement: Owned skills execute deterministic mechanical checks

Every owned skill SHALL execute deterministic scripts or existing authoritative commands wherever a check can be mechanical. Each SHALL own its custom scripts/support and state when to run them and interpret failures. Prose inspection SHALL NOT replace executable evidence. Build SHALL assemble each independent source for its own environment; deduplication SHALL NOT introduce shared operational skill implementations across environments.

#### Scenario: A convention's filename and discovery card need checking
- **WHEN** a convention-maintenance workflow checks filename, trigger where applicable, and supported links
- **THEN** it executes its own deterministic checker and rejects requires declarations or convention-to-convention or convention-to-skill links instead of relying solely on prose inspection

#### Scenario: An authoritative existing command already implements a check
- **WHEN** a consumer authoring skill needs read-only client validation
- **THEN** it invokes the co-distributed build skill's private deterministic checker without implicit generation
- **AND** the build skill owns the actual check code rather than wrapping removed public CLI commands

#### Scenario: The internal release skill validates a candidate
- **WHEN** it checks mechanically decidable package metadata or archive inventory
- **THEN** deterministic code or native command results supply the evidence, while candidate impact and requested authorization remain contextual decisions

### Requirement: Skills explain authored state and managed replacement

Owned skill instructions SHALL distinguish authored content, preserved project state, and disposable managed resources. They SHALL direct consumer authorship to templates and hub authorship to protected hub areas. Apply/build SHALL replace managed edits and remove obsolete managed files without merging, backups, or recursive project reset. Only explicit language/migration/import/publication workflows SHALL change their corresponding state.

#### Scenario: A user customizes a generated skill or document
- **WHEN** the agent is asked to maintain consumer or hub setup
- **THEN** guidance explains that managed edits are replaced and routes intended authored changes to the appropriate template/shared-resource/internal-instruction source

### Requirement: Distributed operational skills declare license runtime and generator

Exactly the four consumer and five hub operational SKILL.md files SHALL declare license: MIT, exactly compatibility: Requires Node.js >= 22., and string metadata.generatedBy/generatorVersion. Their generator SHALL be the owning CLI package name and its actual package version, filled automatically during deterministic asset assembly. No independent skill version SHALL be required. These product fields SHALL NOT be required on administrative or shared/imported skills.

#### Scenario: Consumer operational skills are assembled
- **WHEN** the consumer package prepares its four independent skill trees
- **THEN** each declares MIT and the exact Node compatibility text, generatedBy is @devel-solid/agentscli, and generatorVersion equals that package's real version

#### Scenario: Hub operational skills are assembled
- **WHEN** the hub CLI package at version 0.1.0 prepares its five independent skill trees
- **THEN** each declares MIT and the exact Node compatibility text, generatedBy is @devel-solid/agentscli-hub, and generatorVersion is the string "0.1.0"
- **AND** a target hub's different content version does not change the generator stamp

#### Scenario: A stamp is stale or belongs to another package
- **WHEN** a distributed operational skill lacks required fields, has non-string provenance, unresolved placeholders, or differs from its owning package's actual name/version
- **THEN** deterministic asset/archive checks report the mismatch and block delivery rather than accepting or manually guessing a version

#### Scenario: An existing installation is refreshed
- **WHEN** apply uses a newer installed CLI artifact
- **THEN** its managed operational skill copies receive that artifact's prepared generatorVersion with no separate user choice or skill version bump
- **AND** another apply using identical assets produces no metadata-only drift or timestamp changes

#### Scenario: Authored or imported skills contain their own metadata
- **WHEN** the three administrative skills are maintained or a complete shared resource skill is imported
- **THEN** this generated-installation requirement does not stamp them or impose the nine product skills' license/compatibility/provenance fields
- **AND** imported frontmatter remains authored source content subject only to existing accepted-representation rules

### Requirement: Skills carry their own activation and execution guidance

Each owned skill SHALL describe its task/activation in standard description and keep procedures in its own body/support. Conventions SHALL NOT act as skill entrypoints, link to skill trees, or redirect execution. Misplaced procedures SHALL route to scoped skill authorship. Only skills SHALL satisfy dependencies through metadata.agentscli and agentscli-skill.yml; project sources SHALL remain work inputs rather than supplying missing procedures.

#### Scenario: A procedure was written as a convention
- **WHEN** review finds convention text whose purpose is to select/invoke a skill or teach that skill's procedure
- **THEN** the maintainer identifies the misplaced content and the separately scoped skill author maintains it in the skill, preserving its independent description trigger

#### Scenario: A skill requires project rules
- **WHEN** a skill reads project conventions or edits one as its work input
- **THEN** it does not declare a convention dependency or rely on the convention for missing execution guidance
- **AND** required procedures remain in its own entrypoint/support or responsible declared skill dependencies

### Requirement: Skills discover external resources instead of linking their locations

Skill entrypoints/support instructions SHALL NOT directly link conventions or other skill trees, or hardcode their paths/URIs in workflow instructions. They may mention skill identities and declare id/source dependencies; the agent SHALL discover actual project targets before use. Links to own agentscli-skill.yml/scripts/references/assets remain allowed. Deterministic authoring/asset/import checks SHALL reject cross-resource targets, including aliases, while preserving valid own-support links.

#### Scenario: A skill links to a convention
- **WHEN** an active supported link points to a local/shared convention source or generated output
- **THEN** validation rejects the direct link and guidance uses the convention identity plus project discovery instead

#### Scenario: A skill links to another skill or its support
- **WHEN** a link in SKILL.md or its support instructions targets another skill's entrypoint, directory, script, reference, or agentscli-skill.yml
- **THEN** deterministic checking reports the source/target and rejects the link even when that skill is a declared dependency

#### Scenario: A skill mentions another skill
- **WHEN** its instructions name agentscli-build-agents and agentscli-skill.yml declares that required local skill
- **THEN** the agent discovers its actual project entrypoint and reads its own invocation guidance without a fixed sibling path or implicit installation

#### Scenario: Own support is linked
- **WHEN** a skill points to its own agentscli-skill.yml, script, reference, asset, or internal anchor
- **THEN** that link remains valid and moving the complete directory preserves its local support references

#### Scenario: A command example bypasses Markdown link syntax
- **WHEN** executable workflow guidance embeds a fixed filesystem path into another skill or a convention
- **THEN** supported deterministic path checks reject that cross-resource path rather than accepting code formatting as an exemption
