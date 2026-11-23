# Resource hub

This independent Git repository shares explicitly selected conventions and complete skill trees. Use any native Git host, public or private. Configure the remote with native Git; no vendor service or npm publication is required.

Author internal rules in `docs/conventions/`, discovery in `AGENTS.md`, shared templates in `conventions/`, and shared skill trees in `skills/`. Each has its own operational authoring skill. Ask to publish hub changes to use agentscli-hub-publish: the agent assesses impact and the included helper selects and verifies the content release. Ordinary publication does not ask you to choose a version.

Shared conventions begin with YAML containing only `trigger`, followed by one H1 and self-contained Markdown. Their relative path without `.tpl.md` is the convention identity. Skills use standard `SKILL.md`; optional `metadata.requires: requires.yml` points to one sibling YAML document with explicit conventions and skills lists of id/source mappings. Shared dependencies use source hub. Neither conventions nor skills link directly to other resources; skills discover dependencies by identity.

The manifest starts with schemaVersion 1 and content version 1.0.0. Content tags use `v1.0.0`, independently of the CLI package version. Consumers pin one exact commit and select only the resources they need; all declared dependencies must also be explicitly selected.

Run `agentscli-hub apply <directory>` again to update the five managed operational skill trees and this README. Their edits are disposable and obsolete managed files are removed. Authored content, intentional authored deletions, manifest version, Git policy, remotes, refs, staging, and unrelated files are preserved. `--dry-run` previews the same plan without writes. An interrupted apply reports completed and pending effects; retry the same command.

An interrupted first creation can resume when native Git remains unborn, has no refs, staging or remotes, and the non-Git files are an exact subset of the initial scaffold. Changed, unrelated, or unsafe content requires explicit reconciliation. The manifest is written last; after identification, repeat apply always preserves authored deletions.
