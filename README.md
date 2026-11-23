# agentscli monorepo

Two independent MIT packages share this private npm workspace:

| Package                                                        | Executable      | Purpose                                                                                         |
| -------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------- |
| [@devel-solid/agentscli](packages/agentscli/README.md)         | `agentscli`     | Apply project instructions, local convention templates, and explicitly selected hub resources.  |
| [@devel-solid/agentscli-hub](packages/agentscli-hub/README.md) | `agentscli-hub` | Apply the managed scaffold of an independent Git repository for sharing conventions and skills. |

Both require a supported Node.js line declared in their package metadata: 22, 24, or 26. Native Git is additionally required for hub initialization, acquisition, and publication. Existing native Git authentication works with public/private repositories on any supported Git host. No hosted hub service, provider SDK, or token store is required.

## Use

```sh
npm install --global @devel-solid/agentscli @devel-solid/agentscli-hub
agentscli apply --repo-root ./my-project --dry-run
agentscli apply --repo-root ./my-project
agentscli-hub apply ./my-hub --dry-run
agentscli-hub apply ./my-hub
```

`apply` is the only operation in either public CLI; both also support help/version. Repeat it after upgrading the owning package to replace its managed resources. Managed edits are disposable, removed files stay removed from managed destinations, and authored content/state are preserved. There is no merge or whole-project deletion. The consumer's explicit `apply --migrate` transfers supported legacy layouts and converts local AGENT-CARD metadata; invalid dependencies or cross-resource links need scoped authoring cleanup first.

Agents perform generation, validation, imports, and releases through the appropriate project skills and their deterministic scripts. Applying a hub creates its local Git scaffold; publication is a separate authorized skill workflow. A hub's content starts at `1.0.0`, independently of the hub CLI's `0.1.0` release. Its `agentscli-hub.yml` contains the content version and schema version, never the CLI version.

A consumer can configure **one optional hub**, pinned to an exact Git commit, and must list every consumed convention and skill explicitly. It versions the accepted selected source snapshot and lock with its own templates/configuration. Ordinary generation remains offline, using Node.js and the shipped build skill without an installed CLI or Git. Imported installed skills are replaceable outputs; accepted source corruption blocks generation. See the package guides for exact schemas, dependency rules, selection/update/detach workflows, and Windows/POSIX file representation and execute intent.

## Independent skill sources

```text
.agents/skills/
  agentscli-adm-write-conventions/
  agentscli-adm-edit-agents/
  agentscli-adm-publish-packages/
  openspec-*/
packages/
  agentscli/
    assets/templates/
      en/
      pt-br/
      skills/
        agentscli-write-conventions/
        agentscli-edit-agents/
        agentscli-build-agents/
        agentscli-manage-hub-imports/
  agentscli-hub/
    assets/templates/skills/
      agentscli-hub-write-conventions/
      agentscli-hub-edit-agents/
      agentscli-hub-write-shared-conventions/
      agentscli-hub-write-shared-skills/
      agentscli-hub-publish/
```

These twelve operational skills are independent and each has one responsibility. The three administrative skills stay internal; builds distribute exactly four consumer and five hub skills. OpenSpec is development-only. A source/distribution manifest is unnecessary: each package owns its fixed asset roots. No skill source or custom implementation is shared between environments.

Conventions are self-contained rules: no requires, no links to other conventions or skills. Consumer/shared convention templates have a nonempty `trigger` in leading YAML frontmatter and a canonical H1/filename. Only skills have optional id/source dependencies, through standard `metadata.requires: requires.yml` and one sibling YAML file. Skills mention other resources by identity instead of linking or hardcoding their locations. The nine distributed operational skills receive MIT, `compatibility: Requires Node.js >= 22.`, and the actual owning CLI name/version during assembly; imported authors' metadata is preserved.

## Development

```sh
npm ci
npm run setup
npm run check
npm run build
```

The root is private, with two workspaces and one lockfile. The root check runs both workspace gates plus administrative checks. Tests are lightweight units using injected filesystem/Git boundaries; pre-push and CI run the same unit/type/format gate. Builds and archive inspections are separate delivery operations, not integration or live-provider test suites. Build-only esbuild closes each distributed skill's JavaScript runtime dependencies so project execution needs no npm install. Runtime package resources are built from canonical package sources.

For a focused workspace operation, use npm's `--workspace @devel-solid/agentscli` or `--workspace @devel-solid/agentscli-hub` option. Create candidate archives with native `npm pack` into ignored storage and inspect them through agentscli-adm-publish-packages. The packages have independent versions and immutable `agentscli-v<version>` / `agentscli-hub-v<version>` tags. Authorized delivery uses native Git/npm and verifies exact remote identities and archive integrity. Never publish the private root.

This repository itself consumes neither CLI. Its handwritten English instructions are in [AGENTS.md](AGENTS.md); package templates are product data. Keep unrelated edits and authored inputs intact.
