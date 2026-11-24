# hub-authoring Specification

## Purpose

Provide an independent Git project for authoring and releasing portable conventions and skills, with repeatable managed-resource application that preserves authorship/state and included skills for validation, version selection, and requested native Git publication.

## Requirements

### Requirement: Hub apply creates and refreshes projects through one public operation

The hub package SHALL expose only agentscli-hub apply <directory> plus help/version and --dry-run. First apply SHALL create an independent Git project from installed assets; repeated apply SHALL replace managed scaffold/skills and remove obsolete managed files. Init and public authoring/validation/publication commands SHALL be rejected without writes. Apply SHALL NOT create hosted repositories, commits, tags, or pushes.

#### Scenario: A new hub is initialized

- **WHEN** initialization targets a new or empty directory with Git available
- **THEN** the target contains a Git repository, project instructions, internal conventions, `shared/conventions/`, `shared/skills/`, and complete hub-authoring skills
- **AND** no remote repository, commit, tag, or push is created

#### Scenario: Initialization is previewed

- **WHEN** the initialization preview is requested
- **THEN** it reports planned setup and conflicts without creating a directory, running mutating Git operations, or writing files

#### Scenario: Git is unavailable

- **WHEN** first application cannot find Git required to initialize a new repository
- **THEN** it reports the missing prerequisite before creating the hub

#### Scenario: The former command name is used

- **WHEN** agentscli-hub init is requested
- **THEN** it returns usage failure with apply guidance without creating or changing a hub

#### Scenario: A newer package removes a managed support file

- **WHEN** apply refreshes an existing identified hub from installed assets
- **THEN** its five operational skill trees and managed scaffold match those assets, including replacement of edits and deletion of extra/obsolete managed files
- **AND** authored areas, the hub content version, Git metadata/policy, refs, remotes, and staging remain intact

### Requirement: A hub has an identifiable independent project role

A hub SHALL identify its format through agentscli-hub.yml with exactly schemaVersion: 1 and its semantic content version. Apply SHALL preserve authored AGENTS.md, docs/conventions, shared/conventions, and shared/skills, including removals, while replacing managed resources without merging edits. Invalid state, incompatible roles, unrelated occupied initial targets, and unsafe paths SHALL block writes. No whole-repository deletion or authored-content backup SHALL be required.

#### Scenario: An initialized hub is maintained

- **WHEN** an agent reads root AGENTS
- **THEN** it can discover internal conventions and the appropriate hub-authoring skills without a consumer configuration or source checkout

#### Scenario: Initialization is repeated

- **WHEN** an existing valid hub contains authored changes/removals and edited operational skill files
- **THEN** apply preserves authored instructions/internal conventions/shared resources and existing state, but replaces all five operational skill trees and removes their extra/stale files
- **AND** it does not resurrect deliberately removed authored conventions or shared resources

#### Scenario: A target belongs to an incompatible project

- **WHEN** initialization finds a consumer configuration or product source context in the target or an ancestor
- **THEN** it reports the conflicting role before initializing Git or writing scaffold files

#### Scenario: Existing project paths are outside the current shared roots

- **WHEN** a valid hub is refreshed and contains unrelated root directories, including `conventions/` or `skills/` with only `.gitkeep` files
- **THEN** apply preserves those paths under ordinary unrelated-content rules and refreshes only its managed areas
- **AND** it adds no directory conversion, automatic relocation, or special blocking based on those names

#### Scenario: Authored shared directories have been removed

- **WHEN** an identified hub has deliberately removed an authored shared directory
- **THEN** repeat apply preserves that deletion rather than recreating authored scaffold files

### Requirement: Hub manifest version identifies content independently of the CLI

The hub manifest's `version` SHALL identify that repository's shared content, initially `1.0.0`, independently of the generating CLI's npm version. Content release tags SHALL use `v<version>` in the hub repository. `schemaVersion` SHALL identify file format only. Repeated apply or a CLI upgrade SHALL NOT reset or advance the hub version. Validation SHALL reject missing or invalid content versions mechanically.

