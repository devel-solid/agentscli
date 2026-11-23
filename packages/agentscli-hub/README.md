# agentscli-hub

Create a standalone, provider-independent Git hub of conventions and complete skills.

```sh
agentscli-hub apply ./team-hub --dry-run
agentscli-hub apply ./team-hub
```

Node.js 22, 24, or 26 is supported. Git is required to create a repository. The only public operation is `apply`; `--help`, `--version`, and `--dry-run` are available. Initialization creates no remote, commit, tag, or push.

Repeated application restores the five operational skill trees and the managed README from the installed CLI, deleting extra/stale managed files. Authored `AGENTS.md`, `docs/conventions/`, `conventions/`, and `skills/` stay in place, including deliberate deletions. The content manifest version and Git metadata/policy are preserved. Do not edit managed operational skills; make shared resources in the authoring directories.

`agentscli-hub.yml` contains exactly `schemaVersion: 1` and content `version: 1.0.0` initially. That content version and hub `v1.0.0` tag are independent of CLI package versions and product tags such as `agentscli-hub-v0.1.0`.

Discover the hub's five included skills through their names/descriptions: internal convention maintenance, root AGENTS editing, shared convention maintenance, shared skill maintenance, and requested content publication. Each ships its own deterministic checks. Conventions are self-contained and do not link to conventions or skills. Optional general skill configuration uses string `metadata.agentscli: agentscli-skill.yml`. Its native YAML `requires` list refers only to skills by `id`/`source`; shared skills may require only skills from the same hub and revision. Consumers select every required skill explicitly. A skill's own operation instructions stay in its entrypoint or bundled support; conventions are never dependencies.

CLI versions with major zero are beta, with production beginning at `1.0.0`. Beta contracts are replaced directly without backward-compatibility readers, transition periods, or migration. The old requires.yml and metadata.requires declaration format is unsupported. This policy does not turn the independent hub content version into a CLI version.

Ask the agent to "Publish the hub changes". The included publication skill assesses the actual impact, derives the content version, validates, commits/tags/pushes through native Git, and verifies the intended refs. Configure the intended Git remote/access first; no vendor SDK or token collection is used. No publication happens during apply or validation. A failed multi-file operation reports completed and pending effects; it does not claim rollback or keep a recovery database.

Run `npm run check` from the monorepo root for all workspace gates. Tests are isolated units with injected filesystem/Git boundaries, not live provider or installation suites.

An interrupted first creation can resume when native Git remains unborn, has no refs, staging or remotes, and the non-Git files are an exact subset of the initial scaffold. Changed, unrelated, or unsafe content requires explicit reconciliation. The manifest is written last; after identification, repeat apply always preserves authored deletions.

A complete shared convention, `conventions/testing.tpl.md` (identity `testing`):

```markdown
---
trigger: Read before creating or changing automated tests.
---

# Testing

Check observable behavior with small deterministic inputs. Cover a concrete failure or regression when one motivates a change. Keep test fixtures independent of network services and preserve the project's established test framework.
```

A complete shared skill, `skills/inspect-tests/SKILL.md` (identity `inspect-tests`):

```markdown
---
name: inspect-tests
description: Inspect requested automated test changes and report concrete evidence about their behavior coverage.
license: MIT
compatibility: Requires Node.js >= 22.
---

# Inspect tests

Identify the requested test diff and the behavior exercised by the changed tests. Trace assertions, fixtures, and relevant implementation paths. Record whether a concrete regression would cause a test failure, which failure paths are exercised, and whether fixture outcomes are deterministic. Distinguish verified behavior from assumptions and identify affected locations.

Return the inspection evidence. Inspection does not authorize edits, generation, imports, or publication.
```

A complete dependent shared skill, `skills/review-tests/SKILL.md` (identity `review-tests`):

```markdown
---
name: review-tests
description: Review requested automated test changes for meaningful behavior coverage and regressions.
license: MIT
compatibility: Requires Node.js >= 22.
metadata:
  agentscli: agentscli-skill.yml
---

# Review tests

Read this skill's configuration. Discover the required inspect-tests skill by its hub identity among the project's available skills and use its instructions to inspect the requested changes.

Evaluate the inspection evidence for meaningful coverage gaps and regressions. Report confirmed actionable findings with their affected locations, triggering behavior, and impact. Exclude speculative issues; state when no findings are established and which checks were actually performed. Do not implement changes or publish anything during this review.

The general configuration is this skill's own [agentscli-skill.yml](agentscli-skill.yml).
```

The complete sibling `skills/review-tests/agentscli-skill.yml`:

```yaml
requires:
  - id: inspect-tests
    source: hub
```

These skills need no additional support files. Consumers explicitly select `inspect-tests` and `review-tests`; the declaration never adds selections automatically. The independent `testing` convention can be selected separately. Shared resources retain their authored metadata, without CLI generator stamps. Skills without additional configuration omit both file and pointer; an empty mapping or `requires: []` is valid, while blank/null documents, unknown sections, and a reserved configuration file without its pointer are rejected.
