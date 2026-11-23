---
name: agentscli-update-agents
description: Curate concise AGENTS.md instructions and convention discovery in the handwritten file or client template, preserving its format.
---

# Update AGENTS instructions

## Select the source

Read project instructions and inspect the requested root and ancestors before editing:

- Only `agentscli.yml`: edit handwritten root `AGENTS.md` in English. Its `skills` list selects distribution, not document generation.
- Only valid `.agentscli/config.yml`: edit `.agentscli/templates/AGENTS.tpl.md` in configured `language`; root `AGENTS.md` is disposable generated output.
- `agentscli-compose.yml`, even beside new configuration: explain that explicit migration must finish first; edit no legacy sources.
- Missing, malformed, or conflicting context: diagnose and ask for direction before editing; never infer direct mode from missing client configuration or initialize to resolve it.

Configuration contains exactly `language: en` or `language: pt-br`; reject duplicate/unknown keys, YAML aliases, and layout overrides. An ancestor's `agentscli.yml` blocks client interpretation of its subtree. Never initialize, migrate, validate, or synchronize the internal repository or its descendants as clients.

## Curate the entrypoint

Keep purpose, essential repository orientation, actual development commands, applicable skills, and convention links with consultation triggers. Put detailed domain rules, lengthy procedures, examples, and task-specific guidance in conventions; prefer improving an existing convention. Use `agentscli-write-conventions` when the request needs those changes.

Preserve decisions outside the request. Verify commands, paths, and links against current project sources; check duplication and contradictions without inventing tools or policies.

For authorized population, replace the applicable fill-in comment itself with verified content. The main default requests only purpose and essential orientation; report missing facts instead of inventing them. New fill-in guidance must be an HTML comment explicitly requesting its own replacement. Keep fill-in hints distinct from operational markers.

## Preserve format and links

Client templates require valid UTF-8, exactly one H1, and exactly one full-line operational insertion comment outside examples:

```markdown
<!-- agentscli:conventions -->
```

Rendering replaces it with the convention index. Sources below `.agentscli/templates/conventions/` produce links to `.agentscli/conventions/` relative to root `AGENTS.md`. Titles, sections, and surrounding text are customizable; defaults are not a mandatory schema. Do not add `<!-- agentscli:generated -->` to the template; the renderer supplies it.

Handwritten AGENTS uses ordinary readable Markdown and valid discovery links, without required insertion or generated markers.

## Verify within scope

For clients, use installed `agentscli validate --repo-root <project>` when available; never implicitly install or upgrade it. Skills stay English; configuration selects authored document language, not chat language.

Review-only requests write nothing. Authorship does not imply generation, commit, or publication. Explain legacy `agentscli init --migrate --dry-run` and `agentscli init --migrate` without running them unless requested. For generation also requested, use `agentscli-build-agents` within that scope. Report edited sources, content moved to conventions, and checks actually performed.
