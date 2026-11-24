# agentscli

Generate AGENTS.md as an index of project-owned Markdown conventions. Requires Node.js 22, 24, or 26.

```sh
npx @devel-solid/agentscli apply --dry-run
npx @devel-solid/agentscli apply
```

`apply` is the only public operation, with `--repo-root`, `--json`, and `--dry-run`. `--help` and `--version` work without loading a project. Repeat apply after updating the CLI to replace its managed resources using that installed package's own engine.

Apply installs the two operational skills and generates the root index. It distributes no starter conventions: without authored conventions, the index contains only its frontmatter and title. It reads and validates final conventions without writing, deleting, normalizing, or reformatting their bytes. Git metadata, unrelated files, and unrelated skills are preserved. Apply replaces managed skill edits and removes obsolete managed skill files; it never merges or resets the project. An existing root AGENTS.md must have valid frontmatter containing only `generatedBy: "@devel-solid/agentscli"`; handwritten instructions, other generators, and invalid metadata block all writes. Resolve such collisions explicitly before applying.

```text
project/
├── AGENTS.md                              generated
├── .agentscli/
│   └── conventions/**/*.md                authored; preserved byte for byte
└── .agents/skills/
    ├── agentscli-write-conventions/        managed operational skill
    └── agentscli-build-agents/             managed operational skill
```

There is no client configuration file or language selection. Files outside the managed paths remain unrelated inputs and are preserved. Version authored conventions, generated instructions, and complete operational skills. Customize conventions directly; refresh the index after editing or deleting one.

## Authoring

The renderer writes fixed frontmatter and title, then a convention index derived from titles and triggers, sorted by final convention paths. For example:

```markdown
---
generatedBy: '@devel-solid/agentscli'
---

# AGENTS.md

- [Testing](.agentscli/conventions/testing.md): Read before writing or changing tests.
```

With no conventions, only the frontmatter and title remain. Use agentscli-write-conventions to create or edit a final convention, then agentscli-build-agents to regenerate the index. Authoring follows the requested language or the existing content without persisting that choice. Multiline triggers become one line per index item. The index contains no HTML comments or additional project prose. The `generatedBy` key and title are agentscli's contract, not requirements of the general AGENTS.md format. A complete convention is:

```markdown
---
trigger: Read before writing or changing tests.
---

# Testing

Keep each unit focused on one observable behavior. Use injected boundaries for filesystem operations.
```

Write it as `.agentscli/conventions/testing.md`. Its basename is derived from its H1: normalize with NFKD, remove combining marks, lowercase, and collapse runs other than Unicode letters or numbers to hyphens. Trim outer hyphens and normalize the result to NFC. For example, `日本語` becomes `日本語.md`. Nested directories are allowed. The YAML frontmatter, H1, and body remain in this final authored file. Conventions are self-contained: no links to other conventions, skills, or their support. Trigger links use root AGENTS as their base, and body links use the final convention location. Literal code examples stay literal.

Skills have their own standard description trigger and carry their operation's instructions in their own entrypoint or bundled support. They may mention other skill identities, but must discover their actual project location rather than link or hardcode another resource's path. Own support links are allowed; project files remain legitimate work inputs. Standard string metadata is preserved. Assembly stamps only the two distributed operational skills using the package's actual name and version. Project-owned skills keep their own metadata.

## Offline agent workflow

Ask the installed operational skills to author conventions or build instructions. They remain independent. The build skill owns a self-contained Node engine. Discover its actual directory through project skills, then run its private entrypoint:

```sh
node <build-skill>/scripts/build-agents.mjs validate --repo-root <project> --json
node <build-skill>/scripts/build-agents.mjs sync --repo-root <project> --dry-run --json
node <build-skill>/scripts/build-agents.mjs sync --repo-root <project> --json
node <build-skill>/scripts/build-agents.mjs sync --repo-root <project> --check --json
```

These are skill scripts, not public CLI commands. They use Node and versioned project files with no installed CLI, compiler, Git, or network. Private sync updates only AGENTS.md; validation, previews, and freshness checks write nothing. Authored convention edits change the next index, and authored deletions remove entries without recreating files. Package operational asset repair belongs to public apply. Missing unrelated operational skills do not block a present build engine.

Exit codes: 0 success, 1 freshness drift under private `sync --check`, 2 usage/validation/collision, 3 operational failure. JSON has `schemaVersion: 1`, `command`, `ok`, `changes`, and `diagnostics`; changes distinguish pending and completed effects. After partial failure fix its cause and repeat the same authorized operation. No rollback or history database is maintained.

## Workspace development

From the monorepo root run `npm run check` for type/format/unit checks and `npm run build` for delivery assembly. Package-specific scripts and unit tests live in this workspace. Sources and generated assets are distinct; deterministic assembly stamps the two operational skills with MIT and the actual generating package name/version. Package engines declare the Node.js requirement. Project-owned skills retain their metadata.
