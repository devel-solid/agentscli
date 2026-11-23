---
name: agentscli-release
description: Prepare and perform authorized versioning and publication of the agentscli npm package using native Git and npm.
---

# Release agentscli

Use only in the CLI source repository: `agentscli.yml` identifies it, without client configuration or a legacy manifest. This versions the CLI package through native Git/npm; there is no separate instruction-catalog release or CLI release subcommand.

## Prepare the concrete candidate

1. Read the request, project instructions/publication policy, current package/lockfile metadata, Git status/diff, refs, remote, and registry state. Preserve unrelated work and history; identify the authorized local and external effects.
2. Derive the package identity and repository destination from current metadata. Select an unused semantic version from the actual impact and its `agentscli-v<version>` tag, checking existing versions/refs. Use `npm version <version> --no-git-tag-version` for metadata-only preparation. Do not repeat a completed repository rename or choose identities from first-release history.
3. Run the focused units as needed and `npm run check`, then `npm run build`. Only lightweight unit tests belong to the default gates; do not add integration suites or installation environments for release preparation.
4. Inspect `npm pack --dry-run --json` and the actual candidate archive. Check compiled runtime, both `en` and `pt-br` document resources, all three complete client skill trees, README, MIT license, executable, and metadata. Exclude internal skills/manifest, OpenSpec, tests, source maps, and checkout paths. Installation must not compile or fetch resources.
5. Present the exact source commit or pending diff, version/tag, tarball, SHA-512 integrity, remote, and npm destination. A dirty candidate is not the final committed identity; reconcile and reinspect if source or metadata changes.

## Deliver within authorization

Prepare reviewable local work before asking for any missing authorization. Reuse existing authorization within scope; preparation alone does not authorize rename, commit, tag, push, or publication.

Check native authentication, destination permissions, package-name eligibility, and registry versions at delivery without exposing credentials. A registry 404 reserves nothing. Use existing authentication; never collect tokens in chat or artifacts.

Within authorization, commit the reviewed source, create the unused tag, push those exact refs, and publish the inspected tarball with public access. Preserve existing tags, commits, and published versions; never overwrite identities, reset/purge history, initialize replacement history, or force-push. Do not add a publication engine, journal, or automatic retry service.

## Verify and report

Verify the public commit/tag and npm name, version, visibility, MIT license, required resources, and `dist.integrity` against the candidate. Read remote state before retrying an ambiguous push/publish response. A tag or integrity mismatch blocks delivery; correct a published defect through a new version.

Report the actual commit, tag, package/version, artifact integrity, executed checks, and any pending account action. Local readiness alone is not a published release; keep unperformed delivery tasks open.
