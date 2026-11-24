# agentscli

**Project rules in Markdown. A generated index for coding agents.**

[npm package](https://www.npmjs.com/package/@devel-solid/agentscli) · Node.js 22, 24 or 26 · [MIT](packages/agentscli/LICENSE)

A growing `AGENTS.md` can mix testing rules, API guidelines, and deployment notes in one long document. With agentscli, keep each topic in its own Markdown file. Generate a short `AGENTS.md` with a link to each topic and a sentence explaining when to read it.

![A complete testing.md convention is the input. Running agentscli apply generates an AGENTS.md index whose Testing link points back to that file.](docs/assets/conventions-flow.svg)

In this example, **Testing** links to `.agentscli/conventions/testing.md`. **Read when changing tests.** tells an agent when to consult it. The full rules stay in the convention file.

## Create your first convention and index

The steps below produce the files shown above. You need **Node.js 22, 24, or 26** and npm.

If your project already has a handwritten `AGENTS.md`, read [adopting an existing project](#adopting-an-existing-project) first. agentscli protects that file and stops before writing.

### 1. Install the CLI

```sh
npm install --global @devel-solid/agentscli
```

Run the remaining commands from your project root.

### 2. Write the testing rules

Create the `.agentscli/conventions/` folder and save this as **`.agentscli/conventions/testing.md`**:

```markdown
---
trigger: Read when changing tests.
---

# Testing

- Test one behavior at a time.
```

The `trigger` says when to read the file. The `# Testing` heading supplies its title. Everything below the heading contains your project rules.

### 3. Preview, then generate

Preview the changes:

```sh
agentscli apply --dry-run
```

The preview lists planned changes without writing files. Apply them:

```sh
agentscli apply
```

This installs two project skills and writes **`AGENTS.md`** at the project root:

```markdown
---
generatedBy: '@devel-solid/agentscli'
---

# AGENTS.md

- [Testing](.agentscli/conventions/testing.md): Read when changing tests.
```

Open `AGENTS.md` and follow the **Testing** link. It should open the convention you created in step 2. The index carries the title and trigger; the rule itself remains in `testing.md`.

**Starting without conventions?** `apply` installs the skills and creates an index containing only its metadata and title. It does not write project rules for you.

## Update the rules as your project changes

Edit your conventions, then regenerate the index with `agentscli apply` or the build skill described below. Added conventions get new entries. Deleted conventions disappear from the next index.

For more topics, add files such as `api-errors.md` with the heading `# API errors`. Each convention needs only a nonempty YAML `trigger`, one H1, and its rules. Match the filename to the title, and keep the rules self-contained, without links to other conventions or skills. Subfolders and other content languages are supported.

The [authoring reference](packages/agentscli/README.md#authoring) covers the complete format and naming rules.

## Let an agent maintain the conventions

Setup installs two skills under `.agents/skills/`. Each skill gives an agent instructions and scripts for a specific task:

| Skill                         | Use it to                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------- |
| `agentscli-write-conventions` | Create, review, or edit convention files                                        |
| `agentscli-build-agents`      | Validate conventions, preview changes, regenerate the index, or check freshness |

For an update, ask your agent:

> Use agentscli-write-conventions to update our testing convention based on the current tests. Then use agentscli-build-agents to regenerate AGENTS.md.

For a check without edits:

> Use agentscli-build-agents to validate the conventions and check whether AGENTS.md is up to date. Do not change any files.

The installed build skill runs offline using Node.js and versioned project resources. It needs no installed CLI, compiler, Git, or dependency installation. Use it for index updates; use public `apply` for setup or to refresh the packaged skills after upgrading the CLI.

## Know which files to edit

| Resource                                     | What agentscli does                             | Where to make your changes                     |
| -------------------------------------------- | ----------------------------------------------- | ---------------------------------------------- |
| `.agentscli/conventions/**/*.md`             | Reads and validates; preserves authored bytes   | Edit your rules here                           |
| Root `AGENTS.md`                             | Generates the convention index                  | Update its source conventions, then regenerate |
| The two installed product skill directories  | Replaces their complete contents during `apply` | Keep custom rules in conventions               |
| Other skills, unrelated files, and Git state | Preserves them                                  | Continue managing them as usual                |

Applying again removes obsolete files inside the two managed skill directories and replaces local edits there. Commit your conventions, generated index, and both complete installed skills so the project carries its own resources.

### Adopting an existing project

An existing root `AGENTS.md` is replaceable only if its frontmatter contains exactly:

```yaml
generatedBy: '@devel-solid/agentscli'
```

Handwritten instructions, another generator's metadata, and invalid metadata block all writes. Move your existing rules into convention files and preserve the original document separately before applying the generated index.

Validation and collision checks run before writes. Application replaces files individually. If an operational failure interrupts it, inspect the reported completed and pending changes, fix the cause, and rerun the same command.

## Command reference

`apply` is the public operation, alongside help and version:

```sh
agentscli apply
agentscli apply --repo-root ./my-project --dry-run
agentscli apply --repo-root ./my-project --json
agentscli --help
agentscli --version
```

| Option                    | Meaning                                               |
| ------------------------- | ----------------------------------------------------- |
| `--repo-root <directory>` | Choose the project; defaults to the current directory |
| `--dry-run`               | Preview application without writing                   |
| `--json`                  | Return structured output                              |

See the [offline workflow reference](packages/agentscli/README.md#offline-agent-workflow) for the build skill's scripts, checks, and exit codes. Releases below `1.0.0` are beta.

## Contributing

From a clone of this repository:

```sh
npm ci
npm run setup
npm run check
```

`setup` configures the Git pre-push hook. `check` runs type, formatting, unit, and resource checks. Pre-push and CI use the same gate.

This repository uses the conventions and product skills it distributes. Edit distributed skills in `packages/agentscli/assets/templates/skills`. After changing the CLI, packaged resources, or package metadata, refresh the local installation:

```sh
npm run dogfood
npm run check
```

`dogfood` builds the checkout CLI and applies it to this repository. The publication skill stays local. The repository root is a private workspace; the public package is `@devel-solid/agentscli`.

## Links and license

- [Package reference](packages/agentscli/README.md)
- [npm package](https://www.npmjs.com/package/@devel-solid/agentscli)
- [Report an issue](https://github.com/devel-solid/agentscli/issues)
- [MIT License](packages/agentscli/LICENSE)
