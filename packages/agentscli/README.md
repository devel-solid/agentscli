# agentscli

Generate project instructions from project-owned templates and optionally selected resources from one Git hub. Requires Node.js 22, 24, or 26.

```sh
npx @devel-solid/agentscli apply --dry-run
npx @devel-solid/agentscli apply
npx @devel-solid/agentscli apply --lang pt-br
```

`apply` is the only public operation, with `--repo-root`, `--json`, `--dry-run`, `--lang en|pt-br`, and explicit `--migrate`. `--help` and `--version` work without loading a project. First setup defaults to English. Repeat apply after updating the CLI to replace its managed resources using that installed package's own engine.

Apply creates missing setup and immediately regenerates outputs. It preserves the complete authored template tree, stored language unless `--lang` is explicit, hub configuration/pin/accepted snapshot, Git metadata, unrelated files, and unrelated skills. It replaces managed edits and removes obsolete managed files; it never merges or resets the project. A handwritten root AGENTS.md is a collision: preserve its content in the main template before authorizing generation.

```text
project/
├── AGENTS.md                              generated
├── .agentscli/
│   ├── config.yml                         preserved state
│   ├── templates/                         authored; preserved
│   │   ├── AGENTS.tpl.md
│   │   └── conventions/**/*.tpl.md
│   ├── conventions/**/*.md                managed output
│   └── hub/                               accepted sources; optional
│       ├── agentscli-hub.yml
│       ├── lock.yml
│       ├── conventions/**/*.tpl.md
│       └── skills/<id>/**
└── .agents/skills/
    ├── agentscli-write-conventions/        managed operational skill
    ├── agentscli-edit-agents/              managed operational skill
    ├── agentscli-build-agents/             managed operational skill
    ├── agentscli-manage-hub-imports/       managed operational skill
    └── <selected-shared-skill>/            managed installation
```

Version the templates, config, accepted snapshot/lock, generated instructions, and complete operational skills. Never edit managed resources to customize their behavior.

## Authoring

The main template has one H1 and one full-line `<!-- agentscli:conventions -->` insertion marker. The renderer builds the convention index from each convention's trigger. A complete convention template is:

```markdown
---
trigger: Read before writing or changing tests.
---

# Testing

Keep each unit focused on one observable behavior. Use injected boundaries for filesystem operations.
```

Its name is `testing.tpl.md`, derived from its H1 in ASCII lowercase kebab case. Nested paths preserve their structure. Conventions are self-contained: no requires, no links to other conventions, and no links to skills or their support. Main orientation can link discovery resources. Generated convention frontmatter is stripped; trigger links use root AGENTS as their base, and body links use the generated convention location. Literal code examples stay literal.

Skills have their own standard description trigger and carry their operation's instructions in their own entrypoint or bundled support. They may mention other skill identities, but must discover their actual project location rather than link or hardcode another resource's path. Own support links are allowed; project files remain legitimate work inputs. Optional `metadata.agentscli: agentscli-skill.yml` points to one contained sibling general configuration file. Its initially supported section is `requires`, containing only skill dependencies. This complete shared-skill example assumes `inspect-tests` exists in the same hub:

`shared/skills/review-tests/SKILL.md`:

```markdown
---
name: review-tests
description: Review requested test changes for meaningful assertions and coverage. Use when reviewing tests.
license: MIT
compatibility: Requires Node.js >= 22.
metadata:
  agentscli: agentscli-skill.yml
---

# Review tests

Read the [skill configuration](agentscli-skill.yml). Discover the required
`inspect-tests` skill with source `hub` among the project's available skills.
Use its instructions to inspect the requested tests and relevant callers.

Check observable behavior, meaningful assertions, and requested scope. Report
confirmed findings and the checks actually performed. A review request does not
authorize edits, generation, imports, or publication.
```

`shared/skills/review-tests/agentscli-skill.yml`:

```yaml
requires:
  - id: inspect-tests
    source: hub
```

This is a complete authored shared skill; its source has no invented generator stamp. Assembly stamps only the nine distributed operational skills across the two CLI packages, using each owning package's actual name and version. Imported authored skills keep their own metadata.

Only skills have requirements, and every dependency is another skill identified by exactly `id` and `source: local|hub`. Local skills may require local or explicitly selected hub skills; shared skills may require only hub skills selected from their same revision. Missing or transitive dependencies block the operation without expanding selection or installing anything. A convention with the same ID cannot satisfy a skill dependency. Dependencies never define an invocation schedule or execute downloaded code.

When no additional information is needed, omit both the pointer and file. An explicitly referenced empty mapping or `requires: []` declares no dependencies; blank/null documents, unknown sections, pointer/file disagreement, and unsafe files fail validation. Future supported sections belong in this same file. Beta major-zero releases adopt this contract directly: `metadata.requires`, the former `requires.yml`, and conventions/skills dependency mappings are unsupported, with no compatibility reader or conversion. Accepted sources remain pinned and are never rewritten to make old input valid; managed operational copies are replaced normally by apply.

