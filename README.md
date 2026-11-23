# agentscli

Generate a project's `AGENTS.md` and conventions from editable Markdown templates.
Package **@devel-solid/agentscli**, experimental version **0.3.1**, licensed under MIT.
Requires Node.js 22, 24, or 26. The executable is `agentscli`.

## Use

Install the CLI, then run it inside your project:

~~~sh
npm install --global @devel-solid/agentscli
agentscli init --dry-run
agentscli init
agentscli validate
agentscli sync --dry-run
agentscli sync
agentscli sync --check
~~~

Use `agentscli init --lang pt-br` for Brazilian Portuguese document templates and
generated notices. First initialization defaults to `en`; repeated init preserves
the stored preference. Explicit `--lang` changes the preference and selects defaults
for missing resources. Existing authored text stays literal, and existing output
notices change only after a requested `sync`. Skills, CLI help, and diagnostics stay English.

Client configuration `.agentscli/config.yml` contains exactly:

~~~yaml
language: pt-br
~~~

The paths are fixed: no configuration field or flag customizes the layout. Invalid
configuration blocks init, even with `--lang`; it is never silently replaced.
Init creates missing templates, skills, and initial
documents while preserving valid existing templates, regular skill files, and
generated documents. Repeated initialization does not recreate intentionally
removed convention sources. Retry interrupted ordinary init with the same options.

Version the **complete `.agentscli/` tree**, including configuration, authored
templates, and generated conventions, alongside root `AGENTS.md` and the distributed
skills. The CLI does not change Git state or ignore rules.

~~~text
.agentscli/
  config.yml
  templates/
    AGENTS.tpl.md
    conventions/
      contexto-do-projeto.tpl.md
  conventions/
    contexto-do-projeto.md
AGENTS.md
.agents/skills/
  agentscli-write-conventions/
  agentscli-update-agents/
  agentscli-build-agents/
~~~

## Edit templates, then synchronize

The starter context is `project-context` in English and `contexto-do-projeto` in Brazilian Portuguese.

~~~text
.agentscli/templates/AGENTS.tpl.md                     -> AGENTS.md
.agentscli/templates/conventions/project-context.tpl.md -> .agentscli/conventions/project-context.md
.agentscli/templates/conventions/testing/unit.tpl.md    -> .agentscli/conventions/testing/unit.md
~~~

Only convention `*.tpl.md` files below `.agentscli/templates/conventions/`
participate automatically. Their relative directories carry over to `.agentscli/conventions/`.
Unrelated templates beside the main source are ignored. An empty set is valid.

The main template needs one H1 and one full-line insertion comment outside examples.
Other headings, sections, and text are yours to customize:

~~~markdown
# AGENTS.md

## Working in this project

Read the project context convention before making changes. Follow the conventions relevant to the current task and keep changes within the requested scope.

<!-- Replace this comment with the project's purpose and essential repository orientation. -->

## Conventions

<!-- agentscli:conventions -->
~~~

Replace each fill-in comment itself with verified project content in its template;
keep the technical insertion and discovery markers. Upgrading the CLI does not replace
existing valid templates. To adopt new defaults, edit those templates deliberately,
then run `sync` when generation is requested.

Each convention template needs one H1 and one nonempty discovery card outside examples.
Name the file after the H1's plain text. Apply Unicode NFKD, remove combining marks,
lowercase ASCII letters, replace runs of non-ASCII-alphanumeric characters with a
single hyphen, trim outer hyphens, and append `.tpl.md`. The result before the suffix
must contain a letter or digit. For example, `# Aplicação web e componentes` uses
`aplicacao-web-e-componentes.tpl.md`, and the template below uses `testing.tpl.md`.

~~~markdown
# Testing

<!-- AGENT-CARD START -->
Read when changing tests.
<!-- AGENT-CARD END -->

Keep tests focused on observable behavior.
~~~

