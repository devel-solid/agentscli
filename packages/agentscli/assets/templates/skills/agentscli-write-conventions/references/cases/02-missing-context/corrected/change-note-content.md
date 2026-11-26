---
trigger: Read when writing public release notes or internal change-log entries.
---

# Change note content

Public entries state what consumers now receive or need to change. Internal entries explain the implementation change and technical context useful to maintainers. Focus each entry on one change; do not copy the development discussion into either log.

For a fix restoring a documented empty result, a public entry could read:

> An empty selection now returns an empty list, as documented, instead of reporting an invalid-selection error.

“Replace the selection branch in the parser” describes the implementation but leaves consumers to infer its effect. That technical explanation can serve an internal entry about a parser refactor; it does not describe the consumer-visible correction.

An entry combining the empty-result fix with an unrelated logging change mixes two changes. Give them separate entries so a reader can identify the effect relevant to their work without reconstructing the development discussion.
