# Design

## Context

See `proposal.md` for motivation and the agreed scope. Today the root package is `@devel-solid/agentscli@0.3.1`; `src/manifest.ts` accepts exactly `language`, `src/plan.ts` reads only local convention templates, and `scripts/package-assets.mjs` assembles three skill trees from `agentscli.yml`. `src/render.ts` already accepts explicit source/output paths, so imported conventions can join rendering without copying them into the local authoring subtree. Filesystem checks, whole-file writes, and generated-marker cleanup are reusable boundaries.

The existing specs deliberately prohibit runtime Git/network use for ordinary client operations. They also prescribe exactly three client skills and four canonical product skills. This change extends those explicit contracts instead of weakening offline generation. Current tests are isolated units with injected filesystem boundaries; the new Git boundary must follow the same policy.

## Goals / Non-Goals

**Goals:**

- Make the two packages independently usable while retaining a single development repository, lockfile, and general check gate.
- Separate project-owned sources, imported sources, generated documents, packaged product skills, and installed hub skills in both planning and diagnostics.
- Keep the 12 operational skills independent by environment and responsibility, with mechanically decidable validation in each owning skill's executable support code.
- Keep remote acquisition an explicit skill operation; all normal generation uses the committed snapshot.

**Non-Goals:**

- A hosted registry, vendor-specific login, remote repository creation, unattended publication without a request, or a new public validation/update/release command.
- Multiple hubs, branch tracking, automatic dependency installation, per-resource version solving, translations, local-directory hub sources, customization layers, or automatic content merging.
- Cross-environment operational skill reuse, a universal authoring/router skill, a recovery database, historical ownership tracking, or deployment to unrelated client repositories. Independently maintained identical bodies are intentional under the approved separation.

## Decisions

### 1. Two npm workspaces and private root orchestration

Move the current package into `packages/agentscli/` and add `packages/agentscli-hub/`. The root `package.json` becomes private, declares these workspaces, and orchestrates `check`, `build`, formatting, and hook setup. Keep one root lockfile, the existing Node lines, `.agents/skills/`, `docs/conventions/`, `openspec/`, CI, and `.githooks/` at the root. Add a common TypeScript base configuration. Package-local READMEs and license inclusion must work in actual archives, not depend on the checkout root.

Remove `agentscli.yml`; neither package has a replacement distribution list. Consumer assembly enumerates complete skill directories only under `packages/agentscli/assets/templates/skills/`; hub assembly uses only `packages/agentscli-hub/assets/templates/skills/`. Validate entrypoint names/descriptions, contained regular paths, portable destinations, and the expected four/five skill sets before writing assets. Root administrative skills and OpenSpec are never package inputs. Preserve `agentscli-hub.yml`, which versions hub content, and `.agentscli/config.yml`, which configures a consumer.

Identify the tool source repository without a dedicated marker: the private root declares the two approved workspaces, and their package metadata identifies `@devel-solid/agentscli`/`agentscli` and `@devel-solid/agentscli-hub`/`agentscli-hub` through package names and bins. The predicate must verify those identities, not reject arbitrary private workspace projects. Check root/ancestor metadata to reject client operations inside this monorepo, its package sources, and installed tool package directories. A legacy standalone tool package's name/bin also identifies a protected tool context. Absence of consumer configuration never grants administrative authorship. Skills validate their assigned environment before using their fixed editing targets; they do not switch jobs based on which manifest exists.

Keep exactly two published packages. Each operational skill owns its own `SKILL.md` and custom scripts/support source files. Do not share an entrypoint, base skill template, proxy, symlink, or custom script implementation between environments, even when bodies are initially identical. Build copies each independent source into only its own artifact; a change to one environment's skill must not rewrite another environment's skill. Ordinary Node/package dependencies and CLI commands remain usable, but cannot act as a cross-environment skill router. No third published package or runtime source checkout is introduced. Preserve dependency pins unless the implementation justifies a required build dependency.

#### 1.1. Approved source tree and responsibility map

