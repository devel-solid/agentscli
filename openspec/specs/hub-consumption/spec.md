# hub-consumption Specification

## Purpose

Let a project explicitly consume selected conventions and skills from one optional Git hub, with reproducible committed inputs, deterministic skill-operated updates, and offline ordinary generation.

## Requirements

### Requirement: A client selects at most one optional hub

A client SHALL remain usable without a hub. Optional hub configuration SHALL identify one Git remote, one exact commit, and explicit convention and skill ID lists. Empty lists SHALL import nothing. Multiple hubs, wildcards, implicit all-resource selection, and directory-layout overrides SHALL fail validation.

#### Scenario: A project has no hub
- **WHEN** its configuration contains only a valid language
- **THEN** existing local initialization, validation, and generation remain available without Git or a remote

#### Scenario: A project selects two of ten conventions
- **WHEN** its explicit convention list contains only `testing` and `code-style`
- **THEN** only those conventions enter its snapshot and generated index
- **AND** unselected skills and conventions do not become project resources

#### Scenario: Empty selections are configured
- **WHEN** both explicit lists are empty
- **THEN** no hub resource is imported merely because it exists in the remote

### Requirement: Git hosting and authentication are provider independent

Explicit acquisition SHALL support public and private network Git repositories through native Git endpoints and existing authentication. It SHALL NOT require a specific vendor, hosted registry, custom login, or vendor SDK. Credentials SHALL NOT be collected into configuration or exposed in diagnostics. Local-directory/file sources and executable remote-helper inputs SHALL be rejected in the initial contract.

#### Scenario: A team uses a private Bitbucket or self-hosted repository
- **WHEN** native Git can authenticate to its configured network endpoint
- **THEN** the hub skill can consume it using the same resource contract as a public GitHub repository

#### Scenario: Access is denied
- **WHEN** Git fails to authenticate during explicit acquisition
- **THEN** diagnostics identify the failed access without leaking credentials or changing accepted project files

### Requirement: Selected resources share one pinned revision

All selected resources SHALL come from one exact full commit object ID. A requested tag SHALL be resolved to that commit during explicit acquisition/update and recorded locally. Branch tracking and per-resource revision selection SHALL NOT be supported. Ordinary commands SHALL use the recorded commit without resolving a remote ref again.

#### Scenario: A tag later moves remotely
- **WHEN** a project has already accepted the commit resolved from `v1.2.0`
- **THEN** ordinary generation continues using the accepted snapshot and never follows the moved tag

#### Scenario: An update is requested explicitly
- **WHEN** a user asks the hub skill to adopt `v1.3.0`
- **THEN** all selected candidate resources are validated from its one resolved commit before project mutation

#### Scenario: A tag moves between planning and application
- **WHEN** a remote plan already resolved the tag and reported the candidate commit
- **THEN** apply and any retry use that exact commit without resolving the tag again
- **AND** only a new explicit plan by tag performs another resolution

### Requirement: Every dependency requires explicit selection

Selected shared skills SHALL declare dependencies through metadata.agentscli and included agentscli-skill.yml with optional requires, a skill-only id/source list. Shared references SHALL use hub at the same revision and already be selected. Local skills SHALL reference local or selected hub skills. Missing/wrong-source/transitive requirements SHALL fail before writes without extending selection or fetching. Conventions SHALL remain dependency-free and never satisfy a skill dependency.

#### Scenario: A selected review skill requires an unselected convention
- **WHEN** code-review encodes a convention dependency or its declared skill identity exists only as a convention
- **THEN** acquisition rejects the declaration or missing skill rather than accepting the convention or importing additional resources

#### Scenario: A dependency itself requires another skill
- **WHEN** the explicit skill list omits that further dependency
- **THEN** the entire selection fails validation rather than automatically adding it

### Requirement: Consumers retain the hub manifest content version

Acquisition SHALL validate the hub manifest at the selected commit and retain it in the accepted snapshot with file integrity. The lock's `hubVersion` SHALL match the manifest's content `version`, never a CLI version. A requested `v<version>` release tag SHALL agree with that manifest version before project mutation. Ordinary offline checks SHALL verify local manifest/lock agreement without resolving tags again.

#### Scenario: A content release is selected
- **WHEN** the project requests `v1.4.0` from a hub maintained with CLI version `0.2.0`
- **THEN** acquisition verifies manifest `version: 1.4.0` and records `hubVersion: 1.4.0` with the exact resolved commit

#### Scenario: A release tag disagrees with the manifest
- **WHEN** `v1.4.0` resolves to a commit whose manifest declares `1.3.0`
- **THEN** acquisition reports the mismatch before changing project files

### Requirement: Imported sources and current integrity are versioned locally

Accepted selected sources and the hub manifest SHALL live under `.agentscli/hub/`, separate from local templates. The current lock SHALL record remote, commit, hub content version, selection, and each file's representation, SHA-256 digest, and regular Git mode. These inputs SHALL be versioned with the project. Invalid descriptors/digests, unexpected files, or configuration disagreement SHALL block ordinary operations without remote repair.

