# Design

## Context

See `proposal.md` for motivation and scope. The source currently contains two independently versioned beta packages: agentscli `0.4.0` and agentscli-hub `0.1.0`. Its implementation is newer than some main specifications: completed, unarchived `add-git-resource-hubs` contains the current hub/dependency contracts. This change supersedes its convention-dependency and `requires.yml` rules; the old completed change remains historical evidence, not an alternative runtime contract.

The relevant implementation is already identifiable:

- Consumer `agentscli-build-agents/scripts/lib/content.mjs` parses skill declarations and resolves resource closure. Hub snapshot validation and import lifecycle planning reuse this engine.
- Each of the five hub skills owns an independent `scripts/support.mjs` with its own skill/dependency validation.
- Each administrative skill owns a `scripts/lib.mjs`; package delivery also checks declarations in `agentscli-adm-publish-packages/scripts/candidate.mjs`.
- Six maintained `requires.yml` files exist. The three consumer files require only `agentscli-build-agents`; all three administrative files require conventions. The five hub operational skills and consumer build skill declare no dependencies.
- Read-only host inspection found agentscli `0.3.1` in the active Node `24.15.0` global environment and no agentscli-hub. Delivery must verify the actual environment again instead of assuming these observations remain current.

## Goals / Non-Goals

**Goals:**

- Define one small extensible skill configuration contract, with skill-only dependencies and deterministic enforcement at every existing validation boundary.
- Keep operation instructions in the owning skill while preserving legitimate project inputs and ordinary native tools.
- Publish both changed packages and install the exact verified releases on the active host after implementation.

**Non-Goals:**

- No legacy reader, conversion, transition period, migration option, snapshot transition mechanism, or old-client guard.
- No new public CLI command, hub service, vendor coupling, new dependency manager, or speculative configuration sections.
- No consolidation of the twelve operational sources or refactor of OpenSpec development skills.
- No automatic application to consumer projects or user hubs, no hub content release, and no modification of other Node installations.
- No removal of unrelated existing legacy-layout functionality merely because this skill-format change needs no migration.

## Decisions

### 1. One namespaced sibling file with purpose-specific sections

Use `agentscli-skill.yml` and string `metadata.agentscli: agentscli-skill.yml`. Standard `name`, `description`, `license`, `compatibility`, and generator fields stay in SKILL.md. Do not duplicate these fields or introduce per-skill versions. Other valid standard string metadata remains supported.

Initially the configuration has one optional section, `requires`, which is directly a list of skill references. There is no `skills` subkey because every dependency is a skill. An empty mapping `{}` or `requires: []` is valid. A blank document, null, unknown sections, extra reference fields, or encoded structures fail. Future information receives a separately specified section in this same file; no placeholder sections or file schema-version field are introduced now.

The pointer and reserved file must agree: neither is required, but a present pointer must equal the exact filename and reference its included safe regular sibling. A root-level `agentscli-skill.yml` inside a skill without the pointer is rejected to avoid silently overlooking requirements. This reservation is local to a skill root, not arbitrary asset names in its bundled examples.

Alternatives: generic `skill.yml` could collide with a future standard; `metadata.config` is less specific to our extension; retaining `metadata.requires` gives a general file a dependency-only name; nested structured frontmatter conflicts with string metadata. The namespaced pointer/file expresses ownership without adding another format.

### 2. Dependencies are identified skills, never instructions in conventions

Each reference contains exactly `id` and `source: local|hub`. Preserve existing portable identity validation and origin matching. The dependency resolver no longer consumes a convention collection. A same-name convention cannot satisfy a missing skill.

Local authored skills may require available local or explicitly selected hub skills. Exported shared skills require only hub skills from the same selected revision. Traverse the complete skill graph, retaining visited-set termination for cycles; cycles do not define an invocation schedule. No auto-selection, installation, alternate origins, global discovery, or downloading follows from a declaration. Prospective import update/switch/detach checks still reject removal of a required skill. Conventions remain independently selectable and never enter the dependency graph.

A skill may mention another skill by identity and discover its actual project location. Direct links and fixed workflow paths to conventions or other skill trees remain forbidden even when the target skill is declared. Own scripts, references, assets, configuration, and self anchors remain allowed.

