# agentscli monorepo

This private npm workspace develops the MIT package [@devel-solid/agentscli](packages/agentscli/README.md). Its executable, `agentscli`, generates the project convention index and installs operational skills. It requires Node.js 22, 24, or 26, as declared in its package metadata.

## Use

```sh
npm install --global @devel-solid/agentscli
agentscli apply --repo-root ./my-project --dry-run
agentscli apply --repo-root ./my-project
```

`apply` is the only public CLI operation, alongside help/version. Repeat it after upgrading the package to replace managed resources. Managed edits are disposable; authored convention edits and deletions are preserved. Files are replaced individually without merging.

Agents perform generation and validation through the appropriate project skills and their deterministic scripts. Generation is offline, using Node.js and the shipped build skill without an installed CLI, Git, or npm installation. Project conventions and skills use local resources. See the package guide for schemas and managed paths.

Package versions with major zero are beta; production begins at `1.0.0`.

## Project resources

```text
.agents/skills/
  agentscli-write-conventions/        installed, generated
  agentscli-build-agents/             installed, generated
  agentscli-publish-packages/         repository-owned
.agentscli/conventions/              authored final conventions
AGENTS.md                           generated convention index
packages/
  agentscli/
    assets/templates/
      skills/
        agentscli-write-conventions/
        agentscli-build-agents/
```

This repository uses the same two operational skills and convention format as other projects. Builds assemble exactly two product skills from the canonical package templates, independently of installed root copies. The compiled checkout CLI installs those complete derived copies; version them without manual edits. The publication skill stays internal and is preserved by apply.

Conventions are self-contained rules with no links to other conventions or skills. Write final files directly in `.agentscli/conventions/**/*.md`, with a nonempty `trigger` in leading YAML frontmatter and a canonical H1/filename. Apply and private generation preserve convention bytes; only the index is generated from them. AGENTS.md is a mechanical convention index with the product's `generatedBy` frontmatter and fixed title. Skills carry their own execution guidance and mention other skills by identity instead of linking or hardcoding their locations. Their own bundled support and project work inputs remain usable. The two distributed skills receive MIT and the package's actual name/version during assembly; maintained sources stay unchanged. Package engines declare the Node.js requirement.

Use agentscli-write-conventions for convention authorship and agentscli-build-agents for index generation and read-only validation. Discover their entrypoints through project skills. Keep this repository's authored guidance in English. Other projects choose the language of their titles, triggers, and bodies. First apply installs the two skills and generates an empty index when no conventions exist.

## Development

```sh
npm ci
npm run setup
npm run check
npm run dogfood
```

The root is private, with one workspace and one lockfile. The versioned skills and conventions work from a fresh clone; rebuilding never depends on those installed copies. `npm run dogfood` builds the checkout and runs `node packages/agentscli/dist/cli.js apply --repo-root .`, refreshing the root index and two managed skill trees without a global or published CLI. Use it after changing product resources or package metadata. Apply preserves the local publication skill and other unmanaged files.

The root check runs type, format, and lightweight unit tests plus read-only resource and release checks. It validates conventions, index freshness, and installed resources against canonical package assets without requiring a prior build or running apply. Pre-push and CI use the same gate. Formatting covers authored sources and excludes installed generated trees and AGENTS.md. Builds, real local apply, and archive inspections remain separate delivery operations. Build-only esbuild closes each distributed skill's JavaScript runtime dependencies so installed project execution needs no npm install.

For a focused workspace operation, use npm's `--workspace @devel-solid/agentscli` option. Preserve unrelated edits and authored inputs. Report changed files, actual checks, and remaining work.

## Release preparation

Use agentscli-publish-packages for authorized release work:

1. Complete changes, choose an unused version, and update the package version and root lockfile.
2. Run `npm run dogfood` to build with that version and apply the local candidate, including its generator stamps.
3. Run `npm run check` and inspect the generated state.
4. Create a tarball with native `npm pack` in ignored storage and inspect that exact archive through the publication skill.
5. Only with specific authorization, commit, tag, push, and publish the inspected tarball; verify its remote identities and integrity.

Releases use immutable `agentscli-v<version>` tags. Changing candidate inputs requires rebuilding and reinspection. Never publish the private root.
