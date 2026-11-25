---
trigger: Read when choosing or writing public release notes and internal change-log entries.
---

# Change note scope

## Choose the destination by consumer impact

Public release notes are for consumers of the library's supported interfaces. Include observable changes to those interfaces, including fixes that restore documented behavior. Put implementation-only changes in the internal change log for maintainers.

A parser rewrite that returns the same supported results and errors belongs in the internal log. Its size does not make it a public change. A one-line fix that restores a documented empty result belongs in public notes because consumers can observe the correction.

## Describe the effect in public notes

State what consumers now receive or need to change. For the empty-result fix, an entry could read:

> An empty selection now returns an empty list, as documented, instead of reporting an invalid-selection error.

“Replace the selection branch in the parser” describes the implementation but leaves consumers to infer its effect. Keep that technical context in the internal log. Focus each entry on one change; do not copy the development discussion into either log.
