# agentscli

Generate a convention index and project conventions from project-owned convention templates. Requires Node.js 22, 24, or 26.

```sh
npx @devel-solid/agentscli apply --dry-run
npx @devel-solid/agentscli apply
```

`apply` is the only public operation, with `--repo-root`, `--json`, `--dry-run`, and explicit `--migrate`. `--help` and `--version` work without loading a project. Repeat apply after updating the CLI to replace its managed resources using that installed package's own engine.

Apply installs the two operational skills and immediately regenerates outputs. It distributes no starter conventions: without authored conventions, the index contains only its frontmatter and title. It preserves the complete authored template tree, Git metadata, unrelated files, and unrelated skills. It replaces managed edits and removes obsolete managed files; it never merges or resets the project. An existing root AGENTS.md must have valid frontmatter containing only `generatedBy: "@devel-solid/agentscli"`; handwritten instructions, other generators, and invalid metadata block all writes. Resolve such collisions explicitly before applying.

```text
project/
├── AGENTS.md                              generated
├── .agentscli/
│   ├── templates/                         authored; preserved
│   │   └── conventions/**/*.tpl.md
│   └── conventions/**/*.md                managed output
└── .agents/skills/
    ├── agentscli-write-conventions/        managed operational skill
    └── agentscli-build-agents/             managed operational skill
```

There is no client configuration file or language selection. An old `.agentscli/config.yml` is ignored and preserved as an unrelated file. Version authored templates, generated instructions, and complete operational skills. Never edit managed resources to customize their behavior.

## Authoring

AGENTS.md has no template. The renderer writes fixed frontmatter and title, then a convention index derived from titles and triggers, sorted by generated paths. For example:

```markdown
---
generatedBy: '@devel-solid/agentscli'
---

# AGENTS.md

- [Testing](.agentscli/conventions/testing.md): Read before writing or changing tests.
```

With no conventions, only the frontmatter and title remain. Use agentscli-write-conventions to create the first convention, then agentscli-build-agents to regenerate the index. Authoring follows the requested language or the existing content without persisting that choice; generation preserves authored titles, triggers, and bodies in any language. Multiline triggers become one line per item. The index contains no HTML comments or additional project prose. The `generatedBy` key and title are agentscli's contract, not requirements of the general AGENTS.md format. A complete convention template is:

```markdown
---
trigger: Read before writing or changing tests.
---

# Testing

Keep each unit focused on one observable behavior. Use injected boundaries for filesystem operations.
```

Its name is `testing.tpl.md`, derived from its H1: normalize with NFKD, remove combining marks, lowercase, and collapse runs other than Unicode letters or numbers to hyphens. Trim outer hyphens and normalize the result to NFC. ASCII titles keep the same filenames; `日本語` becomes `日本語.tpl.md`. Nested paths preserve their structure. Conventions are self-contained: no links to other conventions, skills, or their support. Generated convention frontmatter is stripped and the technical ownership marker is retained, without a generation notice; trigger links use root AGENTS as their base, and body links use the generated convention location. Literal code examples stay literal.

Skills have their own standard description trigger and carry their operation's instructions in their own entrypoint or bundled support. They may mention other skill identities, but must discover their actual project location rather than link or hardcode another resource's path. Own support links are allowed; project files remain legitimate work inputs. Standard string metadata is preserved. Assembly stamps only the two distributed operational skills using the package's actual name and version. Project-owned skills keep their own metadata.

## Offline agent workflow

Ask the installed operational skills to author conventions or build instructions. They remain independent. The build skill owns a self-contained Node engine. Discover its actual directory through project skills, then run its private entrypoint:

```sh
node <build-skill>/scripts/build-agents.mjs validate --repo-root <project> --json
node <build-skill>/scripts/build-agents.mjs sync --repo-root <project> --dry-run --json
node <build-skill>/scripts/build-agents.mjs sync --repo-root <project> --json
node <build-skill>/scripts/build-agents.mjs sync --repo-root <project> --check --json
```

These are skill scripts, not public CLI commands. They use Node and versioned project files with no installed CLI, compiler, Git, or network. Private sync replaces generated documents; package operational asset repair belongs to public apply. Missing unrelated operational skills do not block a present build engine.

Exit codes: 0 success, 1 freshness drift under private `sync --check`, 2 usage/validation/collision, 3 operational failure. JSON has `schemaVersion: 1`, `command`, `ok`, `changes`, and `diagnostics`; changes distinguish pending and completed effects. After partial failure fix its cause and repeat the same authorized operation. No rollback or history database is maintained.

## Upgrading old clients

`init`, public `validate`, and public `sync` were removed. Use `apply` for package refresh and the build skill for agent-only generation/checks. There is no `agentscli.yml` resource list.

```sh
agentscli apply --migrate --dry-run --json
agentscli apply --migrate --json
```

Migration explicitly transfers conventions from supported `agentscli-compose.yml` roots with link rebasing and final legacy cleanup, or converts fixed-layout AGENT-CARD discovery text into trigger frontmatter. Only the legacy template/output roots affect this operation; any old language field is ignored. Former root templates are preserved as authored files and do not participate in generation or migration. Existing AGENTS.md files still require the current ownership frontmatter; old comment markers do not authorize replacement. It preserves authored convention meaning and text. Ordinary operations never convert protected sources implicitly. Contradictory metadata and links to conventions/skills block conversion: perform separately authorized semantic authoring cleanup rather than automatically merging or deleting rules. Completed current migration is a no-op; ordinary apply refreshes installed operational resources. Retry partial migration with the same `apply --migrate` options. No configuration file or replacement marker records migration progress; verified sources, managed outputs, and skills establish the current state.

## Workspace development

From the monorepo root run `npm run check` for type/format/unit checks and `npm run build` for delivery assembly. Package-specific scripts and unit tests live in this workspace. Sources and generated assets are distinct; deterministic assembly stamps the two operational skills with MIT, `compatibility: Requires Node.js >= 22.`, and the actual generating package name/version. Project-owned skills retain their metadata.
