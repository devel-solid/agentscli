# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

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
