# Tasks

## 1. Administrative skills and repository policy

- [x] 1.1 Update each administrative skill's independent validator to accept `metadata.agentscli` with `agentscli-skill.yml` and skill-only `requires`, rejecting old declarations; verify valid/invalid cases in `tests/unit/admin.test.mjs` without adding shared custom implementations.
- [x] 1.2 Remove the three administrative convention dependency files/pointers and retain necessary operation guidance in each skill's own body/support; verify administrative checks pass without convention dependency resolution and semantically review inputs, decisions, procedures, and completion criteria.
- [x] 1.3 Add handwritten `docs/conventions/versioning.md` and its conditional AGENTS discovery entry, update skill-authoring/mechanical-validation guidance and `openspec/config.yaml`, and make publication guidance state the beta rule within its own skill; verify the administrative authoring/discovery checks, formatting, and semantic consistency.

## 2. Consumer configuration and dependency behavior

- [x] 2.1 Replace the parser/closure contract in the consumer build skill's own engine with the general configuration document and skill-only graph; verify unit cases for absent/empty configuration, pointer/file disagreement, malformed YAML, unsafe paths, unknown/extra keys, obsolete forms, duplicates, identity/source matching, missing/transitive references, and terminating existing cycle behavior.
- [x] 2.2 Replace the three consumer dependency files/pointers with independent `agentscli-skill.yml` declarations requiring local `agentscli-build-agents`, leaving the build skill without an empty file; verify authoring/engine units cover desired package declarations on initial apply and replacement of obsolete or damaged managed copies.
- [x] 2.3 Update import/offline/lifecycle call sites and fixtures to validate only skill dependencies while preserving explicit convention selection, snapshot integrity, and write-free failure; verify hub-engine and import unit suites cover missing transitive skills, wrong origins, same-ID conventions, blocked detach, invalid accepted old-format sources, and valid prospective updates without a compatibility route.
- [x] 2.4 Update the consumer README and affected skill instructions to describe the general document and self-contained operation guidance; verify complete examples match the new fixtures and no maintained positive example teaches convention dependencies or the former pointer.

## 3. Hub configuration and authoring behavior

- [x] 3.1 Update all five hub-owned support implementations independently for the same configuration schema and skill-only closure; verify their existing contract/apply/publication units enforce same-hub revision, reject local dependencies in shared skills, and preserve each skill's scope.
- [x] 3.2 Revise shared-skill authorship instructions and `references/resource-format.md` with a complete valid SKILL.md/configuration example and no convention-provided procedure; verify positive examples against the owning deterministic checker and unit cases for invalid dependencies and forbidden cross-resource links.
- [x] 3.3 Update hub scaffold `resource-authoring.md`, hub README, and root README for the current format, independence, and direct beta replacement; verify assembled scaffold expectations in lightweight units and retain existing manifest/content-version identities without an old-client guard or migration mechanism.

## 4. Distribution and complete resource ownership

- [x] 4.1 Update both package assembly checks and administrative candidate/archive inspection for declared general files and the retired declaration format; verify package, assembly, and administrative units catch missing/unsafe configuration and retain four/five complete operational trees with correct license, compatibility, and actual generator stamps.
- [x] 4.2 Verify the full twelve-skill inventory and independent support ownership, retained convention/link rules, work-input access, authoritative-source versus managed-output behavior, and absence of new public commands or compatibility machinery; use applicable existing unit checks plus semantic review and record their separate limits.

## 5. Release preparation and local readiness

- [x] 5.1 Through `agentscli-adm-publish-packages`, derive unused next beta versions independently for both affected packages, update their metadata and root lockfile with native npm, and confirm package/tag/registry identities; verify neither package is promoted to production solely for the breaking beta format change and the private root remains unpublished.
- [x] 5.2 Run focused affected unit suites and root `npm run check` against the final versioned sources; verify unit/type/format and administrative gates pass, record actual results, and add no subprocess/network/installation/integration test suite.
- [x] 5.3 Build both packages and inspect native npm pack previews and actual archives in ignored storage using the administrative archive checker; verify exact inventory, declared configuration/support, nine current generator stamps, bin/license/README/locales/scaffold, exclusions, and SHA-512 evidence for the reviewed candidates.

## 6. Publish the affected packages

