# release-publication Specification

## Purpose

Deliver the complete experimental agentscli product as a small MIT-licensed npm package, preserving the existing source history and using ordinary native Git/npm maintainer operations.

## Requirements

### Requirement: The first public artifact has one explicit identity

The product, repository name, and executable SHALL be agentscli. The npm package SHALL be @devel-solid/agentscli. Public repository links SHALL use devel-solid/agentscli. The initial version SHALL be 0.1.0 under MIT with consistent package/lockfile metadata and license text. Private 3.0.2 and old content tags SHALL NOT determine the initial version.

#### Scenario: Initial release metadata is inspected
- **WHEN** the candidate archive and maintained metadata are reviewed
- **THEN** the package is @devel-solid/agentscli@0.1.0 under MIT and the executable/repository retain agentscli

### Requirement: The first release includes both document languages and English skills

The first artifact SHALL include English product text, en and pt-br project document templates/notices, and the three English client skills. The concise English README SHALL explain the final workflow and publication. No later English change or release SHALL be required.

#### Scenario: Language readiness is reviewed
- **WHEN** the 0.1.0 candidate is presented
- **THEN** en is the default, --lang pt-br is available, all three client skills are English, and no chat-language policy is added

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
- **WHEN** an operational skill's metadata.agentscli names agentscli-skill.yml
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

### Requirement: Readiness uses unit-only gates and ordinary artifact inspection

Readiness SHALL require passing lightweight unit/type/format gates, build, and package file/metadata inspection. It SHALL NOT require integration, installed-package, subprocess, Git/registry test suites, disposable environments, or a resource-heavy matrix. Native build/packaging SHALL remain delivery operations.

#### Scenario: The candidate is ready for delivery review
- **WHEN** unit gates, build, and package inspection pass
- **THEN** evidence identifies the candidate without claiming unperformed installation or integration tests

### Requirement: Repository rename preserves existing history

The existing source repository SHALL be renamed to devel-solid/agentscli with remote URLs and public references updated. Existing Git history and refs SHALL be preserved. The rename SHALL NOT export an independent-history snapshot, initialize a replacement repository, purge history, reset the checkout, or force-push.

#### Scenario: The authorized rename completes
- **WHEN** the existing repository is renamed and its remote is updated
- **THEN** the new identity exposes the preserved commit history and refs without an independent public-history handoff

### Requirement: An internal skill guides native CLI versioning and publication

Monorepo-only agentscli-adm-publish-packages SHALL release CLI npm packages: target-workspace versions, gates, archive inspection, candidate review, authorized Git/npm delivery, and verification. It SHALL derive each package's identity/tag pattern and execute its own deterministic checks. It SHALL NOT publish a user's hub content, be installed in consumers/hubs, or add a public release command, publication engine, or recovery journal.

#### Scenario: A maintainer prepares a release
- **WHEN** the internal release skill handles the request
- **THEN** it uses native Git/npm within the requested authorization and presents concrete source/artifact identities before external delivery

#### Scenario: The private monorepo root is inspected
- **WHEN** a maintainer requests release of the hub package
- **THEN** the skill selects the hub workspace metadata and `agentscli-hub-v<version>` tag rather than publishing or versioning the private root

### Requirement: Delivery effects wait for corresponding authorization

Repository rename, commit, tag, push, and npm publication SHALL wait for their corresponding execution authorization. Planning and local readiness SHALL perform none of those effects. The delivery procedure SHALL identify the reviewed source commit, the selected version's tag, exact artifact, and expected public effects. Existing authorization for an effect SHALL be reused within its scope.

#### Scenario: Local readiness is complete without publication authorization
- **WHEN** the candidate is ready but external effects are not authorized
- **THEN** those effects do not occur and actual delivery tasks remain pending

#### Scenario: A later release has a different version tag
- **WHEN** the user authorizes delivery of a reviewed subsequent release
- **THEN** the workflow uses that candidate's identified version tag and artifact rather than the first release's tag

#### Scenario: This workflow is invoked only to propose a change
- **WHEN** a request creates or updates planning artifacts for a release and rollout
- **THEN** it performs no implementation, commit, tag, push, publication, global-package update, or target-client write

### Requirement: Delivery verification respects immutable identities

After authorized publication, the maintainer SHALL verify public commit/tag and registry name/version/visibility/integrity against the candidate. Ambiguous responses SHALL be resolved by inspecting native remote state. Conflicting existing tags or versions SHALL stop delivery without replacement.

#### Scenario: The publication response is lost
- **WHEN** registry metadata for @devel-solid/agentscli@0.1.0 is inspected
- **THEN** matching integrity confirms delivery, mismatching content blocks it, and no blind republish occurs

#### Scenario: Only local package evidence exists
- **WHEN** change completion is reviewed
- **THEN** it reports local readiness and leaves actual publication/remote verification open

#### Scenario: A registry naming restriction changes the package identity
- **WHEN** the unscoped candidate is refused and the user selects the scoped package
- **THEN** delivery uses @devel-solid/agentscli@0.1.0 and agentscli-v0.1.0 while preserving the existing public v0.1.0 candidate tag

### Requirement: Account and name prerequisites are checked without collecting secrets

Release preparation SHALL verify repository access, npm package-name eligibility/account permission, and native authentication. A previous public-registry 404 SHALL NOT count as reservation or guaranteed publishability. Credentials SHALL NOT appear in chat, commands, logs, plans, or artifacts. Missing permission SHALL remain an explicit delivery blocker.

