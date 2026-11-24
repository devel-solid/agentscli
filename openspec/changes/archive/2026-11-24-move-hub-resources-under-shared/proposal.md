# Proposal

## Why

Hub resources currently occupy top-level `conventions/` and `skills/`, obscuring their distinction from the hub's internal instructions and operational skills. Grouping exportable resources under `shared/` makes that responsibility explicit for both private and public Git hubs.

## What Changes

- **BREAKING:** Adopt `shared/conventions/**/*.tpl.md` and `shared/skills/<id>/` as the only shared-resource authoring and remote acquisition roots. Keep resource IDs relative to these roots, without `shared/` in selections or dependencies.
- Keep hub-internal conventions in `docs/conventions/` and the five operational skills in `.agents/skills/`. Update scaffold, all five independent skill implementations, validation, publication scope, documentation, examples, and packaged assets.
- Keep `agentscli-hub.yml` unchanged: exactly `schemaVersion: 1` and the independent semantic content `version`, initially `1.0.0`. Neither a CLI upgrade nor this directory change automatically advances hub content versions.
- Map selected Git paths into the existing consumer snapshot namespace `.agentscli/hub/{conventions,skills}`. Preserve IDs, lock format, manifest bytes, integrity/representation rules, installation destinations, and valid accepted snapshots. Resolve committed attributes against real Git paths before mapping.
- Replace the beta layout directly. Add no fallback, transition period, conversion, migration, compatibility reader, or special detection/blocking of former root directories, including empty directories and `.gitkeep` files. Ordinary validation still requires selected resources at their current paths and rejects unsafe current inputs.
- Deliver new independent releases of both `@devel-solid/agentscli-hub` and `@devel-solid/agentscli`, then install and verify both exact versions in the active host. This proposal only plans those effects.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `hub-authoring`: Create and maintain the `shared/` layout, preserve authored/state boundaries, and validate and publish resources from the current roots through the five independent operational skills.
- `hub-consumption`: Acquire selected resources from `shared/` while retaining the current local snapshot format, identities, integrity, and offline generation behavior.
- `convention-authoring`: Target distributable hub convention templates under `shared/conventions/` while retaining separate internal and consumer authoring responsibilities.

## Impact

- Hub runtime/planner, scaffold sources, five skill entrypoints and their independent support implementations, hub content-release path eligibility, build/assembly expectations, and focused unit tests.
- Consumer import skill Git capture and snapshot construction, import/lifecycle tests, and offline snapshot regression coverage. The consumer requires its own release because its shipped importer hardcodes the remote paths even though its local snapshot format remains unchanged.
- Root/package READMEs and complete exported-resource examples. Operational source directories under each package's `assets/templates/skills/` remain package inputs rather than exported hub resources.
- Existing release-publication requirements already cover independent package versions, artifact inspection, verified delivery, and exact host installation; this change reuses that workflow without new release commands or mechanisms.
- Implementation, checks, archive inspection, native Git/npm delivery, and host rollout belong to this repository's change. Updating an existing user hub's authored layout, importing the personal `review` skill, hub content publication, and integrating the SGO belong to their own projects and OpenSpecs. No project `apply` is part of host rollout.
