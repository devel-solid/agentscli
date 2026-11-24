# agentscli

Generate project instructions from project-owned templates. Requires Node.js 22, 24, or 26.

```sh
npx @devel-solid/agentscli apply --dry-run
npx @devel-solid/agentscli apply
npx @devel-solid/agentscli apply --lang pt-br
```

`apply` is the only public operation, with `--repo-root`, `--json`, `--dry-run`, `--lang en|pt-br`, and explicit `--migrate`. `--help` and `--version` work without loading a project. First setup defaults to English. Repeat apply after updating the CLI to replace its managed resources using that installed package's own engine.

Apply creates missing setup and immediately regenerates outputs. It preserves the complete authored template tree, stored language unless `--lang` is explicit, Git metadata, unrelated files, and unrelated skills. It replaces managed edits and removes obsolete managed files; it never merges or resets the project. A handwritten root AGENTS.md is a collision: preserve its content in the main template before authorizing generation.

```text
project/
├── AGENTS.md                              generated
├── .agentscli/
│   ├── config.yml                         preserved state
│   ├── templates/                         authored; preserved
│   │   ├── AGENTS.tpl.md
│   │   └── conventions/**/*.tpl.md
│   └── conventions/**/*.md                managed output
└── .agents/skills/
    ├── agentscli-write-conventions/        managed operational skill
    ├── agentscli-edit-agents/              managed operational skill
    └── agentscli-build-agents/             managed operational skill
```

Configuration contains only the language:

```yaml
language: en
```

Version the templates, config, generated instructions, and complete operational skills. Never edit managed resources to customize their behavior.

## Authoring

The main template has one H1 and one full-line `<!-- agentscli:conventions -->` insertion marker. The renderer builds the convention index from each convention's trigger. A complete convention template is:

```markdown
---
trigger: Read before writing or changing tests.
---

# Testing

Keep each unit focused on one observable behavior. Use injected boundaries for filesystem operations.
```

Its name is `testing.tpl.md`, derived from its H1 in ASCII lowercase kebab case. Nested paths preserve their structure. Conventions are self-contained: no links to other conventions, skills, or their support. Main orientation can link discovery resources. Generated convention frontmatter is stripped; trigger links use root AGENTS as their base, and body links use the generated convention location. Literal code examples stay literal.

Skills have their own standard description trigger and carry their operation's instructions in their own entrypoint or bundled support. They may mention other skill identities, but must discover their actual project location rather than link or hardcode another resource's path. Own support links are allowed; project files remain legitimate work inputs. Standard string metadata is preserved. Assembly stamps only the three distributed operational skills using the package's actual name and version. Project-owned skills keep their own metadata.

## Offline agent workflow

Ask the installed operational skills to author conventions, edit main orientation, or build instructions. They remain independent. The build skill owns a self-contained Node engine. Discover its actual directory through project skills, then run its private entrypoint:

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

Migration explicitly transfers supported `agentscli-compose.yml` roots with link rebasing and final legacy cleanup, or converts fixed-layout AGENT-CARD discovery text into trigger frontmatter. It preserves authored meaning and language. Ordinary operations never convert protected sources implicitly. Contradictory metadata and links to conventions/skills block conversion: perform separately authorized semantic authoring cleanup rather than automatically merging or deleting rules. Completed current migration is a no-op, even with `--lang`; ordinary apply refreshes installed operational resources. Retry partial migration with the same `apply --migrate` options.

## Workspace development

From the monorepo root run `npm run check` for type/format/unit checks and `npm run build` for delivery assembly. Package-specific scripts and unit tests live in this workspace. Sources and generated assets are distinct; deterministic assembly stamps the three operational skills with MIT, `compatibility: Requires Node.js >= 22.`, and the actual generating package name/version. Project-owned skills retain their metadata.
