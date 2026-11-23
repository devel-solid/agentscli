---
name: agentscli-write-conventions
description: Create, review, and maintain project conventions in handwritten files or client templates, selected by project context.
---

# Write conventions

## Select the source

Read project instructions and inspect the requested root and ancestors before editing:

| Context | Authoring target |
| --- | --- |
| Only `agentscli.yml` | Handwritten English conventions: locate them through root `AGENTS.md` discovery links and preserve their organization |
| Only valid `.agentscli/config.yml` | Independent `*.tpl.md` below `.agentscli/templates/conventions/`, using configured `language` |
| `agentscli-compose.yml`, even beside new configuration | Explain that explicit migration must finish first; edit no legacy sources |
| Missing, malformed, or conflicting context | Diagnose and ask for direction before editing; never infer direct mode from missing client configuration |

Configuration contains exactly `language: en` or `language: pt-br`; reject duplicate/unknown keys, YAML aliases, and layout overrides. An ancestor's `agentscli.yml` blocks client interpretation of its subtree. Its `skills` list selects distribution, not generation. Never initialize, migrate, validate, or synchronize the internal repository or its descendants as clients.

Confirm discovered conventions by their content and current links; resolve competing candidates before choosing. Client outputs in `.agentscli/conventions/` are disposable. Edit sources only in the convention-template subtree; only those participate automatically. Preserve each convention's relative directory.

## Curate the rule

Stay within the requested scope and prefer an existing convention covering the subject. Review usefulness and correctness as well as structure:

- State applicability, the decision resolved, concrete actions, and conditions. Distinguish requirements, recommendations, and examples; explain reasons when useful.
- Keep project orientation in `AGENTS.md` and detailed or scoped rules in conventions. Split topics by consultation needs, without inheritance or subconventions.
- Use small valid examples, not mandatory illustrative paths, names, commands, or versions. Preserve real exceptions and alternatives; do not invent policies or restrictions.
- Check related rules for duplication, contradiction, ambiguity, and stale references. Prefer one normative source with useful links; surface unresolved choices rather than inventing precedence.

For authorized population, replace the applicable fill-in comment itself with verified project content, including actual project context where requested. Report missing facts instead of inventing architecture, commands, or policies. New fill-in guidance must be an HTML comment explicitly requesting its own replacement. Preserve client titles and operational cards.

## Preserve format and links

In both modes, derive the basename from the H1's plain text: Unicode NFKD, remove combining marks, lowercase ASCII letters, replace non-ASCII-alphanumeric runs with one hyphen, and trim outer hyphens. Require a remaining ASCII letter or digit; append `.tpl.md` for clients or `.md` for handwritten files. For example, `# Contexto do projeto` uses `contexto-do-projeto.tpl.md`. Renames preserve the requested heading and update authored links; client sync regenerates the new path and removes marked stale output.

Client templates require valid UTF-8, one H1 and exactly one complete nonempty discovery card, both outside code examples. For `commits.tpl.md`:

```markdown
# Commits

<!-- AGENT-CARD START -->
Read when creating or reviewing commit messages.
<!-- AGENT-CARD END -->

Describe the concrete change in the commit subject.
```

The card says when to consult; rules belong in the body. Rendering removes the operational card from convention output and inserts its discovery text into root `AGENTS.md`. Links between client documents target generated `.md` paths under `.agentscli/conventions/`. Resolve body links from the generated convention's location and card links from root `AGENTS.md`.

Handwritten conventions need a clear title and discovery links, without required cards or generated markers.

## Verify within scope

For clients, use installed `agentscli validate --repo-root <project>` when available; never implicitly install or upgrade it. Skills stay English; configuration selects authored document language, not chat language.

Review-only requests write nothing. Authorship does not imply generation, migration, commit, tag, or publication. Explain legacy `agentscli init --migrate --dry-run` and `agentscli init --migrate` without running them unless requested. For generation also requested, use `agentscli-build-agents` with existing configuration. Report changed sources, coherence checks, and validation actually performed.