The card becomes part of the AGENTS index and is removed from the convention body.
Generated documents start with `<!-- agentscli:generated -->` and a source-edit notice.
`sync` replaces their entire content; put customizations in templates.
Author links for their generated location: convention body links resolve from
`.agentscli/conventions/<relative>.md`; main-template and card links resolve from
root `AGENTS.md`. The generated index uses root-relative convention links.

`validate` checks inputs, Markdown structure, paths, and destination conflicts.
`sync --dry-run` previews changes without writes. `sync --check` returns 1 for document
or managed-skill drift and 0 when current. Common options: `--repo-root <directory>`,
`--json`, `--help`; use `--version` by itself.

Unmarked documents occupying required output paths block all writes. Move useful
content into a template and resolve the destination before retrying. Other manual
documents remain untouched. Only stale Markdown below `.agentscli/conventions/`
whose exact first line is `<!-- agentscli:generated -->` is removed. Other roots
are untouched by ordinary sync. Unsafe paths and file aliases are rejected.

Inputs and destinations are checked before writing. Files are replaced individually.
A failure can leave some documents or skills updated; diagnostics report completed
and remaining changes. Repeat `sync` to finish. Concurrent writes are unsupported.

JSON results contain `schemaVersion`, `command`, `ok`, `changes`, and `diagnostics`.
Exit codes: 0 success, 1 check drift, 2 usage/validation/conflict, 3 operational failure.

## Upgrade convention filenames

Init, validate, sync, and migration reject mismatched filenames before writing.
For a fixed-layout client, rename each reported template to the expected filename
in its existing directory and update authored links to the new template and generated
paths. If the H1 has no usable filename, revise the heading first. Then run
`agentscli validate` and `agentscli sync --dry-run` before `agentscli sync`.
The sync removes stale generated convention files with the exact generated marker.

## Migrate an existing client

Only explicit migration reads `agentscli-compose.yml`. Ordinary init, validate,
and sync reject any remaining legacy manifest, including beside new configuration.
The supported legacy shape contains exactly these three fields (actual safe custom
roots are supported):

~~~yaml
language: pt-br
templates_dir: templates
conventions_dir: docs/conventions
~~~

Use the installed CLI; these operations need only Node, packaged resources, and
project files, with no network or implicit installation:

~~~sh
agentscli init --migrate --dry-run
agentscli init --migrate
agentscli validate
agentscli sync --dry-run
agentscli sync --check
~~~

Migration preserves the legacy language unless `--lang en|pt-br` is explicit. Use
the same options for preview, application, and retries. It transfers the legacy
main source and every other `*.tpl.md`, retaining their full relative paths under
the new convention-source subtree; a legacy `conventions/rule.tpl.md` keeps that
subdirectory. An empty convention set stays empty. Older composition schemas,
unsafe roots, or roots overlapping `.agentscli/` are rejected.
If migration reports a filename mismatch, rename the legacy template in its existing
directory and update affected links to the template and its generated path. Refresh
legacy generated documents with the previous compatible CLI before retrying the
migration preview, preserving authored content in the templates.

The preview includes source transfers, regenerated documents/notices, complete
replacement of the three managed skill trees (including removal of extra files),
configuration publication, and legacy cleanup. Other skills remain untouched.
Managed Markdown links/images are rebased to retain resolved targets, queries,
and fragments. External URLs and code examples stay literal. Ambiguous links or
affected unsupported HTML references require an author correction first.
Review incoming links in **unmanaged files** separately: migration does not scan
or edit arbitrary project prose, and unrelated resources are not moved.

Different occupied new targets, manual required outputs, or direct edits to expected
legacy generated outputs block all writes. Reconcile useful output edits into
their template and resolve reported conflicts before retrying. Identical planned
copies and missing old outputs allow retry.

