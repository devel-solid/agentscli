# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Shared authoring skills select targets by manifest context`
- TO: `### Requirement: Environment-specific authoring skills validate their assigned context`
- FROM: `### Requirement: One convention-authoring skill serves both contexts`
- TO: `### Requirement: Each environment owns separate convention-authoring skills`
- FROM: `### Requirement: One shared AGENTS skill curates content and format`
- TO: `### Requirement: Each environment owns a separate AGENTS editing skill`
- FROM: `### Requirement: Distribution separates shared client and internal workflows`
- TO: `### Requirement: Distribution separates administrative consumer and hub workflows`
- FROM: `### Requirement: Shared authoring replaces fill-in comments with verified content`
- TO: `### Requirement: Environment-specific authors replace fill-in comments with verified content`

## ADDED Requirements

### Requirement: Convention maintenance enforces self-contained rules mechanically

All conventions SHALL be self-contained, declare no requires, and link to no other convention or skill. The administrative, consumer, internal-hub, and shared-hub convention-maintenance skills SHALL require this rule and execute their own deterministic supported-link/format checks. They SHALL report locations/targets before writes or publication. AGENTS discovery links and path-free skill dependency identities SHALL remain allowed; prose self-containment SHALL also receive semantic review.

#### Scenario: A convention links to a different local or shared convention
- **WHEN** a supported active Markdown/reference/image/HTML link resolves to another convention source or output, including fragments or queries
- **THEN** the owning validator reports the link and target as a blocking error rather than treating a successful resolution as valid

#### Scenario: Handwritten internal conventions are maintained
- **WHEN** administrative or hub-internal convention authorship/review runs
- **THEN** its independent skill checks the same self-containment and no-convention-or-skill-link rule without requiring generated-template frontmatter

#### Scenario: A convention has legitimate navigation
- **WHEN** links target its own sections or ordinary project files outside convention and skill trees and examples are literal
- **THEN** those targets are not mistaken for forbidden links to another convention or a skill

#### Scenario: A template tries to declare dependencies
- **WHEN** a convention frontmatter or active obsolete declaration contains requires
- **THEN** validation fails and directs authoring a self-contained rule rather than moving the dependency to a sidecar

#### Scenario: A convention links directly to a skill
- **WHEN** an active supported link in a convention trigger/body resolves to a skill entrypoint, directory, or support file in a local/shared/source/installed tree
- **THEN** its independent validator reports the location/skill target and blocks authoring/generation/import/publication preflight as applicable
- **AND** a SKILL.md link, skill-directory link, or requires.yml/script support link cannot use the ordinary project-file exception

#### Scenario: A convention redirects work to a skill
- **WHEN** convention maintenance identifies a skill invocation or procedure reference in the prose
- **THEN** semantic review routes that execution guidance to the responsible skill-authoring workflow, retaining the skill's own description-based trigger
- **AND** the convention maintainer keeps its existing single editing responsibility and does not edit skill bodies without the corresponding authoring scope

## MODIFIED Requirements

### Requirement: Client conventions are authored as independent templates

Client authors SHALL maintain only local .agentscli/templates/conventions sources with nonempty frontmatter trigger, one H1, and a matching canonical filename. Each convention SHALL be self-contained, declare no requires, and link to no other convention or skill. Validators SHALL check supported reference targets mechanically using generated contexts. Local templates participate without registration/inheritance. Imported sources SHALL use the separate hub workflow, never direct local edits.

#### Scenario: A client authors a convention
- **WHEN** .agentscli/templates/conventions/commits.tpl.md is saved with the H1 “Commits” and valid structure
- **THEN** validation recognizes it and sync generates .agentscli/conventions/commits.md and its root AGENTS entry

#### Scenario: Independent topics share a filename prefix
- **WHEN** policy.tpl.md and policy-details.tpl.md exist with their matching H1 headings
- **THEN** neither acquires child discovery or inheritance

#### Scenario: A nested convention links to a repository file
- **WHEN** an author adds a relative link to an ordinary repository file outside convention and skill trees
- **THEN** its validator resolves the link from the generated convention location
- **AND** a link resolving to another convention instead is rejected with the source location and target

#### Scenario: A requested edit targets an imported convention
- **WHEN** the source belongs to the accepted hub snapshot
- **THEN** the skill identifies hub ownership and directs hub maintenance or a complementary local rule without editing the imported bytes

### Requirement: Environment-specific authoring skills validate their assigned context

Administrative skills SHALL validate tool workspace/package identity; consumer skills SHALL require valid .agentscli/config.yml; hub skills SHALL require valid agentscli-hub.yml. Each SHALL use only its assigned environment and editing target. Deterministic checks SHALL reject missing, malformed, conflicting, legacy, or incompatible contexts before edits. agentscli.yml SHALL NOT select a workflow. Missing consumer configuration SHALL NOT imply administrative authorship.

