---
name: agentscli-adm-publish-packages
description: Prepare, version, and publish the agentscli npm package from this tool monorepo using native Git and npm. Use for authorized CLI releases.
---

# Release CLI packages

Discover this monorepo and its workspace through current package metadata and project instructions. Run this skill's `node scripts/check.mjs --repo-root <root> --package agentscli` for concrete candidate checks. Do not publish the private root.

Derive package identity/version, executable, registry, Git remote, and tag from actual metadata and current local/remote/registry state. Tags use agentscli-v<version>. Preserve immutable identities, native authentication, unrelated work, and staging. Never collect/print tokens, rewrite history, force-push, or replace published identities.

Assess completed impact and choose an unused semantic version. Major zero means beta; production starts at 1.0.0. Beta contract changes replace the old contract directly without transition periods, migration, or backward-compatibility machinery, and do not require promotion to production. Account for public command removals and managed replacement. Prepare metadata with native npm version --no-git-tag-version in the workspace and update the root lockfile.

Run focused units and the root check gate, then build and inspect npm pack previews and actual archives in ignored storage. Check each archive using this skill's checker with --archive <tarball>. Verify identity/version/license/bin, three complete skill closures, exact compatibility and actual generator stamps, consumer locales, runtime/README/license, and exclusions. Rebuild when candidate inputs change.

Present exact reviewed source commit or pending diff, versions/tags, destinations, tarballs, and SHA-512 integrity before external delivery. Reuse existing scoped authorization; request only missing authorization or concrete account/destination information. Local readiness is not publication.

Within authorization, commit reviewed source, create immutable unused tags, push the intended branch/tags, and publish inspected tarballs through native npm with public access. Check current remote/registry state before retrying an ambiguous response and resume/verify the same candidate instead of blindly bumping again.

Verify remote commits/tags and registry name/version/license/bin/integrity against reviewed artifacts. Keep delivery tasks open for pending account actions or incomplete verification. Report actual identities, checks, completed effects, and remaining actions. Add no publication engine, journal, repository rename, or unrelated client/global rollout.