#### Scenario: An experimental CLI initializes a stable-versioned hub
- **WHEN** `agentscli-hub` version `0.1.0` initializes a new hub
- **THEN** the hub manifest contains `version: 1.0.0` and `schemaVersion: 1`, without copying the CLI version
- **AND** initialization creates no `v1.0.0` tag or commit

#### Scenario: A later CLI maintains an existing hub
- **WHEN** CLI version `0.2.0` repeats apply on a hub at content version `1.4.0`
- **THEN** the hub manifest retains `version: 1.4.0` regardless of the CLI version

#### Scenario: A content release is prepared
- **WHEN** an author prepares hub content version `1.1.0` through the ordinary Git workflow
- **THEN** its manifest version and proposed `v1.1.0` tag identify the same content release without requiring an agentscli-hub package release

### Requirement: Resource paths determine availability and identity

Shareable conventions SHALL be discovered recursively as `shared/conventions/**/*.tpl.md`, identified by relative path without the suffix. Shareable skills SHALL be complete direct-child directories under `shared/skills/`, identified by directory name. Hub instructions, internal conventions, and `.agents/skills/` SHALL NOT become shared resources. Discovery SHALL require no maintained catalog or configurable alternative roots. The beta layout SHALL be adopted directly without fallback discovery, conversion, migration, or special detection/blocking of former root directories.

#### Scenario: Internal and shared skills coexist

- **WHEN** `.agents/skills/agentscli-hub-write-shared-skills/` and `shared/skills/code-review/` exist
- **THEN** only `code-review` is available as a shared skill

#### Scenario: A nested convention exists

- **WHEN** `shared/conventions/testing/unit.tpl.md` is valid
- **THEN** its resource ID is `testing/unit`, independently of other conventions or directory inheritance

#### Scenario: Current shared roots determine resource identity

- **WHEN** `shared/conventions/testing/unit.tpl.md` and `shared/skills/review/SKILL.md` exist
- **THEN** their IDs are `testing/unit` and `review`, with no `shared/` prefix in selection or dependency references

#### Scenario: Files outside the shared roots resemble exportable resources

- **WHEN** convention templates or skill entrypoints exist outside `shared/conventions/` and `shared/skills/`
- **THEN** they are not exported as shared resources and are not read as an alternative layout

### Requirement: Hub resource formats are mechanically validated

Shared convention templates SHALL use trigger-only YAML frontmatter, UTF-8, one H1, and a canonical basename; they SHALL be self-contained and contain no requires or links to other conventions or skills. Skill entrypoints SHALL keep standard matching name/description frontmatter and optional string metadata.agentscli: agentscli-skill.yml. Validate complete trees, referenced dependency files, safe identities/paths, aliases, and portable collisions deterministically.

#### Scenario: A convention filename disagrees with its heading

- **WHEN** `shared/conventions/unit.tpl.md` has the H1 `Unit testing`
- **THEN** validation fails with the expected `unit-testing.tpl.md` name and does not change the resource

#### Scenario: A shared skill includes support files

- **WHEN** `shared/skills/code-review/` contains scripts, references, or binary support files
- **THEN** those files belong to the skill tree and are checked for safe portable paths

#### Scenario: A shared skill needs exact opaque bytes

- **WHEN** a UTF-8-looking support payload is byte-sensitive
- **THEN** authoring guidance directs a committed `-text` attribute so acquisition records exact-byte representation rather than normalizing that payload

#### Scenario: A shared skill invokes an executable directly

- **WHEN** its procedure calls `./scripts/check.sh`
- **THEN** authoring guidance preserves its intended regular executable Git mode for consumer installation and explains that Windows retains the metadata for capable platforms

#### Scenario: The shared parent or a resource path is unsafe

- **WHEN** a current shared-resource path has an unsafe parent, link, escape, hard-link alias, or portable name collision
- **THEN** ordinary preflight identifies the unsafe path and blocks planned mutation

### Requirement: Dependencies are declared as typed resource identities

Only skills SHALL declare dependencies through optional string metadata.agentscli: agentscli-skill.yml, pointing to a contained sibling mapping with optional requires as a skill-only reference list. Each entry SHALL contain exactly string id and source: local or hub. Shared skills SHALL require same-hub skills only. Invalid configuration, origins, duplicate references, obsolete declarations, or missing targets SHALL fail. Conventions SHALL have no dependencies.