## Offline agent workflow

Ask the installed operational skills to author conventions, edit main orientation, build instructions, or manage hub imports. They remain independent. The build skill owns a self-contained Node engine. Discover its actual directory through project skills, then run its private entrypoint:

```sh
node <build-skill>/scripts/build-agents.mjs validate --repo-root <project> --json
node <build-skill>/scripts/build-agents.mjs sync --repo-root <project> --dry-run --json
node <build-skill>/scripts/build-agents.mjs sync --repo-root <project> --json
node <build-skill>/scripts/build-agents.mjs sync --repo-root <project> --check --json
```

These are skill scripts, not public CLI commands. They use Node and versioned project files with no installed CLI, compiler, Git, or network. Private sync replaces generated documents and accepted imported skills; package operational asset repair belongs to public apply. Missing unrelated operational skills do not block a present build engine.

Exit codes: 0 success, 1 freshness drift under private `sync --check`, 2 usage/validation/collision, 3 operational failure. JSON has `schemaVersion: 1`, `command`, `ok`, `changes`, and `diagnostics`; changes distinguish pending and completed effects. After partial failure fix its cause and repeat the same authorized operation. No rollback or history database is maintained.

## One optional Git hub

Without a hub, configuration contains only `language: en`. The import skill manages an explicitly requested acquisition, update, selection change, switch, or detach. Native Git supports provider-independent public/private SSH/SCP, HTTPS/HTTP, and Git endpoints with existing authentication. There is no hosted registry or custom login. The tool never stores credentials or executes downloaded hooks, scripts, filters, or submodules.

Remote acquisition reads only `shared/conventions/**/*.tpl.md` and `shared/skills/<id>/`. For example, `shared/conventions/testing/unit.tpl.md` has ID `testing/unit`, and `shared/skills/review-tests/` has ID `review-tests`. Internal `.agents/skills/` trees are not shared resources. Beta layout changes are adopted directly, without alternate-root lookup or layout conversion.

The local snapshot keeps `.agentscli/hub/conventions/` and `.agentscli/hub/skills/`, without `shared/`. Valid accepted snapshots, their source hashes, and pinned commits remain unchanged by a CLI upgrade. Committed attributes are evaluated at the physical Git paths before mapping into this namespace.

Accepted configuration looks like:

```yaml
language: en
hub:
  repository: git@example.org:team/conventions.git
  commit: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
  conventions:
    - testing
  skills:
    - review-tests
    - inspect-tests
```

Selections are explicit; empty arrays mean nothing selected. Every resource uses the same exact full commit. A requested tag is resolved during explicit remote planning and pinned; ordinary commands never follow a moved tag or access a remote. Hub `agentscli-hub.yml` has `schemaVersion: 1` and the hub content `version`, such as `1.0.0`, independent of its authoring CLI version.

The accepted lock retains endpoint, commit, content version, selections, and per-file representation, SHA-256, and regular Git mode. Valid UTF-8 without NUL/lone CR uses `utf8-lf` unless committed `-text` forces `bytes`; all other bytes stay exact. LF/CRLF-only accepted text differences pass without rewriting. BOM, whitespace, final newline, opaque bytes, and recorded modes remain authoritative. Snapshot edits or extras fail integrity; installed edits, missing files, extras, LF drift, and execute-mode drift are replaced from valid accepted sources. POSIX restores `100644`/`100755` executable intent; Windows retains mode metadata without ACL emulation or false execute-only drift. No operation changes the Git index.

New imports cannot adopt unrelated skill paths, even if bytes match. Local and shared convention output collisions block rather than override. Deselect/switch/detach verifies still-required resources before cleanup; config and accepted lock publish only after generated effects are ready. Remote preview may use disposable fetch storage but changes no project files; local checks are fully offline and write-free. Publication of hub content and CLI packages is outside consumer imports.

## Upgrading old clients

`init`, public `validate`, and public `sync` were removed. Use `apply` for package refresh and the build skill for agent-only generation/checks. There is no `agentscli.yml` resource list.

```sh
agentscli apply --migrate --dry-run --json
agentscli apply --migrate --json
```

Migration explicitly transfers supported `agentscli-compose.yml` roots with link rebasing and final legacy cleanup, or converts fixed-layout AGENT-CARD discovery text into trigger frontmatter. It preserves authored meaning/language and accepted hub state. Ordinary operations never convert protected sources implicitly. Contradictory metadata, requires, and links to conventions/skills block conversion: perform separately authorized semantic authoring cleanup rather than automatically merging or deleting rules. Completed current migration is a no-op, even with `--lang`; ordinary apply refreshes installed operational resources. Retry partial migration with the same `apply --migrate` options.

## Workspace development

From the monorepo root run `npm run check` for type/format/unit checks and `npm run build` for delivery assembly. Package-specific scripts and unit tests live in this workspace. Sources and generated assets are distinct; deterministic assembly stamps the four operational skills with MIT, `compatibility: Requires Node.js >= 22.`, and the actual generating package name/version. Imported authored skills are never restamped.
