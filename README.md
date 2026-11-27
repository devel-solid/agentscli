# agentscli workspace

**Development repository for [`@devel-solid/agentscli`](packages/agentscli/README.md).**

This private npm workspace contains the CLI source, packaged skills, and unit tests. For installation, examples, and usage, read the [package documentation](packages/agentscli/README.md).

## Development

Requires Node.js 22, 24, or 26. From the repository root:

```sh
npm ci
npm run setup
npm run check
```

`setup` configures the Git pre-push hook. `check` runs type, formatting, unit, and resource checks; CI uses the same gate.

## Repository guide

| Location                  | Purpose                                                               |
| ------------------------- | --------------------------------------------------------------------- |
| `packages/agentscli/`     | Public package, product documentation, source, templates, and tests   |
| `.agentscli/conventions/` | Authored rules for working on this repository                         |
| `.agents/skills/`         | Installed product skills and the repository's local publication skill |

## Convention design

Keep one recurring decision per convention, with a title and trigger that identify when it applies. The product ships separate authorship, refactoring, and index-building skills. Teach difficult decisions with concrete before/after examples, including why a plausible alternative fails. Preserve rule-and-exception pairs when both govern the same choice.

For example, fixture independence and fixed test clocks have independent consumers and belong in separate conventions. Canonical option spelling and its supported-caller alias exception belong together. The package documentation and bundled case studies show complete documents for these decisions.

Refactoring review uses optional `reviewedHash` and `reviewPolicyVersion` metadata to select conventions whose path/content or review criteria changed. Only an actually completed review records those fields; reopening a cached review with unresolved findings invalidates its receipt to keep it pending. Ordinary authoring and index generation do neither. The current review policy is independent of the npm version, and skipped conventions remain context for discovering new overlaps. Read the package documentation for the private selection, recording, and invalidation workflow and explicit no-write behavior.

## Refresh local project resources

Edit packaged skills in `packages/agentscli/assets/templates/skills`. After changing the CLI, packaged resources, or package metadata:

```sh
npm run dogfood
npm run check
```

`dogfood` builds the local CLI, refreshes this repository's installed skills, and synchronizes its `AGENTS.md` index. Commit generated resources along with their source changes.

## Publish a release

The [Publish agentscli workflow](.github/workflows/publish.yml) publishes through npm Trusted Publishing without a stored npm publishing token. Configure GitHub Actions as a trusted publisher for `@devel-solid/agentscli`, with owner `devel-solid`, repository `agentscli`, workflow filename `publish.yml`, and direct publishing enabled.

Use the publication skill to prepare the version, refresh resources, run checks, and inspect a tarball with the workflow's exact Node/npm versions. Commit the reviewed source and create an annotated `agentscli-v<version>` tag containing one `Integrity: sha512-...` line with the reviewed tarball's integrity. Verify the npm trust configuration, then push the tag to start publication automatically. The workflow publishes only from a release tag, checks its version against package metadata, and requires the rebuilt archive to match the annotation's integrity. Ordinary branch pushes do not publish, and no manual dispatch is configured. Verify the run and registry, then install the exact published CLI version on the host.

[MIT License](packages/agentscli/LICENSE)