```text
agentscli/
  .agents/skills/
    agentscli-adm-write-conventions/
    agentscli-adm-edit-agents/
    agentscli-adm-publish-packages/
  packages/
    agentscli/
      assets/templates/skills/
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

Each listed directory contains its independent `SKILL.md` and the support files/scripts it needs. Other existing development tools such as OpenSpec are outside this 12-skill operational set. Consumer `apply` installs only its four skill trees into that project's `.agents/skills/`; hub `apply` installs only its five. The monorepo activates only its three administrative skills from this set; the nine package-asset directories are product source data, not active administrative skills.

| Environment | Skill | Sole responsibility and target |
| --- | --- | --- |
| Monorepo | `agentscli-adm-write-conventions` | Maintain handwritten internal conventions discovered through root instructions, currently `docs/conventions/`. |
| Monorepo | `agentscli-adm-edit-agents` | Maintain the handwritten root `AGENTS.md`. |
| Monorepo | `agentscli-adm-publish-packages` | Release the two CLI npm packages through native Git/npm. |
| Consumer | `agentscli-write-conventions` | Maintain project-owned `.agentscli/templates/conventions/` sources only. |
| Consumer | `agentscli-edit-agents` | Maintain `.agentscli/templates/AGENTS.tpl.md` only. |
| Consumer | `agentscli-build-agents` | Validate and generate consumer instructions through its own deterministic offline scripts. |
| Consumer | `agentscli-manage-hub-imports` | Manage that consumer's explicit hub resource imports and accepted state. |
| Hub | `agentscli-hub-write-conventions` | Maintain the hub's handwritten internal conventions under `docs/conventions/` only. |
| Hub | `agentscli-hub-edit-agents` | Maintain the hub's handwritten root `AGENTS.md` only. |
| Hub | `agentscli-hub-write-shared-conventions` | Maintain distributable `conventions/**/*.tpl.md` resources only. |
| Hub | `agentscli-hub-write-shared-skills` | Maintain distributable `skills/<id>/` resource trees only. |
| Hub | `agentscli-hub-publish` | Select a content version and publish that hub through native Git. |

Internal convention authorship and shared convention authorship never share a skill. AGENTS editors edit the entrypoint only; detailed convention authorship routes to the appropriate separate skill rather than becoming a second job in the editor. Resource authoring never publishes implicitly. Preview, validation, and apply steps within one defined workflow do not grant a second authoring target or publication scope.

Alternative: two repositories would duplicate shared contracts and coordination. A third shared package would add release coupling before it is needed.

#### 1.2. Apply is the only public operation of each CLI

Expose only `agentscli apply` and `agentscli-hub apply <directory>`, with help/version and `--dry-run`. Consumer apply retains `--repo-root`, `--json`, `--lang`, and explicit `--migrate` in valid combinations. Reject `init` in both executables; do not keep an alias. Public consumer validate/sync, hidden forwarding, and generation-only apply flags remain absent. This is a breaking command/ownership change and must appear in release and upgrade guidance.

The consumer build skill owns the actual validation, renderer, common planner, application, and result code under its own `scripts/` tree. Its private Node entrypoint is `.agents/skills/agentscli-build-agents/scripts/build-agents.mjs`, with `validate` and `sync` modes; `sync --dry-run` previews and `sync --check` checks freshness. Both modes accept `--repo-root` and `--json`; malformed, repeated, misplaced, or incompatible options fail without writes. These are skill implementation modes, not public agentscli commands. The skill runs validation, preview, authorized synchronization, and freshness verification; CI can invoke the same script directly.

Example calls after initialization (the skill executes these as required by the request):

```text
node .agents/skills/agentscli-build-agents/scripts/build-agents.mjs validate
node .agents/skills/agentscli-build-agents/scripts/build-agents.mjs sync --dry-run
node .agents/skills/agentscli-build-agents/scripts/build-agents.mjs sync
node .agents/skills/agentscli-build-agents/scripts/build-agents.mjs sync --check
```

After bootstrap, these scripts run with supported Node and versioned project files alone: no installed/global agentscli executable, source checkout, package installation, runtime network, or Git is required. Ship every runtime dependency inside the build skill, with no unshipped imports. Consumer apply reuses this engine from installed package assets for preflight, full document/imported-skill regeneration on every application, and explicit migration; it never executes the project's possibly edited script copy. Maintain one generation implementation in the build skill.

Consumer apply refreshes all four packaged operational skill trees, support files, obsolete managed files, and the bounded retired-editor tree from installed package assets. It also recomputes generated documents and installed imported skills from preserved local templates/accepted snapshot. Manual edits or extras inside managed trees are discarded, not merged or promoted into authorship. Invalid authored inputs, accepted-state integrity, unsafe paths, or unmanaged collisions block the whole plan before writes. Apply preview reports replacements and removals. "Current version" means the installed CLI assets and accepted pinned hub content, never an implicit package or remote update.

Build-skill scripts implement document/imported-skill generation; running them directly does not refresh packaged operational skills, which require installed CLI assets through apply. Missing unrelated packaged skills do not block a present build script. Do not add a self-repair cache, recursive skill baseline, new configuration key, or recovery store. Effective/resumed `apply --migrate` remains offline and installs four skills; private scripts reject legacy configuration and direct that explicit workflow.

The existing completed-migration contract remains: `apply --migrate` with no legacy manifest and an already valid new client is a no-op, including with `--lang`. Ordinary `apply` owns later packaged-skill refreshes; retrying a completed migration does not become an upgrade command.

Keep the existing result envelope (`schemaVersion: 1`, `command`, `ok`, `changes`, `diagnostics`) for public apply and private script modes. The command is `apply`, `validate`, or `sync` according to the actual operation, without making script modes public CLI commands. Exit 0 means success, 1 valid freshness drift, 2 usage/validation/conflict, and 3 operational failure with completed/pending effects. Preview/check write nothing; check drift excludes packaged operational skill repair, which belongs to apply preview/application.

#### 1.3. Replace managed resources and preserve authored content and state

The same replacement rule applies to both CLIs: compute desired managed files from authoritative installed assets/local sources, replace differing regular files, and delete obsolete files within managed scopes. Equal state is a no-op. Do not three-way merge, preserve managed edits, or copy authored content out and recursively delete the project as an update strategy. Leave protected paths in place. Preflight every planned effect and reject aliases/special files before writes; failure reports completed/pending effects and retry recomputes the same desired state. No backup requirement, journal, or ownership-history database is added.

| Environment | Preserved authored content | Preserved project state | Replaceable managed resources |
| --- | --- | --- | --- |
| Consumer | Complete `.agentscli/templates/` tree; do not resurrect deliberately removed convention templates. | `.agentscli/config.yml` (language and hub fields unless explicitly changed), complete accepted `.agentscli/hub/` snapshot/lock, project Git metadata/policy. | Four packaged `.agents/skills/` trees, selected imported skill trees identified by accepted state, generated root `AGENTS.md`, and the generated `.agentscli/conventions/` subtree. |
| Hub repository | Handwritten `AGENTS.md`, complete `docs/conventions/`, `conventions/`, and `skills/` trees, including authored deletions. | Existing `agentscli-hub.yml` content version, `.git` metadata, repository Git policy such as `.gitattributes`/`.gitignore`, and existing refs/remotes/staging. | Five operational `.agents/skills/` trees and product scaffold files such as `README.md`; refresh/remove stale files only within declared product-owned scopes. |

The consumer project root and the hub repository root are not recursive deletion targets. Preserve unrelated paths and skills outside declared managed scopes. Package asset roots plus fixed product destinations/known retired names determine product ownership; do not infer ownership merely because a file is outside an authoring directory and do not introduce a replacement source manifest. At a generated root AGENTS destination an unmarked handwritten file remains an unmanaged collision; inside the exclusive generated conventions subtree all regular files are replaceable, including unmarked extras. Never delete authored templates to resolve an output collision.

The accepted hub snapshot is preserved state, not an editable authoring area or installed output. Changed snapshot bytes under their recorded representation, missing state, or configuration/lock disagreement still block ordinary apply/build: without an authoritative valid local source, overwriting from the network would violate offline/pinned generation. Reconcile that state through the explicit hub-import workflow. Installed hub skill edits/extras, by contrast, are always disposable once the accepted state proves the destination is managed. Explicit import/detach is allowed to change the corresponding state; ordinary CLI apply is not.

#### 1.4. Nine distributed skills identify their generator and minimum runtime

The four consumer and five hub operational skills retain standard name/description frontmatter and add `license: MIT`, exactly `compatibility: Requires Node.js >= 22.`, and string-valued `metadata.generatedBy` and `metadata.generatorVersion`. Each package's deterministic asset assembly stamps the derived SKILL.md files using its own package.json name/version, without editing maintained source files or manually versioning individual skills. This is a controlled frontmatter transformation of each independent source, not a shared skill body or a new distribution manifest. Do not add timestamps or machine-dependent data.

| Distributed set | metadata.generatedBy | metadata.generatorVersion |
| --- | --- | --- |
| Four consumer operational skills | `@devel-solid/agentscli` | That consumer package's real version in the prepared/installed artifact. |
| Five hub operational skills | `@devel-solid/agentscli-hub` | That hub CLI package's real version in the prepared/installed artifact. |

For example, the initial hub CLI at package version `0.1.0` produces this frontmatter excerpt:

```yaml
license: MIT
compatibility: Requires Node.js >= 22.
metadata:
  generatedBy: "@devel-solid/agentscli-hub"
  generatorVersion: "0.1.0"
