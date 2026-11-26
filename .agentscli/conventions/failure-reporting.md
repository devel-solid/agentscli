---
trigger: Read when reporting validation results, operational failures, or completion evidence.
reviewedHash: 'fe7d2d3fca02db2a511f928e5025ad93d2cdcd0620dcf8bfd42649b47323e3e4'
reviewPolicyVersion: '1'
---

# Failure reporting

Report changed files, actual checks, and remaining work. On operational failure, distinguish completed effects from pending effects.

Make failures actionable and preserve evidence: identify the rejected field or path and the candidate commit when applicable.

Report the limits of the evidence. Passing schema checks or unit tests does not establish a completed publication or absence of bugs.

For example, if two replacement files are written but deleting the retired source fails, report those completed writes and the pending removal and index update. Do not report "refactoring complete" because validation succeeded before the failing removal.