Migration prepares and verifies new sources, documents, and managed skills before
publishing `.agentscli/config.yml` and starting legacy cleanup. It deletes only
transferred equivalent sources and marked Markdown under the declared old output
root, preserves unrelated/manual files and nonempty directories, removes only
empty legacy directories, and deletes `agentscli-compose.yml` last.

A failure reports completed/pending effects with exit 3. Repeat **`init --migrate`
with the same options**, including any language selection; do not use ordinary
sync while the old manifest remains. The new configuration and remaining old
manifest let retry verify and finish cleanup even after some sources were removed.
Intervening divergent edits block retry. There is no automatic rollback, backup,
or recovery database. The CLI performs no Git operation.

After completion, `init --migrate` validates the new client and returns no effects,
even with `--lang`; change its preference with ordinary `init --lang` instead.
With neither client configuration, migration fails; use ordinary init for a new
project. Version and review the complete new tree through your normal workflow.

## Skills

| Skill | This repository | Client project |
| --- | --- | --- |
| `agentscli-write-conventions` | Edit final conventions | Edit convention templates |
| `agentscli-update-agents` | Edit handwritten AGENTS | Edit the main template |
| `agentscli-build-agents` | — | Validate, preview, synchronize, check |
| `agentscli-release` | Native CLI versioning/publication | — |

All three client skills inspect context before acting:

| Context | Behavior |
| --- | --- |
| Only `agentscli.yml` | Direct handwritten English repository authorship; no client CLI operations |
| Only valid `.agentscli/config.yml` | Fixed client templates; use configured document language |
| Any `agentscli-compose.yml` | Explicit migration must finish before ordinary client work |
| Missing, invalid, or conflicting context | Diagnose before edits; do not implicitly initialize |
| `agentscli.yml` in an ancestor | Reject nested client interpretation |

The configuration stores only language. The internal `skills` list is solely a
distribution list. AGENTS stays concise; detailed or scoped rules belong in
conventions. The build skill uses the installed CLI only for the requested
operation, without implicit installation, upgrade, initialization, or migration.

Client skills are installed under `.agents/skills`. **Sync fully restores the three
distributed directories**, including support files and removal of extra files.
Direct skill edits are overwritten. Other skills remain untouched. Previews and checks
include skill changes. The CLI also works without loading skills.

## Develop and release

This repository keeps handwritten English AGENTS and conventions. It does not consume
itself: do not run client `init` or `sync` here. `agentscli.yml` only selects whole
skill directories for packaging and identifies direct authoring:

~~~yaml
skills:
  - .agents/skills/agentscli-write-conventions
  - .agents/skills/agentscli-update-agents
  - assets/templates/skills/agentscli-build-agents
~~~

Shared skills have one source under `.agents/skills`; the client-only build skill lives
under `assets/templates/skills`. Build copies listed trees into `dist/assets/skills`
and both document locales into `dist/assets/templates`. Internal release/OpenSpec skills
and the internal manifest are excluded from the package.

~~~sh
npm ci
npm run setup
npm run check
npm run build
npm pack --dry-run
npm pack --pack-destination .tmp
~~~

Run `npm run setup` after each clone to configure the native Git hook in
`.githooks/pre-push` using this checkout's local `core.hooksPath`. Repeating setup
is safe; a different existing hooks path is reported without replacing it.
The hook runs `npm run check` and blocks the push if that command fails.

`npm test` runs only lightweight unit tests with isolated data or mocked boundaries.
`check`, pre-push, and CI add type/format checks to that same unit gate. Build and
archive inspection are delivery checks. The package contains compiled runtime/client
resources, README, license, and metadata; installation performs no compilation or
resource download.

Use `agentscli-release` for native Git/npm versioning and publication. Review the source
commit, version/tag, archive contents, and integrity before delivery. Rename the existing
repository to `devel-solid/agentscli` preserving history. Commit, rename, tag, push, and
publish only within the corresponding authorization. Verify remote/registry identity
before retrying an ambiguous delivery; published tags and versions are immutable.