```

The content version of the target hub, even `1.4.0`, never supplies generatorVersion. Neither do the private root version, the other CLI's version, a tag lookup, a manually chosen constant, or an independent skill version. Prepare new release candidates after workspace version selection so their assembled metadata matches the actual package version. Public apply copies the prepared frontmatter from installed assets on creation and replacement; repeated application of the same artifact is deterministic. Private generation does not restamp installed operational skills or require the generator package to remain installed.

These fields are traceability, not ownership authority, context routing, dependency selection, or automatic update instructions. Existing fixed managed scopes and accepted state still govern replacement/removal. The three handwritten administrative skills are not generated installations and receive no CLI-generated provenance requirement. Skills imported from a hub retain their authored frontmatter and accepted representations; never inject the consuming CLI's metadata, change their license/compatibility, or require these product-only fields on shared resources. Their source provenance remains in the accepted lock.

The compatibility literal states the requested Node minimum; keep existing package engines/CI runtime lines unchanged. Required native Git remains documented and checked by the workflows that use it without changing that exact compatibility string. Deterministic checks verify the nine mandatory declarations, string types, correct owning package identity, actual package version, and absence of unresolved placeholders; preserve other valid frontmatter fields. Build/pack inspection rejects a stale or cross-package stamp before delivery.

### 2. A hub is an independent authoring project

The hub executable exposes only `apply <directory>` with help/version and `--dry-run`. On first application to a new/empty target it creates a standalone Git repository and scaffold. On an identified existing hub it replaces all five operational skill trees and current managed scaffold files, removes obsolete managed files, and preserves the authored/state areas in section 1.3. It never creates a hosted remote, commit, tag, or push. Preflight roles, paths, and Git availability when initialization is required; repeated apply does not reinitialize or alter Git metadata.

The scaffold contains:

```text
hub/
  agentscli-hub.yml
  AGENTS.md
  README.md
  docs/conventions/
  .agents/skills/
    agentscli-hub-write-conventions/
      SKILL.md
      scripts/
    agentscli-hub-edit-agents/
      SKILL.md
      scripts/
    agentscli-hub-write-shared-conventions/
      SKILL.md
      scripts/
    agentscli-hub-write-shared-skills/
      SKILL.md
      scripts/
    agentscli-hub-publish/
      SKILL.md
      scripts/
  conventions/
  skills/
```

`agentscli-hub.yml` contains exactly the format identifier and the hub repository's own content version, without listing resources:

```yaml
schemaVersion: 1
version: 1.0.0
```

`version` is the hub/content semantic version, never the generating CLI version. A newly created hub starts at `1.0.0`; content releases use `v<version>` tags in that hub's Git repository. The CLI remains independently versioned in its npm package metadata, initially `0.1.0`. `schemaVersion` identifies the manifest format, not a tool or content release. Repeated apply preserves the hub's existing content version. Creating a scaffold does not publish its initial tag; the installed release skill carries out requested publication through native Git.

Instructions and internal conventions are handwritten scaffold content. Empty sharing directories can use ignored-by-discovery placeholder files. A hub has no client `.agentscli/config.yml` or generated root instructions. Client workflows reject hub roots/descendants just as they reject the product source context; the hub-specific skills provide the correct authoring workflow.

Hub internal skills teach authoring, portability, layout, dependencies, verification, and content release. Each includes the scripts it requires. A hub can be maintained and released after scaffolding without the hub CLI or this source checkout. A maintainer requests publication in natural language; the agent handles versioning and native Git delivery through the release skill.

Alternative: public create/add/validate/publish commands would duplicate the agent workflows and expand the interface the user explicitly wants to keep small.

#### 2.1. An included skill owns hub content releases

Ship `agentscli-hub-publish` under the hub's own `.agents/skills/`, with its deterministic validation and release helpers fully included. It operates only in the identified hub context and releases that repository's content; it does not publish npm packages or invoke `agentscli-adm-publish-packages`. Its ordinary entrypoint is a request such as "Publish the hub changes", not a user-supplied version or a new public CLI command.

The agent reviews the actual diff from the latest published content release, classifies the impact, and explains the selected bump briefly. Use patch for compatible corrections/internal maintenance, minor for compatible additions, and major for incompatible rules/procedures, removal/rename of resource IDs, or newly required resource dependencies. Select the highest applicable impact. Semantic assessment belongs to the agent; scripts deterministically calculate/check the candidate from the assessed bump, current manifest, and actual local/remote refs. The user does not choose the version in the ordinary workflow. An explicit version in the request is an override to validate, not a required input.

With no published content release, use `1.0.0` for the first release, matching the scaffold manifest. Later releases derive from the latest valid published content version on the current release line and must exceed occupied identities; do not blindly increment an already prepared manifest on retries. If nothing relevant changed after an already verified release, report that version without creating another one. Before preparation, verify the configured upstream/release branch and native remote state. A missing or ambiguous destination needs that concrete destination, not a version decision; a divergent release line is diagnosed rather than overwritten. Hosted repository creation remains outside this workflow.

For an authorized publication request, the skill preflights the intended scope, native authentication/destination, candidate identity availability, all hub formats/dependencies/asset descriptors, and local/remote ref consistency. It updates only the hub content version and requested release content, runs deterministic validators, creates a scoped commit and immutable `v<version>` tag, pushes the intended branch/tag, and verifies the remote tag's commit and its manifest version. Preserve unrelated edits/staging; never stage unrelated files or use force-push/tag replacement. The request already authorizes publication within this scope, so successful checks do not create an additional routine approval step.

Preview/review-only requests report the assessed bump, exact candidate, diff, and remote effects without changing project files, index, commits, or refs. After a failed/ambiguous delivery, inspect local and remote state before retrying; resume or verify the same prepared version/commit/tag rather than allocating a new version. Matching completed delivery is success, conflicting identities block, and partial branch/tag pushes are reported as partial until both intended refs are verified. Derive this from existing manifest, commits, tags, and remote refs without a release journal. All custom checks/helpers remain inside the skill and all test coverage uses injected Git/filesystem boundaries.

Alternative: leaving version selection, manifest edits, commits, and tags to the maintainer would leave the requested agent workflow incomplete. Deterministic scripts support the semantic decision and carry out the mechanical work instead of asking the user to operate the process manually.

### 3. Convention frontmatter and skill-local YAML dependencies

Convention IDs remain relative paths without .tpl.md; skill IDs remain direct-child directory names matching SKILL.md names. Compare IDs/destinations using the existing portable path key. The main AGENTS template, internal handwritten conventions, and a hub's .agents/skills operational trees are not shareable resources. Both consumer-owned and shared convention templates now have a leading YAML frontmatter block, followed by the existing single H1 and authored Markdown body.

#### 3.1. Convention trigger and self-contained rules

Consumer-owned/shared convention templates require a leading YAML frontmatter containing exactly one nonempty string trigger, followed by a single H1 and authored Markdown. They cannot declare requires or depend on another convention or skill. Reject unknown/duplicate frontmatter keys, aliases, malformed YAML, invalid trigger types, unsafe paths, and canonical filename mismatches. Empty dependency objects are not an alternative: a convention has no dependency declaration at all.

Example .agentscli/templates/conventions/code-review.tpl.md:

```markdown
---
trigger: Read before reviewing code changes.
---

