---
trigger: Read when adding or modifying automated tests.
reviewedHash: 'e865f5c434c44b503d665d9eaf0f06088b929d08ae192fd7deb6254447ee0f47'
reviewPolicyVersion: '1'
---

# Unit test boundaries

- Version only lightweight unit tests under each applicable `tests/unit/`. Exercise parsers, renderers, planners, and injected filesystem/Git/npm boundaries with small inputs. Do not add subprocess, CLI/Git/npm, network, installation, disposable-project, integration, or end-to-end test suites, including opt-in variants.

Use injected adapters for lightweight unit tests rather than invoking the live dependency.

For example, an in-memory installation planner can start with the two legacy skill trees and assert that update adds the third while preserving authored bytes. Spawning npm to install a disposable project would test a different boundary and is not a versioned unit test. Archive fixtures may be small byte buffers supplied to the archive parser.
