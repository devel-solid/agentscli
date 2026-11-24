# agentscli monorepo

This private npm workspace develops the MIT package [@devel-solid/agentscli](packages/agentscli/README.md). Its executable, `agentscli`, applies project instructions, local convention templates, and operational skills. It requires Node.js 22, 24, or 26, as declared in its package metadata.

## Use

```sh
npm install --global @devel-solid/agentscli
agentscli apply --repo-root ./my-project --dry-run
agentscli apply --repo-root ./my-project
```

`apply` is the only public CLI operation, alongside help/version. Repeat it after upgrading the package to replace managed resources. Managed edits are disposable, removed files stay removed from managed destinations, and authored content is preserved. Files are replaced individually without merging.

Agents perform generation and validation through the appropriate project skills and their deterministic scripts. Generation is offline, using Node.js and the shipped build skill without an installed CLI, Git, or npm installation. Project conventions and skills use local resources. See the package guide for schemas and managed paths.

Package versions with major zero are beta; production begins at `1.0.0`. Beta contracts change directly without transition periods, migration, backward compatibility, or protection for old clients.

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
      skills/
        agentscli-write-conventions/
        agentscli-build-agents/
```

These five operational skills are independent and each has one responsibility. The three administrative skills stay internal; builds distribute exactly two consumer skills. OpenSpec is development-only. A source/distribution manifest is unnecessary: the package owns its fixed asset roots. No skill source or custom implementation is shared between environments.

Conventions are self-contained rules with no links to other conventions or skills. Consumer convention templates have a nonempty `trigger` in leading YAML frontmatter and a canonical H1/filename. Client AGENTS.md is a mechanical convention index with the product's `generatedBy` frontmatter and fixed title; it has no template or additional project prose. Skills carry their own execution guidance and mention other skills by identity instead of linking or hardcoding their locations. Their own bundled support and project work inputs remain usable. The two distributed skills receive MIT and the package's actual name/version during assembly; maintained sources stay unchanged. Package engines declare the Node.js requirement.

Clients author their own conventions. First apply installs the two skills and generates an empty index when no conventions exist. There is no language option or client configuration file; authored titles, triggers, and bodies determine their own language.

## Development

```sh
npm ci
npm run setup
npm run check
npm run build
```

The root is private, with one workspace and one lockfile. The root check runs workspace and administrative checks. Tests are lightweight units using injected filesystem boundaries; pre-push and CI run the same unit/type/format gate. Builds and archive inspections are separate delivery operations. Build-only esbuild closes each distributed skill's JavaScript runtime dependencies so project execution needs no npm install. Runtime package resources are built from canonical package sources.

For a focused workspace operation, use npm's `--workspace @devel-solid/agentscli` option. Create candidate archives with native `npm pack` into ignored storage and inspect them through agentscli-adm-publish-packages. Releases have immutable `agentscli-v<version>` tags. Authorized delivery uses native Git/npm and verifies exact remote identities and archive integrity. Never publish the private root.

This repository itself does not consume the CLI. Its handwritten English instructions are in [AGENTS.md](AGENTS.md); package templates are product data. Keep unrelated edits and authored inputs intact.
