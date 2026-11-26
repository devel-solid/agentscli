---
trigger: Read when defining previews, applying file changes, or retrying a partially completed operation.
reviewedHash: 'aae804eb12a0395e9a7dc813d6d52551ea069bbe56ad7d86e8f19707110f7f34'
reviewPolicyVersion: '1'
---

# Operation application

Previews and checks are write-free and use the same prospective plan as application. Preserve unrelated changes and the requested scope.

Replace files individually. After an operational failure, retry recomputes the same intent from current inputs and the actual completed effects.

For example, a preview computes two replacements, a retired-source removal, and an index update without writing. If application completes the replacements but the removal fails, the retry inspects those actual files and recomputes the remaining intent. The earlier preview does not establish that any action completed.
