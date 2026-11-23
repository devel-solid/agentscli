# Resource format

Read when authoring a shared skill with dependencies. These are complete resource files. A consumer explicitly selects each required skill from one exact hub revision; declarations never install anything automatically. Convention selection is independent.

The shared skill `inspect-code` contains only this SKILL.md:

```markdown
---
name: inspect-code
description: Inspect a requested code diff and relevant callers to identify reproducible behavior changes.
license: MIT
compatibility: Requires Node.js >= 22.
---

# Inspect code

Identify the requested repository and diff. Read changed code and relevant callers, then trace suspected issues against concrete inputs and failure paths. Record the affected location, triggering condition, expected behavior, and observed behavior. Distinguish confirmed evidence from unresolved assumptions.

Return the evidence for the requested scope. Inspection does not authorize edits, generation, imports, or publication.
```

The shared skill directory, identity `review-code`, contains exactly these two files for this example.

SKILL.md:

```markdown
---
name: review-code
description: Review requested code changes for actionable bugs and regressions supported by concrete evidence.
license: MIT
compatibility: Requires Node.js >= 22.
metadata:
  agentscli: agentscli-skill.yml
---

# Review code

Read this skill's configuration. Discover the required inspect-code skill by its hub identity among the project's available skills. Use its instructions to inspect the requested diff and relevant callers.

Evaluate the resulting evidence for actionable bugs and regressions. For each confirmed finding, report its affected location, concrete trigger, and impact. Exclude speculative issues and style preferences unless they establish a behavior defect. State when no findings are established and which checks were actually performed.

A review does not authorize edits, generation, imports, or publication.
```

agentscli-skill.yml:

```yaml
requires:
  - id: inspect-code
    source: hub
```

The general document currently supports only `requires`, whose entries always refer to skills. An empty YAML mapping or `requires: []` declares no dependencies; blank/null documents and unknown fields fail validation. A skill needing no configuration omits both the file and pointer. The reserved file without its pointer is invalid. The old requires.yml and metadata.requires format is unsupported, with no compatibility reader or conversion.

Each skill keeps its own operation instructions and bundled support. It never depends on a convention for its procedure. Required skills are discovered by identity, without direct links or fixed paths to their entrypoints or support. Shared resources retain their authored metadata; the consuming CLI must not stamp or rewrite it. Generator metadata belongs only to the separately managed operational skills and identifies the producing CLI.
