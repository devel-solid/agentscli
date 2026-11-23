# agentscli-hub

Create a standalone, provider-independent Git hub of conventions and complete skills.

```sh
agentscli-hub apply ./team-hub --dry-run
agentscli-hub apply ./team-hub
```

Node.js 22, 24, or 26 is supported. Git is required to create a repository. The only public operation is `apply`; `--help`, `--version`, and `--dry-run` are available. Initialization creates no remote, commit, tag, or push.

Repeated application restores the five operational skill trees and the managed README from the installed CLI, deleting extra/stale managed files. Authored `AGENTS.md`, `docs/conventions/`, `conventions/`, and `skills/` stay in place, including deliberate deletions. The content manifest version and Git metadata/policy are preserved. Do not edit managed operational skills; make shared resources in the authoring directories.

`agentscli-hub.yml` contains exactly `schemaVersion: 1` and content `version: 1.0.0` initially. That content version and hub `v1.0.0` tag are independent of this CLI package's `0.1.0` and product tag `agentscli-hub-v0.1.0`.

Discover the hub's five included skills through their names/descriptions: internal convention maintenance, root AGENTS editing, shared convention maintenance, shared skill maintenance, and requested content publication. Each ships its own deterministic checks. Conventions are self-contained and do not link to conventions or skills. Skills declare dependencies with a string `metadata.requires: requires.yml` and native YAML lists of `id`/`source`; shared resources may require only resources from the same hub. Consumers select every shared dependency explicitly.

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

A complete shared skill, `skills/review-tests/SKILL.md` (identity `review-tests`):

```markdown
---
name: review-tests
description: Review requested automated test changes for meaningful behavior coverage and regressions.
license: MIT
compatibility: Requires Node.js >= 22.
metadata:
  requires: requires.yml
---

# Review tests

Discover the required testing convention by its hub identity through the active project's instructions. Confirm that the convention comes from the accepted hub revision.

Read the requested test changes and the behavior they exercise. Check whether assertions can detect the stated regression, whether failure paths are covered, and whether fixtures are deterministic. Report concrete actionable findings with their affected files and behavior. Do not implement changes or publish anything during this review.

The dependency declaration is this skill's own [requires.yml](requires.yml).
```

The complete sibling `skills/review-tests/requires.yml`:

```yaml
conventions:
  - id: testing
    source: hub
skills: []
```

This skill needs no additional support files. Consumers explicitly select both `testing` and `review-tests`; the dependency declaration never adds selections automatically. Shared resources retain their authored metadata, without CLI generator stamps.