#### Scenario: A maintainer authors in the CLI source repository
- **WHEN** package/workspace identity identifies the monorepo
- **THEN** agentscli-adm-write-conventions targets internal handwritten conventions and agentscli-adm-edit-agents targets handwritten root AGENTS, each within its own responsibility

#### Scenario: A client customizes instructions
- **WHEN** only valid .agentscli/config.yml identifies the project
- **THEN** agentscli-edit-agents targets the main template and agentscli-write-conventions targets local convention templates, using the configured language without adopting administrative or hub work

#### Scenario: Context is missing or contradictory
- **WHEN** the selected skill's required context is missing, invalid, or conflicts with another project role
- **THEN** the skills explain the context problem and edit no files

#### Scenario: A legacy client is encountered
- **WHEN** agentscli-compose.yml exists, with or without new configuration
- **THEN** the skills report that explicit migration must finish before client authorship and do not silently edit legacy sources

#### Scenario: A source subtree resembles a client
- **WHEN** package/workspace identity identifies a tool source ancestor and the requested subdirectory contains client-looking files
- **THEN** the skills diagnose the incompatible context instead of initializing, synchronizing, or authoring a nested client

#### Scenario: A hub authoring project is encountered
- **WHEN** agentscli-hub.yml identifies the root or its ancestor
- **THEN** administrative/consumer skills reject that environment and separate hub skills handle their own fixed responsibilities without creating client configuration

### Requirement: Each environment owns separate convention-authoring skills

agentscli-adm-write-conventions SHALL maintain only monorepo internal conventions; agentscli-write-conventions SHALL maintain only consumer-owned templates. In a hub, agentscli-hub-write-conventions SHALL maintain internal handwritten conventions and agentscli-hub-write-shared-conventions SHALL maintain distributable templates. Each SHALL curate applicability, rules, examples, exceptions, duplication, and contradictions within its own target. Their sources SHALL remain independent.

#### Scenario: An own convention is requested
- **WHEN** administrative convention authorship is requested in the monorepo
- **THEN** agentscli-adm-write-conventions edits only the final English convention without apply or sync
- **AND** any root AGENTS discovery update belongs to the separate agentscli-adm-edit-agents workflow

#### Scenario: A client convention is requested
- **WHEN** consumer convention authorship is requested
- **THEN** agentscli-write-conventions edits only .agentscli/templates/conventions/ using the configured language and checks related rule coherence

#### Scenario: Internal hub guidance is requested
- **WHEN** the requested rule governs maintenance of the hub itself
- **THEN** agentscli-hub-write-conventions edits only internal handwritten conventions, not shared resource templates

#### Scenario: A shared hub convention is requested
- **WHEN** the requested rule is a distributable convention resource
- **THEN** agentscli-hub-write-shared-conventions edits only conventions/**/*.tpl.md, without editing internal hub guidance or publishing

### Requirement: Each environment owns a separate AGENTS editing skill

agentscli-adm-edit-agents SHALL edit only the monorepo root AGENTS; agentscli-edit-agents SHALL edit only the consumer main template; agentscli-hub-edit-agents SHALL edit only the hub root AGENTS. Each SHALL curate concise orientation, entrypoints, and discovery while preserving applicable format and customized sections. Detailed convention authorship SHALL route to the responsible separate skill. No AGENTS editor SHALL switch environments or generate documents implicitly.

#### Scenario: A proposed AGENTS rule contains detailed topic-specific guidance
- **WHEN** an environment's AGENTS editor reviews that material
- **THEN** it keeps useful orientation/discovery and directs detailed authoring to the convention skill with the appropriate fixed responsibility

#### Scenario: The target is the handwritten root AGENTS
- **WHEN** the administrative or hub-specific AGENTS editor reviews its own root document
- **THEN** no generated-output or template-insertion marker is required

#### Scenario: The target is the client main template
- **WHEN** the user changes headings and sections through agentscli-edit-agents
- **THEN** it preserves structural validity and the single insertion marker without forcing the default body or editing generated root AGENTS

### Requirement: Product skills use one standard English source each

The product SHALL maintain 12 independent English skill sources: three administrative, four consumer, and five hub skills at the approved environment-specific paths. Each SHALL have its own name/description, SKILL.md, and needed scripts/support. Identical bodies SHALL remain independently owned; no cross-environment entrypoint, proxy, base skill source, or custom script implementation SHALL couple them. No translated/tool-specific variants or fixed chat-language rules SHALL be maintained.

#### Scenario: Product skill sources are reviewed
- **WHEN** the 12 source directories and fixed package asset roots are inspected
- **THEN** each skill has one independently maintained source in its own environment, with no shared cross-environment operational skill

#### Scenario: An existing agentscli-only skill requires a custom format check
- **WHEN** that mechanical check is implemented
- **THEN** its executable script is inside the owning skill and the instructions require running it rather than substituting prose inspection