#### Scenario: A name lookup returned no package but publication is restricted
- **WHEN** the actual release checks detect a restriction
- **THEN** delivery stops with the required account action rather than claiming the name was reserved or adding a publication service

### Requirement: This change owns implementation through first delivery

This single change SHALL cover simplification, four canonical skills, both manifests, both document locales, unit tests, lean documentation, package readiness, history-preserving rename, and actual first release. Completion SHALL require verified authorized delivery rather than local readiness alone.

#### Scenario: The artifact is ready but unpublished
- **WHEN** change progress is reviewed
- **THEN** publication tasks remain open and the change is not represented as fully delivered

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

### Requirement: Major zero identifies beta and production begins at one

The monorepo SHALL document that a CLI package with major version zero is beta and production versions begin at `1.0.0`. Each package's own version SHALL determine its lifecycle independently. A beta contract change SHALL adopt the current contract directly without transition, migration, backward-compatibility readers, or machinery protecting old clients.

#### Scenario: A beta resource format changes

- **WHEN** a CLI at `0.x.x` changes its skill configuration contract
- **THEN** implementation replaces the old contract directly and rejects unsupported declarations
- **AND** release preparation does not introduce a transition period or require a production version merely because the change breaks the previous beta format

#### Scenario: Independent release identities are compared

- **WHEN** a hub repository has content version `1.0.0` while its authoring CLI is `0.x.x`
- **THEN** the hub content version does not classify either CLI as production
- **AND** manifest `schemaVersion` remains a format identity rather than a lifecycle or CLI version

#### Scenario: Production is reached

- **WHEN** a CLI package's major version becomes one or greater
- **THEN** it is treated as production and the major-zero exception no longer applies to that package

### Requirement: Versioning policy is discoverable repository guidance

The repository SHALL provide handwritten English `docs/conventions/versioning.md`, discoverable from root AGENTS.md for contract changes, planning, versioning, and delivery work. It SHALL state the beta/production boundary, direct beta replacement policy, independent package identities, and distinction from hub content and manifest formats. Release skills SHALL carry their own operational instructions without depending on this convention.

#### Scenario: An agent plans a breaking beta change

- **WHEN** it consults root instructions for contract or release work
- **THEN** it discovers the versioning convention and applies the beta policy without inventing compatibility work

#### Scenario: The publication skill runs its checks

- **WHEN** it prepares an otherwise valid package release
- **THEN** its required execution guidance exists in its own skill and support
- **AND** absence of the versioning convention does not become a declared dependency failure

### Requirement: This change delivers both affected CLI packages

Completion of this change SHALL include new independent beta releases of `@devel-solid/agentscli` and `@devel-solid/agentscli-hub`, with package/lock metadata, actual distributed generator stamps, unused immutable package-specific tags, and verified public npm artifacts. The private workspace root and user hub repositories SHALL NOT be released by this change.

#### Scenario: Both package assets change

- **WHEN** implementation and the required local gates are complete
- **THEN** release preparation derives an unused next beta version for each affected package from its own current version, impact, tags, and registry state
- **AND** the two versions need not match and neither advances to production solely for this beta format change

#### Scenario: A prepared release is published

- **WHEN** its reviewed source, exact archive, destination, and package-specific tag are delivered through native Git/npm
- **THEN** verification confirms the intended commit/tag, package name/version, visibility, executable metadata, and SHA-512 integrity
- **AND** ambiguous results trigger inspection of the same remote identity rather than blind republishing

#### Scenario: Only one publication completes

- **WHEN** one package is verified publicly and the other still needs an account action or failed-delivery resolution
- **THEN** the completed package remains recorded and remaining delivery tasks stay open
- **AND** successful publication is not repeated or overwritten

### Requirement: The active host installs and verifies the released CLI versions

After each affected package is publicly verified, delivery SHALL install that exact version into the active host's global npm environment. Verification SHALL confirm global package versions and the versions and resolution paths of both CLI executables. Missing affected packages SHALL be installed. This rollout SHALL preserve unrelated packages and other Node installations and SHALL NOT apply either CLI to projects.

#### Scenario: The consumer CLI is outdated and the hub CLI is absent

- **WHEN** both newly released package versions are publicly verified
- **THEN** delivery upgrades agentscli and installs agentscli-hub in the active npm prefix using exact released versions
- **AND** both resolved executables report those versions

#### Scenario: PATH still resolves another installation

- **WHEN** global npm metadata has the expected version but the invoked CLI reports a different one
- **THEN** delivery identifies and resolves the active host's relevant command-path mismatch before claiming local completion
- **AND** unrelated prefixes or projects are not modified to conceal the discrepancy

#### Scenario: Local installation fails after publication

- **WHEN** npm publication succeeds but a host update or executable verification fails
- **THEN** delivery reports the verified releases separately and leaves host rollout incomplete
- **AND** it does not republish packages to retry a local installation

#### Scenario: The workflow is still proposing this change

- **WHEN** this planning workflow creates artifacts containing publication and host-update tasks
- **THEN** it does not commit, tag, push, publish, install globally, or execute project apply
- **AND** implementation and delivery wait for a subsequent apply request

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
- **AND** impact assessment/release notes include init-to-apply in both CLIs, removed consumer validate/sync, private script invocations, protected authored/state paths, trigger-only self-contained convention rules with explicit card conversion, skill agentscli-skill.yml configuration files, and replacement/removal of edited managed resources

#### Scenario: Only the planning workflow is running
- **WHEN** these release tasks are generated
- **THEN** no package metadata, Git refs, registry publication, global installation, or external client repository is changed
