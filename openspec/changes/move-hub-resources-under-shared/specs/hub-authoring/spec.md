# Spec Delta

## MODIFIED Requirements

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