#### Scenario: A skill depends on a convention
- **WHEN** shared skill configuration encodes a convention dependency or the former conventions/skills mapping
- **THEN** validation rejects that unsupported structure rather than accepting a same-name convention as a skill

#### Scenario: A dependency example appears in a code block
- **WHEN** an entrypoint teaches dependency syntax in a fenced Markdown example
- **THEN** the example neither declares dependencies nor substitutes for the real metadata pointer and referenced YAML file

#### Scenario: A dependency is renamed without updating its consumers
- **WHEN** a declaration still refers to an absent skill ID
- **THEN** validation reports the referring skill and missing dependency before any sharing operation succeeds

### Requirement: Portable references retain their consuming context

Conventions SHALL be self-contained and link to no convention/skill. Trigger/body link checks SHALL use their correct output bases. Skills SHALL link only their own support among skill/convention resources; required external resources SHALL use id/source and agent discovery, never direct links or hardcoded locations. Hub validators SHALL check supported targets without network/execution, alongside semantic portability/self-containment review.

#### Scenario: A skill is moved with its complete support tree
- **WHEN** a complete skill directory is installed or moved within an applicable project context
- **THEN** its own support links still resolve without the hub checkout
- **AND** external skill dependencies use identity-based discovery rather than links or assumed sibling paths

#### Scenario: A semantic dependency is described only in prose
- **WHEN** a convention relies on another convention through prose or a supported link
- **THEN** authoring review requires self-contained rules and deterministic checks reject the convention-to-convention or convention-to-skill link
- **AND** a skill's actual required resources belong in its source-aware agentscli-skill.yml rather than an undeclared prose-only dependency

### Requirement: Hub authoring skills ship their required validation code

Hub initialization SHALL install exactly agentscli-hub-write-conventions, agentscli-hub-edit-agents, agentscli-hub-write-shared-conventions, agentscli-hub-write-shared-skills, and agentscli-hub-publish under .agents/skills. Their independent sources SHALL come only from the hub package's assets/templates/skills. Each SHALL own one responsibility and its required scripts/support, without global hub CLI, source checkout, or another environment's skill dependency.

#### Scenario: An agent creates a convention

- **WHEN** the agent follows agentscli-hub-write-shared-conventions to create a shared resource
- **THEN** it writes the template under `shared/conventions/`, executes the included validator, and reports actual diagnostics separately from semantic review

#### Scenario: An agent maintains hub-internal guidance

- **WHEN** the task concerns the hub's own conventions or root AGENTS
- **THEN** agentscli-hub-write-conventions handles only internal conventions and agentscli-hub-edit-agents handles only root AGENTS, with separate entrypoints and validators

#### Scenario: A hub is cloned on another machine

- **WHEN** Node is available and the hub CLI is absent
- **THEN** its included authoring skills can run their validation scripts using only shipped resources

#### Scenario: Hub operational metadata follows the CLI artifact

- **WHEN** hub apply installs or replaces its five operational skill trees
- **THEN** each retains MIT, exactly compatibility: Requires Node.js >= 22., generatedBy @devel-solid/agentscli-hub, and generatorVersion equal to the installed hub CLI package's real version
- **AND** authored shared skills keep their own frontmatter and the hub manifest retains its independent content version

#### Scenario: A maintainer requests publication after initialization

- **WHEN** the maintainer asks the agent to publish hub changes
- **THEN** the initialized project already contains the skill and helpers needed for versioning and native Git publication

#### Scenario: All independent validators inspect the same current layout

- **WHEN** any of the five hub operational skills validates its own assigned scope
- **THEN** shared resources are discovered under `shared/` and internal resources retain their separate project locations
- **AND** shared skill support remains valid after installation under `.agents/skills/<id>/`

### Requirement: Hub release chooses the content version for the maintainer

On a publication request, the agent SHALL assess changes since the latest published content release and select the appropriate semantic bump without requiring user version selection. Included scripts SHALL deterministically derive and validate the candidate from that assessment and actual manifest/refs. The first release SHALL use `1.0.0`; unchanged already-published content SHALL NOT create another version. An explicitly requested version SHALL be validated as an override.