#### Scenario: A project is cloned with an accepted snapshot
- **WHEN** Node and the versioned build skill are available without an installed agentscli executable, Git, or network
- **THEN** its private validation/generation scripts use the accepted versioned hub resources

#### Scenario: An imported convention was edited
- **WHEN** its digest under the accepted content representation differs from the recorded digest
- **THEN** ordinary commands and hub replacement report the conflict rather than accepting the edit or overwriting it

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

### Requirement: Text integrity tolerates only LF and CRLF equivalence

Valid utf8-lf integrity SHALL replace CRLF with LF idempotently, preserving BOM, spaces, and final-newline presence. Acquisition/materialization SHALL use LF. Snapshot CRLF-only differences SHALL pass without rewriting; other snapshot differences SHALL fail integrity. Any edited/missing/extra managed installation SHALL be replaceable drift from the valid snapshot, including opaque-byte changes. Source integrity SHALL NOT be inferred from an installed copy.

#### Scenario: A clone converts snapshot text to CRLF
- **WHEN** all imported text differs only by LF-to-CRLF conversion and opaque data remains exact
- **THEN** ordinary offline validation accepts snapshot integrity without modifying sources or contacting Git

#### Scenario: An installed script has CRLF endings
- **WHEN** its accepted representation is `utf8-lf` and its canonical content still matches
- **THEN** sync preview/check reports repairable LF materialization, check returns 1, and sync restores LF for executable shebang compatibility

#### Scenario: A meaningful text or opaque change occurs
- **WHEN** snapshot source bytes change beyond accepted LF/CRLF equivalence, including a BOM, lone CR, or opaque byte
- **THEN** validation reports invalid accepted state before writes
- **AND** if only the managed installed copy changed, preview/check reports replaceable drift and application restores it without a merge

#### Scenario: Canonical text is checked repeatedly
- **WHEN** accepted text passes through acquisition, snapshot storage, and repeated offline validation
- **THEN** its canonical bytes and SHA-256 digest remain identical on every pass

### Requirement: Executable intent survives platform differences

The lock SHALL retain original regular Git modes `100644` or `100755`. Installed skill files SHALL materialize that executable intent on POSIX-capable filesystems; mode-only differences SHALL be repairable updates. Windows/unsupported filesystems SHALL retain metadata without execute checks or ACL emulation. Ordinary operations SHALL NOT change the Git index. Snapshot file permissions SHALL NOT replace the recorded mode as authority.

#### Scenario: A shell script loses executable permission on POSIX
- **WHEN** installed content is intact but its mode disagrees with accepted `100755`
- **THEN** preview/check leaves permissions unchanged, check returns 1, and offline sync restores executable intent as an update

#### Scenario: A Windows consumer imports an executable script
- **WHEN** the filesystem cannot reliably represent POSIX executable modes
- **THEN** the lock retains `100755`, no execute-only mismatch is reported, and the operation does not emulate Unix execution through ACL changes

#### Scenario: A Windows-created checkout is later used on POSIX
- **WHEN** Git recorded an installed file as non-executable but the accepted lock still records `100755`
- **THEN** offline sync can restore executable intent from the lock without Git or a new remote import

#### Scenario: A permission repair fails
- **WHEN** the filesystem rejects a planned execute-mode update
- **THEN** the operation reports partial operational failure and completed/pending effects without claiming the expected mode was applied

### Requirement: Shared content keeps its language and project entrypoint boundary

Imported convention bodies and skill files SHALL keep their authored language without translation or locale selection. Only ordinary defaults and generated notices SHALL follow client language. The main AGENTS template SHALL remain project-owned and SHALL NOT be imported from the hub. A selected skill SHALL include its complete safe support tree.

#### Scenario: A Portuguese client selects an English convention
- **WHEN** the shared convention is rendered
- **THEN** its rules stay English while the generated notice follows the client's Portuguese preference

#### Scenario: The hub contains its own root AGENTS
- **WHEN** resources are selected and imported
- **THEN** that AGENTS does not replace the consumer's main template or root project orientation

### Requirement: Acquisition and updates are implemented inside a client skill

The consumer package SHALL distribute independent agentscli-manage-hub-imports with its own deterministic scripts/support. Its sole responsibility SHALL be that consumer's explicit import lifecycle: acquisition, update, selection changes, switch, and detach. It SHALL NOT author hub resources or publish either content or packages. No added public command, global hub CLI, source checkout, implicit installation, or unshipped sibling helper SHALL be required.

#### Scenario: A user requests a hub update through the agent
- **WHEN** the agent follows the management skill
- **THEN** included scripts resolve/validate the requested candidate, use the co-distributed build skill's engine for the complete offline generation plan, and apply only the authorized import intent
- **AND** neither skill invokes removed public validate/sync commands, duplicates the generation engine, or depends on another environment's skill

#### Scenario: The hub CLI is not installed
- **WHEN** the consumer has the distributed management skill and native Git
- **THEN** explicit hub acquisition remains available without installing the authoring CLI

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

### Requirement: Operational and retired skill names stay reserved

The 12 approved operational names and retired agentscli-update-agents SHALL be unavailable as shared hub skill IDs. The retired name SHALL identify only legacy packaged-skill cleanup, never a compatibility alias. Reserved selection SHALL fail before import or deletion, preventing a selected hub resource from being mistaken for an operational or retired tree.

