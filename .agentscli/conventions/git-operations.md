---
trigger: Read when implementing tooling that inspects or publishes Git repositories.
reviewedHash: '3effe35b146468a3776689bab604ebd984472e945b3841df27b180c2428956a4'
reviewPolicyVersion: '1'
---

# Git operations

Require native Git only for operations that actually inspect or publish repositories. Use existing native authentication, argument arrays, and injected adapters. Do not collect tokens, assume a hosting vendor, execute downloaded code, or add a publication service.

For example, an index generator reads versioned Markdown and needs no Git executable. A release operation inspecting the source commit uses native Git with its configured authentication. Its unit test supplies an adapter returning a candidate commit; collecting a provider token or cloning a remote repository would introduce unnecessary dependencies and side effects.
