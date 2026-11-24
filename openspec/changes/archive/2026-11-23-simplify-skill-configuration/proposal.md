# Proposal

## Why

The current dependency-only file cannot accommodate other skill-specific information, and convention dependencies make skills rely on instructions outside their own distribution. Both CLI packages are still beta, so this contract can be replaced directly without migration or backward compatibility.

## What Changes

- **BREAKING** Replace `metadata.requires: requires.yml` with optional string `metadata.agentscli: agentscli-skill.yml`. The single sibling YAML document groups information by purpose; initially its only supported section is an optional `requires` list of skill `id`/`source` references.
- **BREAKING** Permit dependencies only on other skills. Remove convention dependencies from parsers, resolution, administrative declarations, shared-resource examples, and checks. Keep explicit selection, transitive validation, identity-based discovery, and same-hub/revision constraints.
- Require each skill to carry its operation's instructions in its own entrypoint/support. Preserve bundled scripts/references and legitimate project inputs, while retaining the existing prohibition on direct cross-resource links.
- Apply the contract independently to the three administrative, four consumer, and five hub skills and their deterministic support. Distribute the general file only when needed; preserve standard skill frontmatter, Node compatibility, and actual generator stamps.
- Add a handwritten versioning convention, discoverable from root `AGENTS.md`: major zero means beta; production begins at `1.0.0`; beta contract changes add no transition, migration, compatibility reader, or old-client protection machinery.
- Update maintained documentation, hub scaffold guidance, OpenSpec context, unit fixtures, asset assembly, and archive inspection to describe and validate the new contract.
- Finish implementation with new independent releases of both affected npm packages, verify their remote identities, then install those exact versions into the active host's global npm environment and verify both CLI executables.

## Capabilities

### New Capabilities

None. The existing skill-authoring and release-publication capabilities own these behaviors.

### Modified Capabilities

- `skill-authoring`: General skill configuration, skill-only dependencies, self-contained operation instructions, and consistent deterministic enforcement across authoring, generation, import, and distribution.
- `release-publication`: Explicit beta/production versioning policy, publication of both changed CLI packages, and verified installation of the released CLIs on the active host.

## Impact

- Consumer engine: `packages/agentscli/assets/templates/skills/agentscli-build-agents/scripts/lib/content.mjs`, hub/import planning, and the three consumer skills currently declaring a build-skill dependency.
- Hub: all five independently owned support implementations, shared-skill authoring instructions/examples, and scaffold conventions.
- Administration: three existing convention-dependent declarations, their own validators, and package/archive inspection in `agentscli-adm-publish-packages`.
- Documentation: root/package READMEs, skill-authoring/mechanical-validation conventions, new `docs/conventions/versioning.md`, root discovery, and `openspec/config.yaml` during implementation.
- Validation: existing lightweight unit/type/format gates, builds, and native package inspection; no new public CLI commands or integration suites.
- Delivery: new versions of `@devel-solid/agentscli` and `@devel-solid/agentscli-hub`, immutable package-specific Git tags, npm publication, and the active host's global CLI installations. Exact unused beta versions are derived during release preparation. The private root and user hub content are not published.
- This is a successor to implemented `add-git-resource-hubs`; that change's old dependency contract is superseded. This planning workflow changes only the new change artifacts and performs no implementation, release, or host installation.
