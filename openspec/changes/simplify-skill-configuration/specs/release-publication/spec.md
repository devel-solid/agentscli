# Spec Delta

## ADDED Requirements

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
