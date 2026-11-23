# Spec Delta

## Purpose

Guide the creation and maintenance of concise agentscli skills whose discovery procedures, operational conditions, and packaged resources remain useful as projects evolve.

## ADDED Requirements

### Requirement: The repository exposes portable skill-authoring guidance

The repository SHALL provide handwritten English `docs/conventions/skill-authoring.md`, discoverable from `AGENTS.md` when creating, reviewing, or refactoring owned skills and their support files. It SHALL preserve the reusable rules and positive/negative examples from the SGO convention, adapting project-specific framing and references without adding external links or a bibliography.

#### Scenario: An agent starts maintaining an owned skill
- **WHEN** the agent consults the root instructions for a skill-authoring task
- **THEN** it finds the convention's applicability and link without loading the full guidance into `AGENTS.md`

#### Scenario: SGO guidance is adapted for this repository
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

Skills SHALL keep common-path guidance in their entrypoint and link substantial operation-specific content only when it has a concrete purpose, with a clear consultation condition. Each distributed skill SHALL remain usable with the resources actually shipped to clients. Deduplication SHALL NOT introduce a required reference to repository-only conventions or unshipped sibling files.

#### Scenario: A short skill needs no supporting resource
- **WHEN** its useful instructions already fit a concise entrypoint
- **THEN** no router, placeholder reference, or additional support tree is required

#### Scenario: The new authoring convention is not installed in a client
- **WHEN** a client uses one of the three distributed skills
- **THEN** the skill can complete its task without relying on this repository's new convention

### Requirement: Refactoring preserves operational context and authorization

The four canonical skills SHALL preserve their established editing targets, language rules, context rejection, requested-operation boundaries, validation contracts, and failure guidance. Simplification SHALL NOT imply installation, initialization, migration, generation, Git mutation, or publication beyond the active request, nor add confirmation where existing authorization suffices.

#### Scenario: A repository maintainer authors instructions
- **WHEN** `agentscli.yml` selects direct authoring
- **THEN** the applicable skill targets handwritten English files and performs no client operation in the repository or its descendants

#### Scenario: A Portuguese client requests source authorship
- **WHEN** valid configuration selects `pt-br`
- **THEN** the skill edits the appropriate template in Portuguese while its own instructions remain English and generated documents remain replaceable

#### Scenario: The context is invalid or incompatible
- **WHEN** configuration is missing, malformed, conflicting, legacy, or nested beneath an internal-manifest ancestor
- **THEN** the skill diagnoses the applicable problem before edits and does not guess a valid mode or silently initialize or migrate

#### Scenario: Review or preview alone is requested
- **WHEN** the request is limited to review, preview, or checking
- **THEN** the skill performs no writes and reports only actual findings and checks

#### Scenario: Client generation is authorized
- **WHEN** the installed CLI validates the inputs and its preview matches the requested scope
- **THEN** the build skill performs the authorized sync and freshness check without an extra approval solely because the preview succeeded
- **AND** it preserves the distinction between managed skills, generated documents, and manual documents

#### Scenario: An operational update fails partway through
- **WHEN** sync or explicit migration reports completed and remaining effects
- **THEN** the skill reports partial completion and directs retrying the same operation and options rather than changing operations or claiming rollback

### Requirement: Content-reduction refactors verify size and decisions

Content-reduction refactors SHALL compare total skill content and common-path reading before and after, including support files, and demonstrate actual aggregate reduction without arbitrary size quotas or moving excess elsewhere. Verification SHALL review representative decisions, descriptions, links, and format; a valid frontmatter alone SHALL NOT establish behavioral correctness.

#### Scenario: Shortened entrypoints move their paragraphs into references
- **WHEN** the combined content or common reading retains the same unnecessary material
- **THEN** the refactor does not qualify as a verified reduction merely because `SKILL.md` files became shorter

#### Scenario: A substantial skill refactor is reviewed
- **WHEN** maintainers assess readiness
- **THEN** they check representative context, scope, discovery, contract, and failure decisions against the previous behavior and run the available skill-format validator
- **AND** they distinguish documentary review from actions actually executed, without adding tests that merely match skill wording
