---
trigger: Read when choosing between public release notes and the internal change log.
---

# Change note scope

Public release notes are for consumers of the library's supported interfaces. Include observable changes to those interfaces, including fixes that restore documented behavior. Put implementation-only changes in the internal change log for maintainers.

A parser rewrite that returns the same supported results and errors belongs in the internal log. Its size does not make it a public change. A one-line fix that restores a documented empty result belongs in public notes because consumers can observe the correction.
