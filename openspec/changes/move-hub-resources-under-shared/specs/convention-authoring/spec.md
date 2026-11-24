# Spec Delta

## MODIFIED Requirements

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
- **THEN** agentscli-hub-write-shared-conventions edits only shared/conventions/**/*.tpl.md, without editing internal hub guidance or publishing
