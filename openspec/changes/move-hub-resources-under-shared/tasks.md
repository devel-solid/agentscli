# Tasks

## 1. Apply the current hub scaffold and ownership contract

- [x] 1.1 Move the two scaffold placeholders to `shared/conventions/.gitkeep` and `shared/skills/.gitkeep`; update scaffold AGENTS/README and resource-authoring guidance plus hub/root README examples. Verify assembly units recognize the current roots, exact schema/content defaults, complete examples, and unchanged operational source/destination locations.
- [x] 1.2 Update hub runtime bootstrap allowance, authored-root scans, first-use directory effects, and prospective planning for the new parent. Extend `apply.test.mjs` to verify first apply, write-free preview, interrupted bootstrap, preservation of authored changes/deletions and unrelated paths, managed replacement, and unchanged manifest/Git state.
- [x] 1.3 Preserve ordinary safety at `shared/` and its descendants. Verify injected apply/contract units reject occupied file/directory conflicts, symlinks/junctions, hard links, escapes, and portable aliases before writes; review the diff to confirm no old-layout detection, conversion, relocation, fallback, or special root-directory blocking was added.

## 2. Update each independent hub operational skill

- [x] 2.1 Update discovery, inspection, relative-ID extraction, and assigned-scope checks in all five independent `agentscli-hub-*` support implementations. Update the two shared-authoring entrypoints and relevant own references; verify `contracts.test.mjs` exercises each validator with nested convention IDs, direct-child skills, skill-only dependencies, and current shared/internal separation.
- [x] 2.2 Update physical resource and consumer source/output aliases without prefixing installed/snapshot paths with `shared/`. Verify focused link units accept own-support references and reject cross-resource Markdown/HTML/encoded links and fixed foreign workflow paths at current physical and logical locations.
- [x] 2.3 Update hub content-publication path eligibility to the current shared roots and revise its own publication guidance where needed. Verify `publication.test.mjs` accepts scoped shared convention/skill changes, preserves unrelated staging, and retains content version/tag, preview, and same-identity retry behavior.

## 3. Acquire shared resources into unchanged consumer snapshots

- [x] 3.1 Update the import skill's Git capture to select only the current `shared/` resource paths and the root manifest, inspecting committed attributes against physical Git paths. Verify `hub-imports-git.test.mjs` covers exact revision capture, exclusion of operational/unselected trees, `-text` at the real path, regular executable modes, unsafe entries, and ordinary missing-source failure without alternative-root lookup.
- [x] 3.2 Update snapshot construction to validate physical selected paths and map them once to logical `conventions/` and `skills/` inventory keys. Verify `hub-imports-contracts.test.mjs` covers ID preservation, complete support/configuration trees, portable collisions before/after mapping, unchanged manifest and lock schema, opaque bytes, text canonicalization, digests, and modes.
- [x] 3.3 Extend `hub-imports-lifecycle.test.mjs` and `hub-engine.test.mjs` with current-layout candidates and unchanged local snapshots. Verify acquisition/update/switch/detach, explicit dependency selection, local/imported collisions, snapshot tampering rejection, offline generation, and existing accepted snapshots without source/hash/pin rewrites or network access.
- [x] 3.4 Update the consumer package README, import skill guidance, and hub examples to explain physical shared paths, unchanged snapshot paths, stable IDs, and direct beta adoption. Verify executable examples use shipped operations, keep support links portable, and introduce no migration or project rollout instructions into package delivery.

## 4. Prepare and review both release candidates

- [x] 4.1 Use `agentscli-adm-publish-packages` to assess each completed package impact and select unused independent beta versions from current metadata, tags, remotes, and registry state. Prepare package versions with native npm's `--no-git-tag-version` workspace workflow and update the root lockfile; verify distinct package/tag identities and unchanged hub manifest schema/content defaults.
- [x] 4.2 Run focused units during the owning implementation tasks, then the root `npm run check` on a declared Node.js line after candidate metadata changes. Record passing unit/type/format/administrative evidence; keep the gate within the existing lightweight unit policy without adding subprocess, installation, network, or end-to-end test suites.
- [x] 4.3 Run `npm run build`, native pack previews, and actual workspace tarballs in ignored storage. Inspect each with the administrative checker and `--archive`; verify exact inventories/bytes, MIT/bin/runtime metadata, real generator stamps, four/five complete operational closures, current hub scaffold placeholders, consumer importer support, and exclusion of repository-only or former shared scaffold roots. Update related archive fixtures/expectations if necessary and rerun the affected focused checks.
- [x] 4.4 Review the final change using the `review` skill and reconcile confirmed issues. Verify the reviewed source diff or commit, independent versions/tags, destinations, exact tarballs, SHA-512 integrities, and actual check results are recorded before external delivery; rebuild/reinspect affected artifacts if candidate inputs change.