# Code review

- Check changed behavior and its affected consumers.
- Report confirmed bugs and regressions with evidence and impact.
- State which checks actually ran.
```

Conventions must contain the rules needed to understand/apply their topic rather than redirect readers to other conventions. No convention may link to another convention or a skill, whether local, shared, handwritten, source template, or generated output. Apply this to the four convention-maintenance skills: agentscli-adm-write-conventions, agentscli-write-conventions, agentscli-hub-write-conventions, and agentscli-hub-write-shared-conventions. Each owns its own deterministic validator and runs it during authoring/review; no cross-environment skill implementation is shared.

Mechanically resolve supported Markdown inline/reference links, images, and HTML links against discovered convention and skill target maps and the correct rendering base. Skill targets include entrypoints, directories, and support files in local/shared, maintained-source, accepted-snapshot, and installed trees; a link into a skill support file is not an ordinary project-file exception. Reject targets identifying a different convention or any skill, including normalized/encoded paths, relative traversal, fragments/queries, and links across local/hub origins. Report source location and target before writes or publication. Literal examples do not declare active links. Same-convention fragment navigation and links to ordinary project files outside convention and skill trees are allowed. Unresolvable/ambiguous supported internal references must be diagnosed rather than silently counted as safe. Do not fetch external pages to validate links. Semantic review also rejects convention prose that directs the reader to invoke/consult a skill or embeds that skill's procedure. Such content belongs in the responsible skill, whose standard description already supplies its activation trigger. A convention-maintenance skill identifies and routes the misplaced procedure to the appropriate separately authorized skill-authoring workflow; it does not gain permission to edit skill bodies or duplicate the workflow inside the convention. Preserve necessary instructions during that scoped refactor. This semantic review complements, not replaces, deterministic link rejection.

Use trigger text in the generated root AGENTS index, retaining its existing root-output link base. The no-convention-or-skill-link check covers trigger text as well as the convention body. Strip the entire frontmatter from generated convention bodies, keeping H1, authored body, examples, and generated notices. The main AGENTS template keeps its insertion-marker contract. AGENTS entrypoints retain their convention-discovery links. Skills may mention declared conventions by identity, not direct links; identity declarations are distinct from hyperlinks originating in either resource. Handwritten monorepo/hub-internal conventions stay direct files without a newly mandatory trigger, but obey the same self-containment/no-convention-or-skill-link rule.

#### 3.2. Skill frontmatter points to one dependency file

SKILL.md retains standard frontmatter. If dependencies are declared, metadata.requires is a string whose value is exactly requires.yml, beside that SKILL.md. The pointed file is native YAML with exactly conventions and skills arrays, each containing the same id/source reference objects. An omitted pointer means no declaration; explicit empty arrays are valid. Do not infer a declaration from an unreferenced file or create an extra file for each dependency. Reject a root SKILL.md requires field, object-valued metadata.requires, encoded JSON/YAML dependencies in that value, other filenames/paths, missing referenced files, duplicate keys, aliases, unsafe entries, and malformed reference lists. Validate without executing any referenced skill or support script.

Example consumer operational .agents/skills/agentscli-write-conventions/SKILL.md (0.3.1 illustrates a real consumer package version; asset assembly always reads the actual owning package version):

```markdown
---
name: agentscli-write-conventions
description: Create, review, and maintain project-owned convention templates.
license: MIT
compatibility: Requires Node.js >= 22.
metadata:
  generatedBy: "@devel-solid/agentscli"
  generatorVersion: "0.3.1"
  requires: requires.yml
---

# Write conventions

Read the consumer configuration and project instructions.
Check dependencies declared in [requires.yml](requires.yml).
Edit only project-owned convention templates, preserving scope and language.
Run the declared build skill's read-only checker and report actual results.
Authorship alone does not authorize generation or publication.
```

Its .agents/skills/agentscli-write-conventions/requires.yml:

```yaml
conventions: []
skills:
  - id: agentscli-build-agents
    source: local