### 3. Self-containment applies to procedures, not the files being worked on

All required guidance for a skill's own operation belongs to its SKILL.md or bundled support. Another declared skill can own a distinct operation. Do not replace a removed convention dependency with prose instructing the agent to read that convention for the missing procedure.

This does not prohibit reading configuration, package metadata, templates, root instructions, source files, or a convention being edited as work inputs and project context. Nor does it remove normal native-tool/library prerequisites. For example, a convention maintainer must read its target convention; that document must not supply the missing steps for performing convention maintenance.

Remove all three administrative convention dependency files and pointers after ensuring their own bodies/support contain necessary operation-specific guarantees. Preserve the four root conventions as general guidance instead of copying them wholesale into each skill. Add the versioning convention separately. Structural checks enforce declarations, paths, and links; semantic review checks whether procedures are actually complete.

### 4. Preserve independent ownership and change every relevant boundary

| Environment | Skill sources                                                                                                                                                                                                                  | Configuration outcome                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Monorepo    | `agentscli-adm-write-conventions`, `agentscli-adm-edit-agents`, `agentscli-adm-publish-packages` under `.agents/skills/`                                                                                                       | Remove obsolete convention dependencies; no empty replacement file                                                         |
| Consumer    | `agentscli-write-conventions`, `agentscli-edit-agents`, `agentscli-manage-hub-imports` under `packages/agentscli/assets/templates/skills/`                                                                                     | Each includes its own `agentscli-skill.yml` requiring local `agentscli-build-agents`                                       |
| Consumer    | `agentscli-build-agents` in the same owning package                                                                                                                                                                            | No configuration file is needed                                                                                            |
| Hub         | `agentscli-hub-write-conventions`, `agentscli-hub-edit-agents`, `agentscli-hub-write-shared-conventions`, `agentscli-hub-write-shared-skills`, `agentscli-hub-publish` under `packages/agentscli-hub/assets/templates/skills/` | No operational dependency file is needed; each independent checker and relevant authoring guidance adopts the new contract |

Change consumer parsing/closure and its authoring/import call sites; all hub-owned parsers/resolvers; the three administrative parsers; packaging/assembly checks and native archive inspection. Keep full custom support within each skill and use the existing build assembly to bundle its ordinary dependencies. No environment shares another environment's skill implementation.

Always validate prospective authoritative package assets and accepted sources. Installed old operational copies are replaceable managed output: ordinary apply removes their obsolete files and restores the new complete tree without interpreting the old declarations. Invalid authored or accepted sources still block writes. The complete general file participates in normal snapshot inventory, byte representation, hashing, copying, and installed-drift repair without changing lock identity semantics.

### 5. Adopt the beta contract directly

Reject `metadata.requires`, the old reserved root `requires.yml`, root-level skill `requires`, and obsolete dependency comments outside literal examples. Do not accept old conventions/skills mappings even when they contain no convention entries. Do not generate migration utilities or rewrite user-authored or accepted resource trees.

An accepted old snapshot can consequently fail current validation; this is an intentional unsupported beta input, not a reason to build a special update path or to change its pinned bytes. Existing source integrity and write-safety guarantees continue to apply. Document the current format and actionable unsupported-field diagnostics without promising old-input recovery.

Keep current hub manifest and lock `schemaVersion` values. Do not add a format bump or sentinel merely to make old clients recognize the change: the user explicitly excludes old-client protection work. The generic configuration file likewise receives no speculative version field.

### 6. Record versioning policy in the repository

Implementation adds self-contained handwritten English `docs/conventions/versioning.md` with canonical H1 `Versioning` and a discovery entry in AGENTS.md for planning, contract changes, and releases. It states that major zero is beta, production starts at major one, and beta changes provide no backward compatibility or transition machinery. Independent CLI package versions determine their own lifecycle; the private workspace has no synthetic aggregate product version.

Keep CLI package versions separate from the user hub repository's content version and manifest format. The existing initial hub content version `1.0.0` does not promote a `0.x.x` CLI to production. No user hub content version is advanced by this repository change.