#### Scenario: Compatible resources are added
- **WHEN** an existing hub gains a convention or skill without incompatible changes
- **THEN** the agent selects a minor bump, explains the impact briefly, and its script computes the next available candidate without asking the user to choose a version

#### Scenario: An existing contract becomes incompatible
- **WHEN** a release removes/renames a resource ID, adds a required dependency, or changes consumed rules/procedures incompatibly
- **THEN** the agent selects a major bump rather than publishing it as a compatible patch or addition

#### Scenario: Only compatible corrections are needed
- **WHEN** changes fix existing content or maintain internal hub tooling without incompatible consumer impact
- **THEN** the workflow selects a patch bump and updates the hub manifest mechanically

#### Scenario: The first content release is requested
- **WHEN** no content release has been published
- **THEN** the workflow selects the scaffold's `1.0.0` and prepares `v1.0.0`, independently of the CLI package version

### Requirement: Requested hub publication is completed by its release skill

agentscli-hub-publish SHALL validate hub context, requested scope, resources/dependencies, candidate version, authentication/destination, and refs. Within publication authorization it SHALL update the content manifest, create a scoped commit and immutable v<version> tag, push intended refs, and verify remote commit/tag/manifest agreement through native Git. It SHALL require no public release command or manual version/commit/tag operation and SHALL NOT publish CLI npm packages.

#### Scenario: A maintainer asks to publish
- **WHEN** destination and native authentication are available and checks pass
- **THEN** the agent completes manifest update, validation, commit, tag, push, and verification without requiring manual Git steps or another routine approval

#### Scenario: No publication destination is configured
- **WHEN** the release cannot determine an unambiguous remote/release branch
- **THEN** it requests only that missing destination and does not ask the maintainer to choose the content version

#### Scenario: The hub workflow encounters a product source repository
- **WHEN** the requested root has the monorepo's internal context instead of a hub marker
- **THEN** it reports incompatible context and performs no content or npm release

### Requirement: Hub release respects scope and write-free previews

The release skill SHALL preserve unrelated files/staging and restrict Git effects to the requested hub release. Preview/review requests SHALL leave project files, index, commits, and refs unchanged while reporting the assessed bump and concrete candidate. Missing access or divergent release state SHALL be diagnosed without forced updates. It SHALL NOT create a hosted repository, collect credentials, or publish an npm package.

#### Scenario: Release preview is requested
- **WHEN** the agent assesses a candidate without publication authorization
- **THEN** it reports version, diff, destination, and planned effects without editing the manifest, staging files, or creating/pushing refs

#### Scenario: Unrelated staged work exists
- **WHEN** a scoped hub release is performed
- **THEN** that work retains its content/staging and is not included merely because it is already staged

### Requirement: Hub release retries preserve prepared identities

The release skill SHALL inspect native local/remote state after partial or ambiguous delivery and resume or verify the same version/commit/tag. Matching completed delivery SHALL be success; conflicting existing identities SHALL block without replacement. Partial branch/tag pushes SHALL remain partial until all intended refs are verified. Retry SHALL NOT blindly bump again or add a release journal.

#### Scenario: Tag push succeeds but its response is lost
- **WHEN** retry finds the intended remote tag and commit already match the prepared candidate
- **THEN** it verifies remaining intended refs and reports the same version rather than allocating a new one

#### Scenario: A tag name is occupied by different content
- **WHEN** the existing identity disagrees with the reviewed candidate
- **THEN** publication stops without force-pushing or moving that tag

### Requirement: Hub authorship does not imply Git publication

Hub skills SHALL respect requested review, authorship, and validation scope. Mechanical checks SHALL NOT mutate Git state or publish resources. Initialization failures after mutation SHALL report completed and remaining setup effects without claiming rollback; ordinary hub maintenance SHALL use standard Git operations within the user's authorization.

#### Scenario: Only validation is requested
- **WHEN** an agent runs a hub-authoring validator
- **THEN** it reports findings without editing resources, creating Git refs, or accessing a remote
