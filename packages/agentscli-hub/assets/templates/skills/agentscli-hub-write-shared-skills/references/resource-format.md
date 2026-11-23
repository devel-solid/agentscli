# Resource format

Read when authoring a shared skill with dependencies. These are complete resource files. A project must explicitly select the skill and every required hub resource from one exact revision; declarations never install anything automatically.

An existing shared convention, identity `code-review`:

```markdown
---
trigger: Read before reviewing code changes.
---

# Code review

Check behavior, failure paths, and regressions. Support findings with a concrete trigger and the affected behavior. Keep the review focused on the requested change.
```

The shared skill directory, identity `review-code`, contains exactly these two files for this example.

SKILL.md:

```markdown
---
name: review-code
description: Review requested code changes for concrete bugs and regressions.
license: MIT
compatibility: Requires Node.js >= 22.
metadata:
  requires: requires.yml
---

# Review code

Discover the required code-review convention by its hub identity through the active project's instructions. Confirm it belongs to the accepted hub revision before reviewing.

Read the requested diff and relevant callers. Check each suspected issue against a concrete input or failure path. Report actionable findings with the affected file and behavior; report no findings when the review establishes none. Do not implement changes or publish anything as part of this review.
```

requires.yml:

```yaml
conventions:
  - id: code-review
    source: hub
skills: []
```

The convention has no dependencies and no links to other resources. The skill points only to its own dependency document and discovers external resources by identity. Shared resources retain their authored metadata; the consuming CLI must not stamp or rewrite it. Generator metadata on this hub's separately managed operational skills identifies the producing CLI, rather than versioning a shared resource.