Update skill-authoring and mechanical-validation conventions, root/package READMEs, hub scaffold `resource-authoring.md`, shared-skill examples, and `openspec/config.yaml` during implementation. Administrative release guidance carries the necessary operational versioning rule in its own text/support without declaring a convention dependency. Historical change artifacts are not mass-rewritten; when specifications are eventually synchronized, predecessor requirements must be reconciled with this successor rather than retaining both dependency contracts.

### 7. Complete through publication and active-host rollout

Both packages change shipped behavior and need new independent beta versions. Derive unused next versions during release preparation using current package/lock metadata, actual impact, tags, and registry state. A breaking beta change remains on major zero; exact candidates are not fixed by this planning document. Preserve immutable published identities and package-specific tags `agentscli-v<version>` and `agentscli-hub-v<version>`.

Use `agentscli-adm-publish-packages` and native Git/npm for reviewed commits/tags, intended branch/tag pushes, and publication of the exact inspected archives. Preserve unrelated edits/staging and native authentication. Verify public name/version, visibility, license, bin, SHA-512, and Git tag commit. Record partial delivery separately; never overwrite a release or choose another version merely because a response is ambiguous.

After public verification, install the exact affected package versions with native `npm install --global` in the active npm prefix. Install agentscli-hub even if absent. Recheck current prefix, global package records, command resolution, and both `--version` results. Resolve relevant active-path conflicts without modifying unrelated global packages or other Node installations. Treat these as delivery checks, not a new automated installation test suite. Do not run either CLI's apply in this monorepo or another project as part of host installation.

This propose invocation authorizes planning only. All release and host operations are future tasks performed after a separate apply request; no publication or installation occurs while creating these artifacts.

### 8. Complete authored shared-skill example

For an authored shared skill `review-changes`, assume `inspect-changes` is already authored in the same hub and explicitly selected in consumers. Its complete two-file tree is:

```text
review-changes/
  SKILL.md
  agentscli-skill.yml
```

`SKILL.md`:

```markdown
---
name: review-changes
description: Review requested code changes for concrete bugs and regressions. Use when a user asks for a code review.
license: MIT
compatibility: Requires Node.js >= 22.
metadata:
  agentscli: agentscli-skill.yml
---

# Review changes

Read this skill's configuration and identify the requested project and diff.
Discover the required inspect-changes skill by its hub identity among the
project's available skills. Use its instructions to inspect the changed code
and relevant callers within the requested review scope.

Check each suspected issue against a concrete input or failure path. Review
behavior changes, error handling, and regressions. Report only actionable
findings, identifying the affected location, triggering condition, and impact.
State when no findings are established and which checks were actually run.

A review request does not authorize edits, generation, imports, or publication.
```

`agentscli-skill.yml`:

```yaml
requires:
  - id: inspect-changes
    source: hub
```

No generatedBy/generatorVersion fields are added to this authored shared example. Those stamps remain specific to the nine distributed operational skills and are filled from each owning package's actual release version.

## Risks / Trade-offs

- **Independent validators can diverge:** exercise equivalent valid/invalid configuration cases in their owning lightweight unit suites while keeping custom implementations separate.
- **Removing a declaration can hide incomplete instructions:** review each administrative operation's inputs, decisions, procedure, and completion evidence instead of copying entire conventions or simply deleting the dependency pointer.
- **A new metadata key can be ignored by an old beta CLI:** accept that unsupported-version limitation; no transition or compatibility protection is in scope.
- **Accepted old-format snapshots can stop validating:** preserve source integrity and report unsupported input; no compatibility route or automatic conversion is in scope.
- **Structural validation cannot prove self-containment:** combine deterministic schema/path/link/closure checks with semantic review and report their different limits.
- **Publication and host rollout can complete separately:** verify each immutable release and each local installation separately, keeping unfinished tasks open without republishing successful artifacts.
- **Main specs lag the implemented predecessor:** use current source plus completed predecessor artifacts as implementation evidence, and reconcile superseded dependency statements in the normal subsequent spec-sync lifecycle. This proposal does not archive or rewrite the predecessor.

## Migration Plan

None. This is direct beta contract replacement. Deployment consists of publishing the new CLI artifacts and updating their active host installations after verification. No compatibility, legacy snapshot conversion, automatic consumer/hub apply, or rollback subsystem is introduced.
