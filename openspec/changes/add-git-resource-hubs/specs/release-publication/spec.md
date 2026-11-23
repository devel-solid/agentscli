# Spec Delta

## ADDED Requirements

### Requirement: A monorepo prepares two independent package artifacts

The repository SHALL host agentscli and agentscli-hub as two npm workspaces under one private orchestration root and lockfile. Each SHALL have its own package metadata, executable, version, README, and MIT license in its artifact. Root checks SHALL cover both packages using the existing Node lines and unit-only policy. Neither artifact SHALL require a source checkout or the other CLI's global installation.

#### Scenario: A developer uses the root workflow
- **WHEN** dependencies are installed from the root lockfile and the general check gate runs
- **THEN** both workspace unit/type/format checks are covered without publishing the private root package

#### Scenario: A maintainer inspects both archives
- **WHEN** the workspace candidates are built and packed
- **THEN** each archive has its own executable, metadata, README, MIT license, and complete required runtime/resources without monorepo-only references

### Requirement: The hub CLI starts with the established initial version pattern

The new package SHALL be `@devel-solid/agentscli-hub`, executable `agentscli-hub`, initially version `0.1.0` under MIT, with tag `agentscli-hub-v0.1.0`. Subsequent tags SHALL use `agentscli-hub-v<version>`. This SHALL follow the original agentscli `0.1.0` and `agentscli-v<version>` pattern while keeping package versions independent. Existing published identities SHALL remain unchanged.

#### Scenario: The initial hub release candidate is prepared
- **WHEN** its package and root lockfile metadata are reviewed
- **THEN** both identify `@devel-solid/agentscli-hub@0.1.0` and the candidate uses `agentscli-hub-v0.1.0`
- **AND** the existing agentscli version and tags are not reset to match it

#### Scenario: A created hub has a different content version
- **WHEN** the `0.1.0` hub CLI artifact is inspected
- **THEN** its new-hub scaffold defaults to manifest content `version: 1.0.0`
- **AND** the CLI's `agentscli-hub-v0.1.0` product tag is independent of a created hub repository's `v1.0.0` content tag

### Requirement: Hub implementation is followed by a new agentscli release

This change SHALL include readiness and verified delivery of the initial hub CLI and a new agentscli version after hub implementation. Consumer version selection SHALL reflect the implemented impact and actual available registry/tag identities. Completion SHALL require real publication and verification for both artifacts; local readiness alone SHALL NOT close delivery tasks. Proposal creation SHALL perform no implementation or release effects.

#### Scenario: The hub is implemented and both artifacts are locally ready
- **WHEN** progress is reviewed before publication
- **THEN** release tasks remain open until the exact hub and new agentscli artifacts are published and verified

#### Scenario: The consumer already has later versions than the hub
- **WHEN** package versions are selected
- **THEN** agentscli receives a new available version based on its own current metadata while the initial hub package remains `0.1.0`
- **AND** impact assessment/release notes include init-to-apply in both CLIs, removed consumer validate/sync, private script invocations, protected authored/state paths, trigger-only self-contained convention rules with explicit card conversion, skill requires.yml files, and replacement/removal of edited managed resources

#### Scenario: Only the planning workflow is running
- **WHEN** these release tasks are generated
- **THEN** no package metadata, Git refs, registry publication, global installation, or external client repository is changed

## MODIFIED Requirements

### Requirement: The published package contains only delivery resources

Each npm package SHALL contain compiled runtime, applicable templates, complete independent skill/support trees, README, license, and metadata. The consumer SHALL include only its four operational skills; the hub CLI SHALL include only its five. Administrative/OpenSpec skills, agentscli.yml, tests, and checkout references SHALL be excluded. Installation SHALL require no compilation or resource download. Hub content publication SHALL use agentscli-hub-publish, not an administrative skill.

#### Scenario: Package contents are inspected
- **WHEN** npm pack --dry-run and each candidate archive are reviewed
- **THEN** its required runtime/resources and metadata are present and repository-only material is absent