```

The same dependency-file format is available to authored local skills and shared hub skills. The nine product provenance/license/runtime declarations remain product-only: do not inject them into authored/imported skills. Copy each declared requires.yml with its own complete skill tree, include it in accepted shared-file integrity, and retain its authored frontmatter/pointer unchanged during import. No dependency JSON is embedded in YAML strings and no multiline encoded dependency value is used. The agentscli:requires HTML-comment contract is replaced, not maintained as a second declaration surface.

#### 3.3. Resolve references by type and declared source

| Authoring environment | source: local | source: hub |
| --- | --- | --- |
| Consumer project | Convention IDs from .agentscli/templates/conventions; project-local skill entrypoints under .agents/skills excluding accepted hub-owned installations. Packaged consumer operational skills are local dependencies, not hub resources. | Exactly selected accepted convention/skill sources in .agentscli/hub at the configured commit. |
| Hub repository, internal operational workflows | Handwritten internal convention IDs discovered through its instructions, currently docs/conventions, and its project-local operational skills under .agents/skills. | Its own exported conventions/skills trees when referenced by an internal workflow. |
| Hub shared resource | Forbidden: a published resource must not require a particular consumer's local resource. | Another exported resource in that same hub/revision, before and after import. |
| Tool monorepo, administrative workflows | Handwritten internal conventions and administrative project-local skills discovered through root instructions. | Unavailable: this repository does not configure/consume a hub. |

References are typed by their enclosing conventions/skills list. Within that type, resolve only the stated source; never infer origin from matching bytes, use another origin as fallback, or search machine-global/personal skills. Only skills have dependency declarations; conventions are dependency-free leaves. A skill may depend on conventions and skills. Local skills may depend on local resources or selected hub resources. Shared skills must use source hub exclusively, including transitively through other skills, and all shared dependencies come from the same pinned revision. Plain prose references do not create required dependencies; conventions additionally cannot link to another convention or a skill. Keep the existing rejection of portable destination collisions even when source is explicit.

Consumer validation checks all active local convention formats/self-containment, dependency declarations in authored project-local skills, and selected shared sources. Packaged operational declarations are checked from canonical package assets during build/apply. A projected apply plan resolves their local skill references against the four/five desired installed operational trees, so first application need not find them already on disk. Damaged managed installed SKILL.md/requires.yml copies are outputs to replace, not authoritative dependency declarations; accepted shared sources and canonical packaged assets supply their desired forms. Private generation still does not repair or require unrelated missing packaged skills. Safe-path checks on affected filesystem entries remain mandatory.

Validate transitive references deterministically using visited typed/source IDs. Every hub dependency must already be explicitly selected; every local dependency must already be present in its applicable local inputs/desired package setup. Missing or wrong-source references fail with the declaring resource, type, id, and source before writes. Do not extend selection, install a local skill, fetch a hub, solve per-resource versions, or execute procedures to satisfy a reference. A shared resource never accepts a local same-ID substitute. Preflight local skill declarations against proposed accepted state during update/switch/detach, so removing a hub resource still required by a local skill fails before cleanup. No installation ordering is required merely to validate a complete declared set.

#### 3.4. Skill instructions use identity-based discovery, not cross-resource links

A SKILL.md and its owned support instructions cannot directly link to a convention or another skill, including entrypoints, directories, scripts, references, or dependency files. Apply the rule to administrative, consumer, hub-operational, and shared skills. They may mention another skill by name/id and declare required resources as id/source in requires.yml; they must not hardcode another resource's filesystem location in prose, a Markdown/HTML link, a command example, or a file URI as a substitute for discovery. Mentioning a skill does not install it, choose another source, or silently turn an optional mention into a dependency.

The agent discovers the actual project-local target through project instructions, available skill names/descriptions, the convention index, and accepted import provenance. Match the stated id/source and confirm the resource before consulting or invoking it; do not infer a path from the caller skill's directory depth or search unrelated personal/global locations. A request to use agentscli-build-agents refers to that identity: inspect its discovered entrypoint to learn its own script/checker invocation rather than copying a fixed sibling path into another skill. Own description remains the skill's activation trigger.

Links from a skill to its own requires.yml, scripts, references, assets, and same-skill anchors remain allowed. Fixed project input contracts and architecture/CI examples remain documented at their responsible source; these do not grant a skill permission to hardcode paths to other skills or conventions. Runtime resolvers may calculate actual paths internally from the project resource map/id/source without embedding cross-resource paths in skill instructions. Keep the same-environment build-engine reuse, standalone dependency closure, and wrong-source rejection contracts.

Deterministic checks resolve supported inline/reference/image/HTML link targets in each skill's entrypoint/support instructions, classify their logical owner using the convention/skill source-output map, and reject convention targets or a different skill's tree. Include installed, accepted-snapshot, source-asset, local, and shared forms, encoded paths, fragments, and queries; preserve own-support links. Check identifiable hardcoded cross-resource paths/URIs in instruction command examples too. Literal examples teaching invalid link syntax do not create active links, but executable workflow examples cannot bypass the rule by hiding a foreign skill path in code. Diagnose unsafe/ambiguous supported references rather than silently approving them.

Use canonical package/accepted sources for managed resources and authored sources for local unmanaged skills; edited managed installations remain replaceable outputs. Asset assembly and shared-skill authoring/import validation enforce the same rule before delivery/application. Do not fetch pages or execute skills to check links. Existing authored/shared skills with forbidden links must be updated by their scoped maintainer, not silently rewritten during apply/import. The consumer generation engine, source guards, authoring checks, and package checks must not claim that a valid requires declaration authorizes a forbidden direct link.

#### 3.5. Convert existing authored convention cards explicitly

Ordinary apply/private generation require the new convention format. Encountering operational AGENT-CARD markers in existing client sources produces explicit apply --migrate preview/application guidance without editing authored files. Extend the existing offline migration workflow to fixed-layout clients with legacy convention cards as well as supported legacy custom-root clients; no public command is added. Deterministically move each old card's discovery text into trigger, remove only its operational marker block, preserve authored Markdown/language and required link targets, then regenerate the expected index/documents. A fixed-layout client already fully converted remains a no-op under apply --migrate, including --lang, as before.

Preflight every source/collision before conversion. Reject contradictory old/new declarations, malformed cards/frontmatter, forbidden convention dependency declarations, or convention-to-convention or convention-to-skill links instead of guessing or mechanically merging topic rules. For legacy skill dependency comments, require an explicit source-aware conversion to metadata.requires/requires.yml, not silent origin inference. Do not convert code examples, rewrite accepted imported snapshots, or silently migrate during ordinary apply. New hubs use only the new formats from their first scaffold; authors update any old shared-source examples before publishing, and imports reject obsolete operational declarations. Retry explicit client conversion from already converted valid sources without journals or backup/reset of authored trees.

Alternative: root custom skill fields or dependency objects inside metadata would break the standard string-valued metadata contract; serializing dependency JSON/YAML into a scalar obscures the structure. One ordinary YAML file per declaring skill preserves readable lists and standard SKILL.md frontmatter. A global catalog duplicates discovery, while implicit dependency downloads violate explicit selection.

### 4. One optional desired hub configuration and one accepted snapshot

Extend `.agentscli/config.yml` with an optional `hub` object; without it, the existing language-only shape is unchanged:

```yaml
language: pt-br
hub:
  repository: git@example.org:team/conventions.git
  commit: <full-commit-object-id>
  conventions:
    - testing
  skills:
    - code-review
