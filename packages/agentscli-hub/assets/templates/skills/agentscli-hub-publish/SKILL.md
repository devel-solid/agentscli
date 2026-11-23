---
name: agentscli-hub-publish
description: 'Publish explicitly requested hub content changes through native Git, selecting a semantic content version and verifying branch and immutable tag delivery. Use for hub publication, never for npm CLI package releases.'
license: MIT
compatibility: Requires Node.js >= 22.
---

# Publish hub changes

Publish only this independent hub repository and the requested content scope. This workflow never publishes npm packages or creates a hosted repository. The hub manifest content version and `v<version>` tag are independent of the CLI generator version. Use the configured native Git credentials; never collect tokens or choose a hosting vendor.

Assess semantic impact before invoking the helper: corrections and internal-only changes are patch; compatible additions are minor; removal or rename of resource identities, incompatible rules, or new required dependencies are major. Use the highest impact. The first release is 1.0.0. Respect an explicit valid user version override. Ask only for a missing concrete remote or branch; do not require ordinary users to choose a version. Review self-containment and dependency changes semantically, then run the deterministic helper. Preserve unrelated edits and staging. Never force, retag, or overwrite a published identity. On partial or ambiguous delivery, inspect native refs and retry the same candidate; do not bump again. A release is complete only after branch and tag verification. A preview may inspect remote refs but cannot change project files, index, or refs.

Use [scripts/release.mjs](scripts/release.mjs) after assessing scope and impact. Read [references/publication.md](references/publication.md) for destination, candidate, retry, and failure semantics. The helper validates the complete hub before mutation.

```sh
node <this-skill>/scripts/release.mjs plan --repo-root <hub> --bump minor
node <this-skill>/scripts/release.mjs publish --repo-root <hub> --bump minor
node <this-skill>/scripts/release.mjs verify --repo-root <hub> --bump minor
```

Replace `<this-skill>` with this skill's discovered directory. Resolve the repository root from the active project. Report the content version, commit, tag, verified destination, completed effects, and remaining effects.