#### Scenario: A distributed skill has executable support code
- **WHEN** the candidate's complete skill directory is inspected
- **THEN** the scripts and custom dependency closure needed by that skill are included without references to root node_modules or unshipped siblings

#### Scenario: Prepared skill stamps are inspected after version selection
- **WHEN** either real package version is selected and its archive is built
- **THEN** deterministic checks confirm all of its four or five operational skill frontmatters contain MIT, exactly compatibility: Requires Node.js >= 22., and string generatedBy/generatorVersion matching that archive's own package.json name/version
- **AND** stale versions, cross-package versions, content versions used as generator versions, or unresolved placeholders block delivery

#### Scenario: A declared skill dependency file is packaged
- **WHEN** an operational skill's metadata.requires names requires.yml
- **THEN** its archive contains the regular complete YAML file and deterministic checks validate id/source references against the correct desired package/project environment
- **AND** archive examples/defaults use trigger-only self-contained conventions and standard skill metadata, not old card/dependency comments or encoded dependency values

#### Scenario: Operational guidance contains cross-resource links
- **WHEN** deterministic archive/source checks inspect the nine distributed skill trees
- **THEN** links/hardcoded instruction paths into conventions or other skills block delivery, while own support links and path-free id/source requirements remain valid
- **AND** packaged guidance discovers external skill entrypoints by project identity instead of copying another skill's location

#### Scenario: The consumer generation engine is packaged
- **WHEN** the build skill's archive tree and public bootstrap imports are inspected
- **THEN** its real validation/rendering/planning/application code and runtime closure live inside that skill and work with Node/project files alone
- **AND** apply reuses the packaged engine without a duplicate runtime implementation or recursively embedded packaged-skill repair baseline

#### Scenario: Hub content release support is packaged
- **WHEN** the hub CLI archive is inspected
- **THEN** it contains agentscli-hub-publish and the other four independent hub skill trees, while excluding all three administrative skills
- **AND** the consumer package does not install the hub's content release skill

### Requirement: An internal skill guides native CLI versioning and publication

Monorepo-only agentscli-adm-publish-packages SHALL release CLI npm packages: target-workspace versions, gates, archive inspection, candidate review, authorized Git/npm delivery, and verification. It SHALL derive each package's identity/tag pattern and execute its own deterministic checks. It SHALL NOT publish a user's hub content, be installed in consumers/hubs, or add a public release command, publication engine, or recovery journal.

#### Scenario: A maintainer prepares a release
- **WHEN** the internal release skill handles the request
- **THEN** it uses native Git/npm within the requested authorization and presents concrete source/artifact identities before external delivery

#### Scenario: The private monorepo root is inspected
- **WHEN** a maintainer requests release of the hub package
- **THEN** the skill selects the hub workspace metadata and `agentscli-hub-v<version>` tag rather than publishing or versioning the private root

### Requirement: Reusable release guidance derives candidates from current state

agentscli-adm-publish-packages SHALL derive target package identity, version, repository destination, and tag from current workspace metadata, refs, registry state, and requested impact. It SHALL use semantic versioning and preserve identities without lockstep versions. It SHALL NOT repeat a completed rename, select subsequent versions from first-release history, or depend on agentscli.yml or another environment's publication skill.

#### Scenario: A later documentation and skill release is prepared
- **WHEN** the target package metadata is `0.3.0` and requested changes preserve runtime contracts
- **THEN** the workflow proposes an available patch version and identifies its exact source, version tag, artifact, and integrity before delivery
- **AND** it checks current remote and registry state rather than reusing the first release's tag

#### Scenario: A proposed release identity is already occupied
- **WHEN** preparation discovers an existing version or tag that conflicts with the candidate
- **THEN** delivery stops for selection of an unused identity without moving a published tag, overwriting an artifact, or rewriting repository history

#### Scenario: The repository already has its intended public identity
- **WHEN** a subsequent release is prepared
- **THEN** the workflow uses the verified current destination without asking to repeat the original rename

#### Scenario: Only one workspace needs a subsequent change
- **WHEN** its reviewed impact requires a release
- **THEN** its version can advance without changing the other package's version merely for alignment
