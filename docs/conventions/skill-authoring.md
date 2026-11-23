# Skill authoring

Read when creating, reviewing, or refactoring owned skills and their support files.

## Responsibility and content

- Use the available skill creation guidance. Each skill performs one coherent operation in one environment. Keep all twelve operational sources independent, even when their bodies match. Descriptions must state what activates the skill and what it changes. Wrong-environment requests must fail before writes.
- Preserve the request and its authorization. A skill cannot expand editing scope or require repeated approval when existing authorization suffices. Separate convention authorship, root instructions, generation, imports, shared skill authorship, hub publication, and npm publication.
- Include necessary inputs, decisions, procedures, non-obvious constraints, and completion criteria. Prefer short common-path guidance and directly linked own support with an explicit consultation condition. Avoid generic tutorials, duplicated catalogs, deep reference chains, and session history.
- Keep each skill's prose and examples in one language. Preserve exact technical literals. Before removing content, identify consumers and retain operational guarantees. Semantic review must distinguish declarative conventions from procedures that belong in a separately scoped skill.

## Format and dependencies

- Use standard leading YAML skill frontmatter with nonempty `name` matching its directory and a nonempty activation `description`. Metadata values are strings. The nine distributed operational skills declare MIT and exactly `compatibility: Requires Node.js >= 22.`. Asset assembly stamps `metadata.generatedBy` and `metadata.generatorVersion` from the owning package's actual name/version; maintained sources and imported skill frontmatter stay unchanged. Do not invent per-skill versions.
- Only skills declare resource dependencies. An optional `metadata.requires: requires.yml` points to one safe regular sibling file, containing exactly `conventions` and `skills` YAML arrays. Each entry has exactly string `id` and `source`, where source is `local` or `hub`. Empty arrays are valid; an absent pointer declares no dependencies. Do not embed JSON or encoded YAML strings, add root `requires`, use multiple files, or infer undeclared dependencies.
- Resolve dependencies by type, identity, and source within the current project. Local skills may depend on local or explicitly selected hub resources. Exported shared skills may depend only on resources from their own hub at the same accepted revision. Conventions are dependency leaves. Validate the full transitive selection without automatic installation, selection expansion, global fallback, or cross-hub resolution.

## Discovery and links

- Start with the identified project root, current instructions, configuration, and resource provenance. Recognize resources by purpose and identity, confirm their actual consumers, and reject material ambiguity. Moved authored resources remain discoverable through maintained instructions. Do not guess directory depth or search personal/global skills as a fallback.
- Skill instructions and support must not link directly to conventions or other skills, including entrypoints, directories, scripts, and dependency files. They may mention identities and declare id/source dependencies. The agent discovers the project's actual resource locations. Own sibling dependency/support links and self anchors are allowed; complete-directory movement must preserve them.
- Do not hide foreign resource paths in executable examples. A skill may use its own relative support paths and verified public product input contracts. It must discover another skill's entrypoint by identity instead of hardcoding a path. No machine-specific absolute paths or unshipped repository references may be required.
- Conventions are self-contained rules. They cannot depend on, link to, or route procedures through other conventions or skills. Consumer and exported hub convention templates require only a nonempty `trigger` in leading YAML frontmatter and one canonical H1; handwritten internal conventions do not acquire mandatory trigger frontmatter.

## Verification

Use deterministic scripts for schema, target, path, link, dependency, and metadata checks; retain semantic review for clarity, activation, self-containment, impact, and responsibility boundaries. A format validator alone does not establish usefulness or dependency closure. Check complete shipped support and representative valid/invalid cases, including moved sources, mixed local/hub identities, literal invalid examples, and edited disposable installations. Do not create tests that merely mirror document wording.
