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

The npm package SHALL contain compiled runtime code, client templates and complete distributed skill trees, README, license, and package metadata. Internal skills/manifest, OpenSpec, tests, obsolete assets, and development-checkout references SHALL be excluded. Installation SHALL require no compilation or extra setup-resource downloads.

#### Scenario: Package contents are inspected
- **WHEN** npm pack --dry-run and the candidate archive are reviewed
- **THEN** the required runtime/client resources and metadata are present and repository-only material is absent

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

Repository-only agentscli-release SHALL guide CLI version changes, unit gates, build/package inspection, concrete commit/tag/artifact review, authorized Git/npm delivery, and verification. It SHALL NOT be installed in clients or add a release command, publication engine, content-release stream, or recovery journal.

#### Scenario: A maintainer prepares a release
- **WHEN** the internal release skill handles the request
- **THEN** it uses native Git/npm within the requested authorization and presents concrete source/artifact identities before external delivery

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

The internal release skill SHALL derive package identity, version, repository destination, and candidate tag from current metadata, existing refs, registry state, and the requested change. It SHALL use semantic versioning and preserve published identities. It SHALL NOT prescribe repeating a completed repository rename or choosing a version from historical first-release narrative.

#### Scenario: A later documentation and skill release is prepared
- **WHEN** current package metadata is `0.3.0` and the requested changes preserve runtime contracts
- **THEN** the workflow proposes an available patch version and identifies its exact source, version tag, artifact, and integrity before delivery
- **AND** it checks current remote and registry state rather than reusing the first release's tag

#### Scenario: A proposed release identity is already occupied
- **WHEN** preparation discovers an existing version or tag that conflicts with the candidate
- **THEN** delivery stops for selection of an unused identity without moving a published tag, overwriting an artifact, or rewriting repository history

#### Scenario: The repository already has its intended public identity
- **WHEN** a subsequent release is prepared
- **THEN** the workflow uses the verified current destination without asking to repeat the original rename

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