```

Require all four hub fields, unique valid IDs, and a full commit object ID. Empty resource lists are valid and import nothing. Unknown fields, aliases, duplicate keys, multiple hubs, globs, and custom output roots remain invalid. A tag is an input to a new explicit management plan and is resolved to an exact commit; branches are not tracking configuration. The plan reports that commit, and apply/retry receives the concrete commit rather than resolving the tag again. A new explicit plan requested by tag resolves it again, even if its name matches an earlier request. Neither configuration nor lock needs to retain the requested tag.

Keep selected source content in `.agentscli/hub/conventions/<id>.tpl.md` and `.agentscli/hub/skills/<id>/...`, alongside the hub manifest as `.agentscli/hub/agentscli-hub.yml`. `.agentscli/hub/lock.yml` stores only the current accepted schema version, remote, exact commit, hub content version as `hubVersion`, explicit lists, and file inventory including that manifest. Each file entry contains `representation` (`utf8-lf` or `bytes`), its representation's SHA-256 digest, and `gitMode` (`100644` or `100755`). Require `hubVersion` to match the manifest's `version`. Installed hub-skill content and executable state derive from this inventory and snapshot. This current-state record is not a journal or historical database.

#### 4.1. Canonical text integrity and exact opaque payloads

Determine representation once from the selected commit, not from consumer Git settings or a later working-tree edit. A source path marked `-text` through its committed `.gitattributes` (including the standard `binary` macro) is `bytes`. Otherwise, content is `utf8-lf` only when it is strictly valid UTF-8, contains no NUL, and every CR is immediately followed by LF; all other content is `bytes`. In particular, lone CR and sequences such as CR-CR-LF require exact-byte representation. Authors mark other textual-looking opaque data with `-text` when exact bytes are meaningful. Read only the selected commit's attributes through the injected Git boundary, with external attribute overrides excluded and no filters executed. This classification introduces no resource catalog or new manifest field.

For `utf8-lf`, validate the recorded representation's UTF-8/no-NUL/no-lone-CR constraints, then replace CRLF pairs with LF. The result has no CR, making normalization idempotent. Preserve a UTF-8 BOM, trailing spaces, final-newline presence, and all other bytes. Hash, compare, and materialize this representation consistently in import, offline validation, updates, and cleanup checks. For `bytes`, preserve exact bytes, including every lone CR or CR-CR-LF sequence; do not decode, normalize, or infer representation again from possibly edited content. A snapshot edit that violates its accepted representation blocks validation rather than reclassifying the source. Such a difference only in a managed installed copy is replaceable drift, not a source-integrity error. A malformed representation/digest/mode descriptor is invalid input.

The snapshot is written in canonical form when acquired. If a later clone converts only canonical text's LF to CRLF, its integrity still passes offline and no source rewrite is required. Installed skill text with CRLF but equal canonical content is repairable materialization drift: `sync --check` returns 1 and `sync` restores LF so an executable script's shebang stays usable on POSIX. Snapshot changes beyond that equivalence, including changed opaque bytes or BOMs, remain invalid accepted state. In managed installations all content differences and extras are replaceable drift; restore from the valid snapshot rather than merge or preserve those edits. Generated documents are also replaceable outputs.

Neither CLI nor skill changes consumer Git configuration, index, or `.gitattributes` to enforce this policy. Git filters or checkout transformations that change opaque payload bytes are real integrity failures, not accepted text equivalence. Document that exact-byte payloads must remain exact in project version control; the source `-text` declaration makes their intended representation explicit. Ordinary commands use only recorded representations and require no Git executable.

Alternative: raw hashes for every text file produce false conflicts after legitimate newline conversion; normalizing every file can corrupt opaque data. Editing global/client attribute policy would expand file effects and is unnecessary for supported text equivalence.

#### 4.2. Preserve executable intent independently of platform capabilities

Capture regular Git tree modes `100644` and `100755` during acquisition and retain them unchanged in the lock on every platform. Snapshot files are data; their on-disk permissions are not the authority for installation. Selected skill files materialize the recorded executable intent where the filesystem supports POSIX execute permissions, using ordinary regular-file permissions without copying ownership, ACLs, or privileged mode bits.

Expose executable-mode support through the injected filesystem boundary. On a POSIX-capable filesystem, a mode-only mismatch is repairable drift, reported as an `update` in the existing JSON/effect model; preview/check does not chmod, and offline sync restores the expected executable state. Missing files and LF-only materialization repairs follow the same drift path. Invalid source/state integrity, unsafe paths, or unmanaged collisions still block the complete plan before any repair. Permission-write failures report partial operational failure with the existing same-operation retry guidance.

On Windows or another filesystem without reliable POSIX executable modes, retain `gitMode` but neither infer executable intent from local modes nor attempt ACL emulation/chmod-based execute repair. An unsupported mode check alone creates no drift. After that project is cloned onto POSIX, offline sync can restore executable intent from the lock even if Windows Git recorded the installed file as non-executable. Git index changes and `git update-index --chmod` are not part of either workflow.

Alternative: discarding the mode breaks skills that invoke `./scripts/check.sh`; treating every mode mismatch as an edit conflict would prevent ordinary cross-platform repair. Requiring all third-party scripts to use an interpreter would narrow complete-skill sharing unnecessarily.

Configuration is desired state, while the lock and source inventory identify the last accepted state. Ordinary commands require them to agree and reject incomplete or tampered snapshots before writing. A changed selection/configuration directs the user to the management skill; it never causes an implicit fetch or source cleanup. The skill compares old accepted state and proposed state when planning updates and removals. A successful detach removes the hub field and managed snapshot after bounded cleanup. The entire `.agentscli/` tree, root AGENTS, and installed skills remain versioned with the project.

Resource text remains in its authored language. The client's `language` selects ordinary default templates and generated notices, not resource translation or variant selection.

Alternative: mixing imports into local templates obscures ownership. A machine cache would make a cloned project depend on a remote/cache for generation.

### 5. Native Git access lives inside a client skill

Add independent consumer-only `agentscli-manage-hub-imports`, distributed by the consumer package. Its self-contained scripts accept explicit requested repository/revision/selection and implement acquisition, local check, project-read-only remote planning, apply, and detach. These are skill implementation entrypoints, not public CLI commands. Required custom script code and runtime dependencies accompany this skill's own source; no global hub CLI, implicit installation, unshipped sibling import, or monorepo path is required.

Use an injected native Git adapter with argument arrays and no shell interpolation. Support ordinary network Git endpoints, including SSH/SCP-style and HTTPS, across public/private providers. Use existing Git authentication without storing or echoing secrets. Local directories/file remotes, arbitrary executable remote helpers, and vendor APIs are outside the initial source contract. Reject unsafe remote arguments and credential-bearing URLs rather than writing them to configuration. A repository's access checks remain Git's responsibility.

Fetch the requested commit or resolve the explicitly requested tag into temporary operation storage. Validate the hub manifest at that exact commit, including its content version; a requested `v<version>` release tag must agree with manifest `version` before import. Direct commit acquisition still records the content version from that commit's manifest. Inspect regular blob bytes, their Git modes, and the committed attributes needed for representation classification without executing repository hooks, downloaded scripts, submodules, or filters. A temporary index plus cached attribute inspection can serve Git versions without direct tree-based attribute inspection; never use the consumer index or machine-global attribute policy for classification. Reject selected symlinks, submodules, path aliases, hard-link aliases at destinations, and unsupported special files. Temporary Git objects/attribute data may include unselected paths, but only the hub manifest and selected resource files enter the project. Never run scripts supplied by the hub as part of import validation; importing a skill is distinct from later invoking it.

Preflight current ownership/integrity, proposed formats/dependencies, every target path/collision, and the complete offline document/skill effect plan before changing the project. Use the co-distributed consumer build skill's engine for candidate generation planning rather than duplicate it or invoke removed CLI commands; both skill trees/helpers ship together. Resolve the build dependency by its declared project-local identity/source; instructions must discover its actual entrypoint rather than hardcode a link/path into another skill. This same-environment orchestration does not share a skill across environments. A remote preview may use disposable fetch storage but writes nothing to the project; a local validation/check performs no writes anywhere and no remote access. Apply the reviewed intent only if its remote/commit and local preconditions still match. Git/network failures leave accepted project state untouched.

Alternative: remote behavior in `sync` would break offline generation and allow routine generation to select new content. Vendor SDKs create unnecessary hosting coupling.

### 6. Extend the local planner without granting override precedence

Feed local templates plus exactly the selected imported convention templates into the existing renderer. Both map relative IDs to `.agentscli/conventions/<id>.md`; portable collisions fail even when bytes match. Preserve the local `.agentscli/templates/AGENTS.tpl.md` as the only main source. Generated notices for imports identify their actual vendored source and direct maintainers to the hub workflow, not to editing the imported file.

Materialize hub skills under `.agents/skills/<id>/`. Reserve all 12 operational names and retired `agentscli-update-agents`; the latter exists only for bounded apply-side cleanup, never an alias. Reject reserved selections and unmanaged destination collisions before writes. Apply restores packaged trees from installed assets; the common build-skill engine restores accepted imported installations, including overwriting edits and removing extra files. Accepted snapshots are preserved validated state. Managed documents and installed skill trees are replaceable; an edited installation is not an authoring surface or a blocking source conflict.

The private `validate`, `sync --dry-run`, `sync --check`, and `sync` modes share the offline generation rules. Check returns 1 for managed document/imported-installation drift, including edits/extras, and 2 for invalid sources/state, unsafe paths, or unmanaged collisions. CLI apply adds packaged-resource replacement to this same engine plan. During explicit imports, old accepted state proves managed ownership; candidate sources/descriptors supply the replacement contents/modes. Never adopt an unrelated destination solely through matching bytes. Renamed/removed upstream IDs require explicit selection changes; no title/content identity guessing or implicit remote refresh occurs.

Deselection/detach removes managed snapshot resources, accepted-owned installed skill trees including edits/extras, and obsolete generated files inside the exclusive conventions output subtree. These managed edits never prevent authorized cleanup. Preserve authored templates, unrelated paths/skills, and packaged product skills; change accepted configuration/snapshot only within the explicit import lifecycle. Preflight the complete new hub before removing old resources.

Whole-file application is not a multi-file transaction. Publish accepted configuration/integrity only after candidate sources, managed content, and applicable executable modes are verified. Failure reports the candidate's exact commit and completed/pending effects, and instructs retrying the same intent with that commit. Reuse equivalent candidate content only where ownership is already established or inside the dedicated snapshot namespace; platform equivalence never authorizes adopting an unmanaged skill. Ambiguous newly occupied skill paths or a snapshot/lock mismatch require explicit reconciliation against the project's Git state; never guess ownership or claim automatic rollback. Temporary scratch is disposable, not persistent recovery metadata.

### 7. Mechanical validation is a monorepo rule

Add handwritten English `docs/conventions/mechanical-validation.md` and discover it from root AGENTS. It applies to both packages and every owned skill, including the existing agentscli-only release and authoring workflows. Document the boundary with small examples: names, frontmatter, YAML schemas, dependency origins, file inventories, and path safety are code checks; usefulness, contradictory prose, and appropriate project policy require semantic review.

Audit checks for all 12 skills and provide each skill's own deterministic support where needed. The consumer build skill executes its own validation/planning/application code; consumer authors can invoke its shipped read-only checker without implicitly generating. Use native Git/npm for the two separately owned publication workflows. Do not replace the build engine with wrappers around removed public commands. Keep custom skill sources independent across environments and report actual exit codes/diagnostics separately from semantic judgment.

Administrative authorship never becomes client or hub authorship; consumer authorship never edits imported resources or handwritten source instructions; hub-internal authorship never writes shareable resource trees. Context validation rejects a wrong environment instead of silently selecting another target. Update the repository's own instructions/conventions and OpenSpec project context during implementation to remove obsolete shared-skill and `agentscli.yml` guidance; current planning must not edit those final files.

### 8. Verification and independent release identities

Keep root `npm run check` as the general gate across both workspaces and their relevant skill scripts. Unit tests exercise pure parsers/planners and injected filesystem/Git boundaries: selection, dependencies, pin resolution, conflicts, offline behavior, stale removal, and partial failure. Include canonical LF/CRLF equivalence, normalization idempotence from import through offline validation, exact lone-CR/CR-CR-LF and BOM/opaque preservation, committed `-text` classification, Git executable modes, POSIX mode repair/failure, and Windows metadata retention followed by POSIX restoration. Do not introduce real Git/registry/network subprocess tests or installed-package suites. Run the skill format validator for substantial skill changes; it complements behavioral checks.

Build and inspect actual archives for both workspaces, including executable metadata, templates, complete skill-local dependency closures, README, MIT license, and exclusion of internal/OpenSpec/checkout data. The hub CLI package starts at `0.1.0`, executable `agentscli-hub`, tag `agentscli-hub-v0.1.0`, matching the consumer's original `0.1.0`/`agentscli-v0.1.0` pattern. These tags belong to the product monorepo; a created hub instead starts with manifest content version `1.0.0` and uses its own `v1.0.0` content tag when released. Neither version stream advances the other. Preserve existing agentscli versions/tags; choose a new available consumer version from the implemented impact (including removed public operations and changed apply behavior; this plan reserves no registry identity).

After hub implementation and readiness, use `agentscli-adm-publish-packages` to publish the hub CLI's first artifact and a new agentscli artifact, each with its own source/version/tag/tarball/integrity verification. Independent versions do not require lockstep releases. `agentscli-hub-publish` publishes user hub content only. Release tasks remain incomplete until actual authorized delivery and remote verification succeed. No delivery occurs while creating this proposal.

## Risks / Trade-offs

- [Copied policy can become stale] -> Pin exact commits, require explicit updates, and expose both selection and integrity in versioned project files.
- [Dependency metadata cannot prove semantic completeness] -> Mechanically validate declared dependencies and supported links; retain semantic review in authoring skills.
- [Independent skills can diverge even when initially similar] -> Review each against its own responsibility and test its own scripts; do not restore cross-environment coupling as a deduplication shortcut.
- [Users edit managed outputs instead of authored sources] -> Clearly identify protected versus replaceable paths; preview replacements/removals and restore managed edits without merging. Snapshot tampering remains invalid state and requires explicit reconciliation.
- [Remote preview requires temporary disk/network use] -> Distinguish project-read-only remote planning from fully write-free local checks; never fetch during ordinary client checks.
- [An interrupted multi-file update may need reconciliation] -> Report exact effects, retain no recovery database, and use versioned project state for explicit repair rather than destructive automatic adoption.
- [Provider access differs] -> Delegate transport/authentication to native Git and test adapters with injected results; do not claim live provider coverage from units.
- [Text-looking opaque files cannot be identified by intent alone] -> Honor committed `-text` declarations, record representation once, and keep opaque bytes exact; never reclassify edited data during checks.
- [Windows cannot reliably materialize POSIX execute permissions] -> Retain Git-mode metadata and repair on a capable filesystem; report metadata preservation without claiming native execution compatibility.

## Migration Plan

1. Move package-specific files into the consumer workspace while preserving executable identity and unit coverage. Establish the three administrative and nine package-asset skill sources at their approved paths, update instructions, and remove `agentscli.yml` plus its readers. Replace its source guard with package/workspace identity checks.
2. Add the convention and deterministic script model, then implement hub scaffolding/formats and the local snapshot/configuration contract. Language-only configuration remains valid; existing AGENT-CARD convention sources and legacy custom-root clients use explicit `apply --migrate` before the new renderer.
3. Package four consumer and five hub skills from their separate asset roots. Replace init with apply in both CLIs, without aliases. Define protected and managed scopes in guidance and code; consumer apply replaces managed documents/skills and removes the retired editor through bounded cleanup, while hub apply replaces managed scaffold/skills. Preserve authored/state areas in place and never delete/recreate either project. Hub authorship/publication retains its five separate responsibilities.
4. Move real offline validation/generation into the build skill's self-contained scripts and remove public validate/sync. Replace documented/CI invocations with the shipped Node entrypoint. Implement explicit remote import/update/removal using the same offline planner; update authoring guidance, package assembly, CI, and release instructions together. Document apply after package upgrade as sufficient to restore the complete managed setup; the private build workflow remains available for separately requested generation.
5. Complete unit/type/format gates, skill validation, both builds, and actual archive inspection. Publish the initial hub package and a new consumer version only after implementation readiness, using immutable independent version/tag identities.
6. Rollback of local project changes uses normal reviewed Git restoration; no automatic rollback is provided. An older consumer CLI remains usable for unchanged language-only clients, but cannot read the new hub configuration. A published defect requires a new package version, never moving an existing tag or replacing a published artifact.