## 5. Publish and verify both CLI packages

- [x] 5.1 Within the later execution authorization, commit the reviewed source and create/push unused immutable package-specific tags through the administrative native Git workflow. Verify the intended branch and `agentscli-hub-v<version>` / `agentscli-v<version>` refs identify the exact reviewed candidate source while preserving unrelated work and history.
- [x] 5.2 Publish the inspected `@devel-solid/agentscli-hub` tarball through native npm with public access. Verify registry identity/version/license/bin/visibility/SHA-512 and the exact remote source/tag; leave incomplete account or delivery actions open without overwriting identities.
- [x] 5.3 Publish the inspected `@devel-solid/agentscli` tarball through the same administrative workflow. Verify its own registry metadata, integrity, and remote source/tag independently; inspect the same exact identity before retrying any ambiguous response rather than republishing or blindly bumping.

## 6. Update and verify the active host

- [x] 6.1 After each package's public release is verified, install its exact version into the active host's global npm environment. Verify global package metadata and preserve unrelated packages and Node installations; track host failure separately from already completed publication.
- [x] 6.2 Verify both executables' resolution paths and reported versions against the exact released versions, resolving relevant PATH mismatches before claiming completion. Report both releases, host results, and remaining actions; verify neither CLI was applied to this source repository, the independent hub, the SGO, or another project.

## Workflow follow-up

- Archive this tool change only after its implementation, both publications, and host verification are complete.
- Plan any authored layout/instruction update to the independent hub in its own OpenSpec. Importing `review`, publishing hub content, and SGO integration remain separate project work.

## Verification evidence

- Implementation used Node.js `24.15.0` and npm `11.13.0`. Focused hub apply/assembly units passed 19/19, hub contract/publication units passed 32/32, and consumer import/offline/package units passed 39/39. Root `npm run check` passed 172 units (107 consumer, 51 hub, 14 administrative), both workspace type/format gates, and all administrative checks. Separate `npm run build` passed for both workspaces. The native pre-push hook reran the same complete gate successfully.
- Independent reviews of consumer behavior, hub behavior/security, and documentation/scope against base `504842a84db068f1f70ed69a06d812f773df9388` found no confirmed remaining issue. No integration, installed-package, subprocess, or live-provider test suite was added.
- The generic external skill-creator validator rejected the preexisting `compatibility` field required by this repository. That field was preserved; the native package resource/frontmatter/dependency/link checks and actual archive checks passed.
- Prepared `@devel-solid/agentscli-hub@0.3.0`, tag `agentscli-hub-v0.3.0`: 35 files, archive `.tmp/releases/agentscli-hub-0.3.0/devel-solid-agentscli-hub-0.3.0.tgz`, integrity `sha512-GUVNgQyNxjka6mrcle3Kaj+9GpoSUGu3uSDlxINqPW4Hy7cNAsIJDOSnsiXQaGPRssN7O3/3pEY7imOpRBYK9Q==`.
- Prepared `@devel-solid/agentscli@0.6.0`, tag `agentscli-v0.6.0`: 59 files, archive `.tmp/releases/agentscli-0.6.0/devel-solid-agentscli-0.6.0.tgz`, integrity `sha512-1KLafkaJLGQTruWYcalkOEAR7VdBSEO5gdry50lt/f5w8y2VpLgZDRPhkwFycC3QAAvNDxFPNHbKLycy5FHZPg==`.
- Native pack previews and real tarballs passed the administrative archive checker against complete prepared inventories and bytes. Additional inspection confirmed the two `shared/` scaffold placeholders, absence of former shared scaffold roots, and current physical capture/mapping in the consumer import support.
- Delivery completed on 2026-11-24. Source commit `195f3f7a36e6668da65fa9a05eae94cbc6816e35`, branch `codex/move-hub-resources-under-shared`, and annotated tags `agentscli-hub-v0.3.0` / `agentscli-v0.6.0` were pushed and verified on origin; both tags peel to that exact source commit.
- Native npm accepted both inspected tarballs after account authentication. Unauthenticated public registry reads subsequently confirmed both exact names/versions, MIT licenses, executable mappings, `latest` tags, and the SHA-512 integrities above. Processing delays were verified without repeating either publication.
- Native npm installed the exact verified releases in the active global prefix `C:\nvm4w\nodejs`. Global metadata and the resolved `agentscli.ps1` / `agentscli-hub.ps1` commands at that prefix report `0.6.0` and `0.3.0` respectively. OpenSpec `2.0.0`, corepack, npm, unrelated packages, and other Node installations were preserved. Neither CLI was applied to any project; the independent hub, personal `review` skill, and SGO were untouched. No publication, account, or host-update action remains.
