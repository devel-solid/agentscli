# agentscli

Keep team conventions in Markdown and give coding agents an `AGENTS.md` index that tells them when to read each one. agentscli installs skills to write, review, and organize those agreements and generate the index.

[npm package](https://www.npmjs.com/package/@devel-solid/agentscli) · Node.js 22, 24 or 26 · [MIT](https://github.com/devel-solid/agentscli/blob/main/LICENSE)

![Initialize the project, ask an agent to create a testing convention, then ask it to validate the conventions and generate an AGENTS.md index linking to that file.](https://raw.githubusercontent.com/devel-solid/agentscli/main/docs/assets/conventions-flow.svg)

## Create your first convention and index

You need **Node.js 22, 24, or 26**, [pnpm](https://pnpm.io/installation), and a coding agent that can use project skills under `.agents/skills/`.

**Already have an `AGENTS.md`?** Initialization preserves it. Before generating an index, [move handwritten rules into conventions and preserve the original document separately](https://github.com/devel-solid/agentscli/blob/main/docs/usage.md#adopting-an-existing-project).

### 1. Install the CLI

```sh
pnpm add --global @devel-solid/agentscli
```

Run the remaining commands from your project root.

### 2. Initialize the project

Preview setup, then install the skills:

```sh
agentscli init --dry-run
agentscli init
```

`init` creates `.agentscli/conventions/` when needed and installs three skills under `.agents/skills/`. It preserves existing conventions and `AGENTS.md`.

### 3. Create a convention

Ask your agent:

> Create a test-focus convention: one behavior per test.

The agent should create `.agentscli/conventions/test-focus.md`, for example:

```markdown
---
trigger: Read when defining test cases.
---

# Test focus

Test one behavior at a time. Give invalid-input rejection and successful
creation separate tests so either failure identifies the behavior that regressed.
Several assertions describing the same rejection can stay together.
```

The heading names the agreement; `trigger` tells the agent when to read it. The body holds the rules and decision examples.

### 4. Generate the index

Ask your agent:

> Generate AGENTS.md from our conventions.

The build skill validates the conventions and generates the root `AGENTS.md`. Open it and follow the **Test focus** link to the convention you created. The index carries the title and trigger; the rules stay in the convention file.

## Use the installed skills

| Skill                            | Use it to                                                    |
| -------------------------------- | ------------------------------------------------------------ |
| `agentscli-write-conventions`    | Create, review, or edit conventions                          |
| `agentscli-build-agents`         | Validate conventions, generate the index, or check freshness |
| `agentscli-optimize-conventions` | Audit responsibilities and propose a reviewed reorganization |

As the project changes, ask your agent:

> Update our testing convention from the current tests, then regenerate AGENTS.md.

For a check without edits:

> Check our conventions and AGENTS.md without changing files.

The installed build skill runs offline using Node.js and versioned project files. It needs no installed CLI, compiler, Git, or dependency installation.

## Commands

`init` prepares a project. After upgrading the CLI, `update` refreshes an existing project's skills from the CLI version you are running. Neither command validates conventions or generates the index; use the build skill for those tasks.

```sh
agentscli init
agentscli update --dry-run
agentscli update
agentscli --help
agentscli --version
```

Both `init` and `update` support:

| Option                    | Meaning                                               |
| ------------------------- | ----------------------------------------------------- |
| `--repo-root <directory>` | Choose the project; defaults to the current directory |
| `--dry-run`               | Preview changes without writing                       |
| `--json`                  | Return structured output                              |

## Project files and existing installations

- Edit your rules in `.agentscli/conventions/**/*.md`, then regenerate `AGENTS.md`. Added conventions get new entries; deleted conventions disappear from the next index.
- `init` and `update` replace the complete contents of the three managed skill directories, including local edits, and remove obsolete files there. Keep custom rules in conventions.
- Commit the conventions, generated index, and all three complete installed skills so the project carries its own resources.
- Other skills, unrelated files, and Git state are preserved. The build skill protects handwritten `AGENTS.md` files and indexes owned by another generator.

If setup is incomplete, repeat `init`. For a damaged existing installation, see [updating and recovering skills](https://github.com/devel-solid/agentscli/blob/main/docs/usage.md#update-the-installed-skills).

`agentscli-optimize-conventions` replaces `agentscli-refactor-conventions`. Both `init` and `update` install the new skill and preserve the old tree. After installation, manually remove `.agents/skills/agentscli-refactor-conventions/` if it came from agentscli and you no longer need it. There is no alias or automatic migration.

## Documentation and help

- [Usage guide](https://github.com/devel-solid/agentscli/blob/main/docs/usage.md): convention format, authoring examples, installation recovery, and offline scripts.
- [Refactor an existing collection](https://github.com/devel-solid/agentscli/blob/main/docs/usage.md#refactor-an-existing-collection): proposed reorganizations and review state.
- [Report an issue](https://github.com/devel-solid/agentscli/issues).
- [MIT License](https://github.com/devel-solid/agentscli/blob/main/LICENSE).

Releases below `1.0.0` are beta.
