# Tasks

## 1. Enforce canonical convention filenames

- [x] 1.1 Implement the shared H1 normalization and blocking diagnostic for current clients. Add focused unit cases for formatted headings, case and accents, punctuation, empty slugs, nested paths, collisions, and rejection before writes.
- [x] 1.2 Integrate the rule with explicit legacy migration. Verify in unit tests that conforming sources still migrate and mismatches fail during preview and apply without changing the old sources or files.
- [x] 1.3 Align both bundled context filenames, the shared authoring and build skills, README, and affected tests. Verify both starter locales, existing valid customizations, and repeated init behavior. Run `npm run check` and `npm run build`.

## 2. Release and update the local CLI

- [x] 2.1 Prepare the breaking beta version using `agentscli-release`. Verify Git and registry identity availability, package contents, executable, license, and SHA-512 integrity for the final tarball.
- [x] 2.2 Publish the verified candidate to npm and publish the corresponding source commit and tag. Confirm the remote source identity and registry version and integrity.
- [x] 2.3 Update the active local CLI from the published package and report the resolved executable and `agentscli --version`. Confirm the installed release is available to the consumer migration.
