# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

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