#### Scenario: A hub selection uses a retired editor name
- **WHEN** the project selects agentscli-update-agents as a shared skill
- **THEN** validation fails before importing resources or cleaning the legacy directory

#### Scenario: A hub selection uses another environment's operational name
- **WHEN** a shared skill ID equals an administrative or hub operational skill name
- **THEN** selection is rejected rather than installing another environment's operational skill in the consumer

### Requirement: Collisions and local edits never acquire implicit precedence

Imported resources SHALL NOT adopt unrelated destinations or reserved product names, even with matching bytes. Once accepted state proves an installed tree managed, edits/extras SHALL be overwritten/removed from the authoritative snapshot without merging; missing files and LF/mode differences SHALL likewise be repairable drift. Local authored conventions may complement shared rules. Accepted snapshot corruption SHALL remain invalid state; override layers SHALL NOT be supported.

#### Scenario: A local convention has the imported convention's destination
- **WHEN** both would generate `.agentscli/conventions/testing.md`
- **THEN** preflight fails with both origins and no files change

#### Scenario: A hub tries to distribute a packaged product skill name
- **WHEN** the selection includes `agentscli-build-agents`
- **THEN** acquisition rejects the reserved name rather than replacing the product skill

#### Scenario: A selected installed skill has an added script
- **WHEN** an accepted managed installed skill has an added script during generation, update, or deselection
- **THEN** replacement/removal deletes the extra file within that managed tree, preserving authored templates and unrelated skills rather than treating the addition as authorial content

#### Scenario: A removed skill has platform-only differences
- **WHEN** its known managed files differ only by accepted text equivalence or execute-mode drift
- **THEN** those differences do not block authorized removal or permit adoption of an unrelated unmanaged tree

### Requirement: Deselection and hub replacement perform bounded cleanup

Explicit deselection/detach SHALL remove accepted managed sources, installed managed skill trees including edits/extras, and obsolete generated outputs. Authored/local sources and unrelated paths SHALL remain untouched. Invalid old accepted state or missing/renamed candidate IDs SHALL fail before writes. A switch SHALL validate the complete candidate before removing old resources; no managed edit merge or whole-project reset SHALL occur.

#### Scenario: A convention is deselected
- **WHEN** the accepted `testing` import is clean and no selected dependency still requires it
- **THEN** apply removes its managed source and eligible generated document and updates the root index

#### Scenario: A selected resource disappears upstream
- **WHEN** an update cannot find the configured ID in the requested revision
- **THEN** it fails before project changes and requests an explicit selection correction

#### Scenario: A replacement hub is invalid
- **WHEN** the new hub lacks a selected resource or violates the format
- **THEN** the old accepted resources, configuration, and outputs remain unchanged

#### Scenario: The project detaches its hub
- **WHEN** accepted state is valid and all target paths pass safety/ownership preflight
- **THEN** the import script removes hub configuration/snapshot and managed imported resources including edited installations, retaining authored templates, unrelated files/skills, packaged product skills, and Git state

### Requirement: Operational failures are explicit and do not invent ownership

Hub scripts SHALL report the candidate commit and completed/pending effects when a file operation fails. They SHALL preserve whole-file writes, publish accepted state only after verification, and provide same-commit retry/reconciliation guidance. They SHALL NOT claim rollback, adopt ambiguous manual paths, or maintain a recovery journal or ownership history. Divergent or unattributable partial state SHALL block until explicitly reconciled.

#### Scenario: Updating installed resources fails partway through
- **WHEN** some effects completed before a later write fails
- **THEN** diagnostics identify the candidate commit and completed/remaining work and require retrying that commit or reconciling ambiguous state through project Git
- **AND** the operation does not report a fully accepted update or erase unrelated content to force convergence

### Requirement: Local skill requirements constrain hub lifecycle plans

Consumer checks SHALL resolve authored local skill references against local project inputs or selected accepted hub sources exactly as source specifies. Proposed updates/switches/detach SHALL validate those requirements before writes; missing required hub resources SHALL block cleanup. Shared skills SHALL NOT depend on local resources, even if present. Only skills satisfy dependencies; convention selection remains independent. No global/personal skill lookup or origin fallback SHALL occur.

#### Scenario: A local skill requires a shared convention
- **WHEN** agentscli-skill.yml declares a required hub skill ID but only a shared or local convention has that ID
- **THEN** validation reports the missing skill rather than accepting or selecting the convention

#### Scenario: Detach would break a local skill
- **WHEN** a local authored skill still declares a hub dependency in the proposed detached state
- **THEN** the complete detach plan fails before changing accepted state or removing resources

#### Scenario: A shared skill requests a local resource
- **WHEN** its dependency file contains source: local
- **THEN** authoring/acquisition rejects the nonportable declaration before import or publication

#### Scenario: An installed dependency file was edited
- **WHEN** the accepted shared source agentscli-skill.yml is valid but its installed managed copy differs or is missing
- **THEN** generation replaces the installed drift from accepted sources without accepting that output as a new declaration
