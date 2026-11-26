---
trigger: Read when implementing text-file reads or writes, or editing textual project files.
reviewedHash: '01e49e1b3ac9d8b27815af1578fc84721528fac7e3510814dcb61c33db6f3e91'
reviewPolicyVersion: '1'
---

# Text encoding

Use UTF-8 when reading and writing project text files. Preserve the characters through decoding, editing, and encoding.

For example, a UTF-8 document containing `João` must still contain `João` after an unrelated wording edit, rather than `JoÃ£o`. The character `ã` is encoded as bytes `C3 A3` in UTF-8. Decoding those bytes as Windows-1252 produces `Ã£`; writing those mistaken characters back as UTF-8 preserves the corruption instead of repairing it. Decode the original bytes as UTF-8 and encode the edited text as UTF-8 so the accent survives.