- [x] 6.1 Prepare the reviewed implementation/delivery source commit and intended branch push, preserving unrelated work and published history; verify the exact commit and candidate inputs are identified and the existing pre-push gate succeeds.
- [x] 6.2 Create and push the unused `agentscli-hub-v<version>` tag and publish the exact inspected hub CLI archive through native npm; verify public Git tag/commit and registry name/version/visibility/license/bin/SHA-512, retaining this task as incomplete for unresolved authentication or ambiguous delivery.
- [x] 6.3 Create and push the unused `agentscli-v<version>` tag and publish the exact inspected consumer CLI archive through native npm; verify public Git tag/commit and registry name/version/visibility/license/bin/SHA-512, inspecting the same immutable identity before retrying an ambiguous result.

## 7. Update the active host and report completion

- [x] 7.1 Reinspect the active Node/npm prefix and CLI resolution, then install both exact publicly verified release versions globally, including agentscli-hub if absent; verify native npm installation succeeds while preserving unrelated packages, other Node installations, and project contents.
- [x] 7.2 Verify global package records, command resolution paths, and `agentscli --version` / `agentscli-hub --version` match the released identities; report changed files, actual checks, verified releases, installed versions, and any remaining work, leaving failed publication or host-update tasks open and never running project apply as an installation check.

## Execution evidence

- Local implementation completed on branch codex/simplify-skill-configuration. Root npm run check passed: 97 consumer, 43 hub, and 14 administrative units (154 total), typechecks, formatting, and administrative checks. Both builds passed.
- Independent review reproduced and confirmed fixes for reserved filename aliases, obsolete dependency comments in support Markdown, and skill configuration on internal hub conventions. No concrete remaining blocker was reported.
- Native npm previews and real archives passed the administrative byte/inventory/metadata checker: agentscli 0.5.0 has 59 files; agentscli-hub 0.2.0 has 35 files. Candidate archives and pack/integrity records are in ignored .tmp/releases/simplify-skill-configuration/.
- The global skill-creator validator accepts the three administrative skills but rejects the nine distributed skills solely because its allowlist omits the existing standard compatibility field. Owned strict validators and distribution checks passed; the global validator was not modified.
- No new installation, network, subprocess, or integration test suite was added. Native build/pack inspection was performed as delivery preparation.
- The npm account uses two-factor mode auth-and-writes. Work initially paused before publication interaction as requested; after explicit resumption, the user confirmed browser authentication and both native npm publications succeeded. Both released CLI versions are installed and verified in the active host environment.

- Reviewed source commit: 621a963332fc3c6ae4efcac7097b982ed29c2ae0, pushed and verified at origin/codex/simplify-skill-configuration; native pre-push gates passed. Both immutable package-specific tags now resolve to this source commit, and both exact public npm artifacts have been verified.
- Prepared @devel-solid/agentscli@0.5.0: devel-solid-agentscli-0.5.0.tgz; SHA-512 integrity sha512-N/nBlXFIIz0NGOA9xt+O5a9+0boN9hXAucdBA7vm4rJQdoksPyd0UHEKtHLq1LWR5yauh5YIe8RFTzHKWb17Kw==.
- Prepared @devel-solid/agentscli-hub@0.2.0: devel-solid-agentscli-hub-0.2.0.tgz; SHA-512 integrity sha512-O6R1LbeZAf49wnj5eoR2T9IzLEy23YrC+ZlU9CabjmEIN3hHkvtn03lxYaxmdqM9JwDvRrAKjQuFvYp3yOkjlg==.

- Public verification completed at 2026-11-23T22:26:40Z: both package versions, MIT licenses, dist/cli.js executable mappings, public tarball identities, and SHA-512 integrities match the inspected archives.

- Host verification completed at 2026-11-23T22:27:33Z on Node v24.15.0, global prefix C:/nvm4w/nodejs: agentscli --version returns 0.5.0 and agentscli-hub --version returns 0.2.0. All resolved command shims use that prefix; OpenSpec 2.0.0, corepack 0.34.7, and npm 11.13.0 remain unchanged. No project apply was run.
- Delivery is complete: both public tags/artifacts and active host CLI versions are verified. Ignored public-verification and host-verification JSON records preserve exact evidence.
