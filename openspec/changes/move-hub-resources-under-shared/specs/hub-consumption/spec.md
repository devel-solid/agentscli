# Spec Delta

## MODIFIED Requirements

### Requirement: Acquisition and updates are implemented inside a client skill

The consumer package SHALL distribute independent agentscli-manage-hub-imports with its own deterministic scripts/support. Its sole responsibility SHALL be that consumer's explicit import lifecycle: acquisition, update, selection changes, switch, and detach. It SHALL NOT author hub resources or publish either content or packages. No added public command, global hub CLI, source checkout, implicit installation, or unshipped sibling helper SHALL be required.

#### Scenario: A user requests a hub update through the agent

- **WHEN** the agent follows the management skill
- **THEN** included scripts resolve/validate the requested candidate, use the co-distributed build skill's engine for the complete offline generation plan, and apply only the authorized import intent
- **AND** neither skill invokes removed public validate/sync commands, duplicates the generation engine, or depends on another environment's skill

#### Scenario: The hub CLI is not installed

- **WHEN** the consumer has the distributed management skill and native Git
- **THEN** explicit hub acquisition remains available without installing the authoring CLI

#### Scenario: A selected resource is acquired from shared

- **WHEN** the consumer selects convention `testing/unit` and skill `review` from an exact hub commit
- **THEN** acquisition reads `shared/conventions/testing/unit.tpl.md` and the complete `shared/skills/review/` tree
- **AND** it maps them to snapshot paths `conventions/testing/unit.tpl.md` and `skills/review/`, retaining those resource IDs

#### Scenario: A selected current source is missing

- **WHEN** the selected commit lacks a required file under the current `shared/` roots
- **THEN** ordinary missing-source validation fails before changing the consumer
- **AND** acquisition does not retry a root-level alternative, convert the layout, or execute downloaded content

### Requirement: Imported sources and current integrity are versioned locally

Accepted selected sources and the hub manifest SHALL live under `.agentscli/hub/`, separate from local templates. The current lock SHALL record remote, commit, hub content version, selection, and each file's representation, SHA-256 digest, and regular Git mode. These inputs SHALL be versioned with the project. Invalid descriptors/digests, unexpected files, or configuration disagreement SHALL block ordinary operations without remote repair.

#### Scenario: A project is cloned with an accepted snapshot

- **WHEN** Node and the versioned build skill are available without an installed agentscli executable, Git, or network
- **THEN** its private validation/generation scripts use the accepted versioned hub resources

#### Scenario: An imported convention was edited

- **WHEN** its digest under the accepted content representation differs from the recorded digest
- **THEN** ordinary commands and hub replacement report the conflict rather than accepting the edit or overwriting it

#### Scenario: Remote layout and local snapshot paths differ

- **WHEN** a candidate captures selected sources from the current shared roots
- **THEN** accepted paths remain `.agentscli/hub/conventions/<id>.tpl.md` and `.agentscli/hub/skills/<id>/`, without an added `shared/` segment
- **AND** manifest bytes, lock schema, identity, representation, digests, regular Git modes, and destination rules retain their existing contracts

#### Scenario: An existing accepted snapshot is checked after a CLI upgrade

- **WHEN** its configuration, manifest, lock, and selected files satisfy the unchanged local snapshot contract
- **THEN** offline checks and generation continue using it without a fetch, layout conversion, source rewrite, hash rewrite, or commit change

### Requirement: Content representation is fixed by the selected commit

Acquisition SHALL use utf8-lf only for valid UTF-8 without NUL/lone CR, and bytes otherwise. Committed -text, including binary, SHALL force bytes; exclude machine overrides and filters. Offline snapshot checks SHALL enforce recorded representations without Git/reclassification. Opaque source bytes SHALL remain exact. Differences in a proven managed installed copy SHALL be replaceable drift, not accepted-source changes.

#### Scenario: Text-looking opaque data is explicitly marked

- **WHEN** the selected commit marks a UTF-8-looking payload `-text` through its `.gitattributes`
- **THEN** acquisition records `bytes` and preserves every payload byte rather than normalizing its line endings

#### Scenario: A consumer has different global attribute settings

- **WHEN** representation is determined for a selected commit
- **THEN** those machine settings do not change the recorded representation or execute configured filters

#### Scenario: An edited file could be classified differently

- **WHEN** an accepted snapshot file no longer satisfies its recorded representation or digest
- **THEN** validation fails using that descriptor without reclassifying/adopting the edited source
- **AND** the same difference only in an installed managed copy is drift to replace from the valid snapshot

#### Scenario: A source contains consecutive or isolated CR bytes

- **WHEN** source content includes `alpha\r\r\nbeta\r\n` or any CR not immediately followed by LF
- **THEN** acquisition records `bytes` and preserves the complete original sequence through snapshot creation and offline integrity checks

#### Scenario: A committed attribute uses the physical shared path

- **WHEN** `.gitattributes` marks `shared/skills/review/payload.dat` as `-text`
- **THEN** capture evaluates that real Git path before mapping it to `skills/review/payload.dat` in the snapshot
- **AND** the file retains opaque bytes and its recorded Git mode through snapshot and installation

### Requirement: Remote planning and ordinary checks have distinct effects

A local hub check SHALL be write-free and offline. Explicit remote planning SHALL leave project files unchanged while permitting temporary fetch storage. Acquisition SHALL inspect data without executing downloaded scripts, hooks, filters, or submodules. All project paths, formats, dependencies, collisions, and old-state integrity SHALL pass before apply; changed preconditions SHALL stop mutation.

#### Scenario: A remote candidate is previewed

- **WHEN** the skill performs remote planning
- **THEN** it can fetch into disposable storage but leaves configuration, snapshot, documents, and installed skills unchanged

#### Scenario: A selected Git entry is a symlink or submodule

- **WHEN** the candidate resource tree is inspected
- **THEN** validation rejects it before writing project resources or executing repository code

#### Scenario: An imported skill contains a forbidden cross-resource link

- **WHEN** a selected source skill's entrypoint/support instructions directly link a convention or another skill tree, including a hardcoded foreign workflow path
- **THEN** candidate validation rejects it before changing project files and directs the hub maintainer to replace the link with identity-based discovery
- **AND** merely declaring that dependency does not make the link permissible or authorize rewriting accepted source bytes

#### Scenario: Mapping a selected shared path would conceal unsafe input

- **WHEN** a selected source has an invalid Git path, nonregular entry, unsafe parent, escape, or portable alias
- **THEN** preflight rejects the candidate before publishing mapped accepted state
- **AND** removing the fixed shared prefix does not sanitize or authorize the rejected input
