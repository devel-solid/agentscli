---
name: agentscli-adm-publish-packages
description: Prepare, version, and publish the two CLI npm packages from this tool monorepo using native Git and npm. Use for authorized CLI releases, never a user hub's content release.
metadata:
  requires: requires.yml
---

# Release CLI packages

Discover this monorepo and the requested workspace through current package metadata and project instructions. Run this skill's `node scripts/check.mjs --repo-root <root> --package <agentscli|agentscli-hub>` for concrete candidate checks. Do not publish the private root or use a hub's content-publication skill.

Derive package identity/version, executable, registry, Git remote, and tag from actual metadata and current local/remote/registry state. Tags use agentscli-v<version> or agentscli-hub-v<version>. The first hub CLI is 0.1.0, independent of hub content versions. Preserve immutable identities, native authentication, unrelated work, and staging. Never collect/print tokens, rewrite history, force-push, or replace published identities.

Assess completed impact and choose an unused semantic version. Account for public command removals and managed replacement. Prepare metadata with native npm version --no-git-tag-version in the target workspace and update the root lockfile. The requested two releases do not create lockstep versions or an unrelated package bump.

Run focused units and the root check gate, then build and inspect npm pack previews and actual archives in ignored storage. Check each archive using this skill's checker with --archive <tarball>. Verify identity/version/license/bin, four/five complete skill closures, exact compatibility and actual generator stamps, consumer locales, runtime/README/license, and exclusions. Rebuild when candidate inputs change.

Present exact reviewed source commit or pending diff, versions/tags, destinations, tarballs, and SHA-512 integrity before external delivery. Reuse existing scoped authorization; request only missing authorization or concrete account/destination information. Local readiness is not publication.

Within authorization, commit reviewed source, create immutable unused tags, push the intended branch/tags, and publish inspected tarballs through native npm with public access. Check current remote/registry state before retrying an ambiguous response and resume/verify the same candidate instead of blindly bumping again.

Verify remote commits/tags and registry name/version/license/bin/integrity against reviewed artifacts. Keep delivery tasks open for pending account actions or incomplete verification. Report actual identities, checks, completed effects, and remaining actions. Add no publication engine, journal, repository rename, or unrelated client/global rollout.