### Requirement: Authoring respects requested scope

Review-only authorship SHALL report findings without edits. Each independent author SHALL edit only its own assigned final-file or template target. Authorship SHALL NOT imply generation, publication, or unrelated changes. When consumer authorship and generation are both requested, the authoring skill and separate agentscli-build-agents workflow SHALL complete their respective responsibilities within existing authorization, without gratuitous extra approval.

#### Scenario: Only semantic review is requested
- **WHEN** an environment-specific author handles a review-only request
- **THEN** it reports concrete scope/coherence/format findings without writing

#### Scenario: Client authorship and generation are both requested
- **WHEN** the user requests a local source change and regenerated instructions
- **THEN** the consumer author edits its own source and agentscli-build-agents performs the separately scoped generation, without merging their skill implementations

### Requirement: Distribution separates administrative consumer and hub workflows

Consumer assembly SHALL copy exactly its four independent asset skill trees; hub assembly SHALL copy exactly its five. The three agentscli-adm-* skills SHALL stay in the monorepo. No agentscli.yml or replacement distribution manifest SHALL be used. agentscli-build-agents SHALL guide only offline consumer generation; agentscli-manage-hub-imports SHALL own explicit consumer imports; agentscli-hub-publish SHALL own hub content publication. OpenSpec SHALL remain a development tool.

#### Scenario: Client resources are assembled
- **WHEN** packaging reads the four consumer skill directories
- **THEN** it includes their complete independent trees and excludes administrative, hub-specific, and OpenSpec skills

#### Scenario: Client build context is inspected
- **WHEN** agentscli-build-agents discovers a valid fixed-layout client
- **THEN** it executes its own shipped deterministic Node scripts using existing language/configuration for only the requested operation without an installed CLI dependency, implicit apply, installation, upgrade, or hub acquisition

#### Scenario: Client build encounters a legacy context
- **WHEN** agentscli-build-agents finds agentscli-compose.yml
- **THEN** it reports explicit apply --migrate preview/application guidance and does not turn ordinary generation authorization into migration

#### Scenario: Client build targets internal instructions
- **WHEN** agentscli-build-agents detects tool source package/workspace identity in the root or an ancestor
- **THEN** it reports direct repository authorship and runs no client operation

#### Scenario: The hub package initializes its own authoring skills
- **WHEN** a new hub is scaffolded
- **THEN** its five independent skill trees cover internal conventions, root AGENTS, shared conventions, shared skills, and requested content publication

### Requirement: Environment-specific authors replace fill-in comments with verified content

Each environment's convention/AGENTS author SHALL replace applicable fill-in comments with verified content within its fixed target. Fill-in guidance SHALL be an HTML comment requesting its own replacement. Authors SHALL NOT invent project facts, tools, architecture, or policies. Technical comments SHALL retain their contracts. Reusing wording SHALL NOT turn the independent environment skills into one shared implementation.

#### Scenario: Project entrypoint authorship is requested
- **WHEN** agentscli-edit-agents is authorized to populate the consumer main template and verified project purpose/orientation are available
- **THEN** it replaces the fill-in comment, preserves the insertion marker, and routes detailed convention work to the consumer convention skill

#### Scenario: Project context authorship is requested
- **WHEN** agentscli-write-conventions is authorized to populate a local context template with verified facts
- **THEN** it replaces the fill-in comment, preserves the title/nonempty trigger, and runs mechanical filename/frontmatter/no-convention-or-skill-link checks

#### Scenario: Required project facts are unavailable
- **WHEN** the selected environment-specific author lacks evidence for the requested content
- **THEN** it reports missing information instead of inventing content or presenting fill-in guidance as project facts

#### Scenario: Only review is requested
- **WHEN** the responsible author encounters fill-in comments during a review-only request
- **THEN** it reports unfinished content without editing or generating documents

#### Scenario: Shared skills operate in the source repository
- **WHEN** administrative authorship is authorized in the package-identified monorepo
- **THEN** only the relevant agentscli-adm-* skill edits handwritten final files, without consumer markers, templates, or client operations

### Requirement: Convention authors use the canonical filename

Every independent convention author SHALL apply the CLI's H1-to-filename rule to its own template or handwritten target. Authorized renames SHALL preserve the requested heading and update affected references within scope. The administrative, consumer, internal-hub, and shared-hub skills SHALL implement this responsibility in their own sources rather than switch between targets.

#### Scenario: A Portuguese client authors a convention
- **WHEN** the consumer author creates a convention with H1 “Contexto do projeto”
- **THEN** its chosen local convention directory receives contexto-do-projeto.tpl.md

#### Scenario: A handwritten convention is renamed
- **WHEN** an administrative or hub-internal convention author changes its own convention's title and filename
- **THEN** convention-local references are updated within its own scope and the corresponding separate AGENTS editor updates root discovery links when that work is authorized
