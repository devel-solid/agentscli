---
name: agentscli-manage-hub-imports
description: Explicitly select, preview, import, update, switch, detach, or locally check the single Git resource hub consumed by this project. Use for hub resource lifecycle requests; ordinary instruction generation belongs to agentscli-build-agents.
license: MIT
compatibility: Requires Node.js >= 22.
metadata:
  agentscli: agentscli-skill.yml
---

# Manage this project's hub imports

Use this skill only in a consumer project. Read its instructions and discover the local agentscli-build-agents dependency by identity. The scripts discover that co-distributed dependency themselves; no globally installed CLI is required. Do not execute imported skill code, install packages, collect credentials, change Git configuration, commit, or publish as part of importing.

Use the deterministic [private script](scripts/hub-imports.mjs). Resolve that path against this skill's discovered directory and pass the consumer root explicitly. These are private skill operations, not public CLI commands.

## Select and preview

Obtain one credential-free native network Git endpoint, an explicit full commit or tag, and both explicit resource lists. An empty list is valid. Accept public or private repositories from any provider through the user's existing native Git authentication. Never assume a branch, latest release, all resources, or a second hub.

```sh
node scripts/hub-imports.mjs plan --repo-root <project> --repository git@example.org:team/conventions.git --tag v1.0.0 --conventions testing,security --skills code-review
```

Use `--commit <full-object-id>` instead of `--tag` to pin a commit directly. Use `--conventions ""` or `--skills ""` for an explicitly empty selection. Resource IDs are relative convention names without `.tpl.md`, or skill directory names.

Planning inspects committed trees in disposable Git storage, performs the complete prospective source/dependency/destination validation, and returns JSON without writing into the project. Review the exact resolved commit and all proposed changes. Selected skills declare only other skills through optional `metadata.agentscli: agentscli-skill.yml` and its `requires` list of `id`/`source` references. Every transitive hub skill must be explicitly selected from the same revision; missing dependencies stop the operation. Convention selection is independent, and conventions cannot satisfy skill dependencies. No dependency is fetched automatically. Former dependency declarations are unsupported and are not converted or rewritten in accepted snapshots.

Preserve the complete returned JSON as the reviewed intent outside the project inputs. The script does not write a plan file. If saving a plan is not requested, retain its exact commit and selections and use an explicit apply preview before applying.

## Apply the reviewed intent

```sh
node scripts/hub-imports.mjs apply --repo-root <project> --plan-file <reviewed-plan.json> --dry-run
node scripts/hub-imports.mjs apply --repo-root <project> --plan-file <reviewed-plan.json>
```

The reviewed plan binds the current project state, candidate integrity, effects, exact commit, and selections. Application fetches that commit rather than resolving the original tag again. Changed preconditions require a new review. An already authorized import needs no additional confirmation after a successful preview.

For an authorized operation without a saved plan, pass the same explicit repository, `--commit`, and both lists to `apply`; add `--dry-run` first when preview was requested. Updating, changing selections, and switching repositories use this same workflow. Never silently switch repositories or revisions.

Only selected source trees are stored. The accepted lock records the hub content version separately from either CLI version, canonical text or opaque bytes, SHA-256, and Git executable intent. Preserve the complete accepted snapshot in project Git, including binaries and executable metadata. Do not hand-edit protected snapshot/configuration/lock files or ignore them.

Managed installed skills and generated documents are replaceable outputs. Edits and extra files inside an accepted imported skill are removed by synchronization. Unrelated local skill directories cannot be adopted, even when their bytes match. Local authoring remains in the project's authored templates and local skills.

## Check or detach

```sh
node scripts/hub-imports.mjs check --repo-root <project>
node scripts/hub-imports.mjs detach --repo-root <project> --dry-run
node scripts/hub-imports.mjs detach --repo-root <project>
```

Check is entirely local, makes no temporary files, and never invokes Git or the network. It validates accepted integrity and reports generated/installed drift. Ask agentscli-build-agents to repair ordinary materialization drift; discover its project entrypoint rather than linking directly to it.

Detach validates the prospective project without hub resources first. Local authored dependencies on removed skills block removal. Review the exact cleanup and preserve unrelated content. Detach removes the accepted hub snapshot, imported outputs and installed trees, and the optional hub configuration only after verification.

## Handle failure accurately

Scripts validate all possible conflicts before effects. Operational failure can still leave partial writes. Report the exact commit, completed and pending effects, and diagnostics. No rollback, journal, revision allocation, or automatic ownership adoption occurs. Retry only the same exact commit, selections, and operation when ownership remains provable. If snapshot integrity, accepted state, or an occupied destination makes retry ambiguous, reconcile the project's Git state explicitly before a new plan.

Exit codes are `0` success, `1` drift from local check, `2` invalid input/conflict, and `3` operational failure. Every operation prints structured JSON. Report actual checks and unresolved drift; do not claim an unperformed import or verification.
