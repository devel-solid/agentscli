# Proposal

## Why

The four agentscli skills repeat operational guidance, and the release skill still carries instructions tied to the first publication. The target consumer already has reusable skill-authoring rules; adopting them here will make this refactor and future skill maintenance more concise without losing necessary conditions or fixed CLI contracts.

## What Changes

- Refactor `agentscli-write-conventions`, `agentscli-update-agents`, `agentscli-build-agents`, and the internal `agentscli-release`, reducing their combined content and common reading without moving redundant material into support files.
- Add handwritten English `docs/conventions/skill-authoring.md` and its discovery entry in `AGENTS.md`. Reuse the source skill-authoring guidance's substantive rules and five positive/negative example pairs, adapting language, local references, generated-file framing, and the exception for paths required by a fixed public contract. Include no external links or bibliography in that convention.
- Keep movable project resources discoverable through current instructions, metadata, configuration, and consumers. Preserve exact CLI paths, markers, options, and resource-relative links when they are actual contracts.
- Replace first-release narrative in the release skill with discovery of current package metadata, repository refs, registry versions, and authorization. Preserve immutable published identities and native Git/npm delivery.
- Deliver a patch release, update the existing global installation, and refresh the three CLI-managed skills in the target consumer through the installed CLI's validation, preview, synchronization, and check workflow.

## Capabilities

### New Capabilities

- `skill-authoring`: Repository guidance for concise, portable, behavior-preserving skills, with actionable discovery, conditional resource loading, examples, and proportionate verification.

### Modified Capabilities

- `release-publication`: Make the reusable release guidance select its candidate and tag from current state instead of prescribing first-release identities or repository operations again.

## Impact

- Source edits: the four canonical `SKILL.md` files, the new handwritten convention, and its root `AGENTS.md` entry. Three skill trees continue to be distributed; release and OpenSpec remain internal. The convention is repository guidance, not a new client scaffold.
- Delivery edits: package/lockfile versions and the README's version statement. Observed source and global versions are `0.3.0`; `0.3.1` is the proposed patch only if still available when preparing delivery.
- Verification: skill format and link checks, before/after content and decision review, the existing unit/type/format gate, build, and actual archive inspection. No new runtime behavior, dependency, CLI option, test infrastructure, or installation test suite is proposed.
- External rollout: publish and verify the reviewed artifact, update the existing local global package, and use the discovered consumer checkout to refresh only its managed agentscli resources. Preserve consumer-owned skills, OpenSpec, authored templates, and unrelated work; unexpected document drift must be resolved before applying sync.
- This change includes implementation through verified rollout when execution is requested. Creating this proposal performs no implementation, version bump, Git delivery, publication, global installation, or consumer write.
