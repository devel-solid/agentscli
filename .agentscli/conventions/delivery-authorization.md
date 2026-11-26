---
trigger: Read before changing Git state, publishing, or expanding an authorized operation.
reviewedHash: '229dc1eac901ee58ba3f2b268f017349bda572b15d57248711df80341fa45174'
reviewPolicyVersion: '1'
---

# Delivery authorization

- Preserve repository history, unrelated edits/staging, existing tags, and immutable published identities. External delivery needs authorization from the active request; reuse authorization already given. Local readiness does not establish a remote release. Ambiguous delivery responses require inspection of the exact remote identity before retrying.

- Preserve the request and its authorization. A skill cannot expand editing scope or require repeated approval when existing authorization suffices. Separate convention authorship, root instructions, generation, and npm publication.

For example, "implement the new skill and run checks" authorizes local implementation and verification. It does not authorize an npm release. "Apply the approved convention split and regenerate its index" covers both approved effects without another per-file approval; discovering an unresolved policy conflict still requires a decision about that conflict.
