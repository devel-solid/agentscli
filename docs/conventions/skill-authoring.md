# Skill authoring

Read when creating, reviewing, or refactoring owned skills and their support files.

## Responsibility and content

- Use the available skill creation guidance. Each skill performs one coherent operation in one environment. Keep all six operational sources independent, even when their bodies match. Descriptions must state what activates the skill and what it changes. Wrong-environment requests must fail before writes.
- Preserve the request and its authorization. A skill cannot expand editing scope or require repeated approval when existing authorization suffices. Separate convention authorship, root instructions, generation, and npm publication.
- Include necessary inputs, decisions, procedures, non-obvious constraints, and completion criteria. Prefer short common-path guidance and directly linked own support with an explicit consultation condition. Avoid generic tutorials, duplicated catalogs, deep reference chains, and session history.
- Keep each skill's prose and examples in one language. Preserve exact technical literals. Before removing content, identify consumers and retain operational guarantees. Semantic review must distinguish declarative conventions from procedures that belong in a separately scoped skill.

## Format and dependencies

- Use standard leading YAML skill frontmatter with nonempty `name` matching its directory and a nonempty activation `description`. Metadata values are strings. The three distributed operational skills declare MIT and exactly `compatibility: Requires Node.js >= 22.`. Asset assembly stamps `metadata.generatedBy` and `metadata.generatorVersion` from the package's actual name/version; maintained sources stay unchanged. Do not invent per-skill versions.
- Optional string `metadata.agentscli: agentscli-skill.yml` points to one safe regular sibling YAML mapping for purpose-specific configuration. Initially only optional `requires` is supported, as a list of skill references with exactly string `id` and `source: local`. An empty mapping or `requires: []` declares no dependencies. Without additional configuration, omit both pointer and file. Reject an unreferenced reserved file, blank/null documents, unknown/duplicate keys, encoded structures, aliases, and unsafe targets. Add future supported sections to this same document rather than introducing more configuration files.
- Only skills can be dependencies. Resolve each reference by identity in the current project's local skills; a same-name convention cannot satisfy it. Validate the full transitive graph with terminating cycle traversal, without automatic installation, global fallback, or inferred execution order.
- Adopt the current beta contract directly. Reject the old `metadata.requires` pointer, reserved root `requires.yml`, root skill `requires`, and obsolete dependency comments outside examples. Do not add compatibility readers, conversions, transition workflows, or old-client protection. Replace disposable managed outputs from desired sources.

## Discovery and links

- Start with the identified project root, current instructions, configuration, and resource provenance. Recognize resources by purpose and identity, confirm their actual consumers, and reject material ambiguity. Moved authored resources remain discoverable through maintained instructions. Do not guess directory depth or search personal/global skills as a fallback.
- Skill instructions and support must not link directly to conventions or other skills, including entrypoints, directories, scripts, and dependency files. They may mention identities and declare id/source dependencies. The agent discovers the project's actual resource locations. Own sibling dependency/support links and self anchors are allowed; complete-directory movement must preserve them.
- Do not hide foreign resource paths in executable examples. A skill may use its own relative support paths and verified public product input contracts. It must discover another skill's entrypoint by identity instead of hardcoding a path. No machine-specific absolute paths or unshipped repository references may be required.
- Keep all required guidance for a skill's own operation in its entrypoint or bundled support. Another declared skill can own a distinct operation; conventions cannot supply a missing procedure. Reading project instructions, configuration, templates, package metadata, source code, or the convention being edited as work inputs remains valid and does not make them instruction dependencies. Ordinary tools and libraries retain their existing prerequisites.
- Conventions are self-contained rules. They cannot depend on, link to, or route procedures through other conventions or skills. Consumer convention templates require only a nonempty `trigger` in leading YAML frontmatter and one canonical H1; handwritten internal conventions do not acquire mandatory trigger frontmatter.

## Verification

Use deterministic scripts for schema, target, path, link, dependency, and metadata checks; retain semantic review for clarity, activation, self-containment, impact, and responsibility boundaries. A format validator alone does not establish usefulness or dependency closure. Check complete shipped support and representative valid/invalid cases, including moved sources, local dependency identities, literal invalid examples, and edited disposable installations. Do not create tests that merely mirror document wording.
