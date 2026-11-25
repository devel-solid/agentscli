---
trigger: Read when choosing destinations for files written from archive entries.
---

# Archive destinations

For regular archive files, pass the original virtual entry name to `checkedDestination` before writing. Entry names use `/` separators. Reject absolute names; resolve relative names against the bundle root, removing `.` and resolving `..` segments. Accept only a strict descendant of that root. The root itself is not a file destination.

For a bundle root of `/bundle`, the helper must produce these results:

```text
entry: images/../index.txt       destination: /bundle/index.txt
entry: ../bundle-old/index.txt  rejected: outside the bundle root
entry: /bundle/index.txt        rejected: absolute entry name
entry: .                        rejected: names the bundle root
```

An internal parent segment can still resolve inside the root. Conversely, `/bundle-old/index.txt` shares a text prefix with `/bundle` but is not its descendant. Do not substitute a string-prefix check or a blanket ban on `..` for the agreed relation.

Write only after the helper accepts the entry. A rejection must stop that entry from being written; do not fall back to the original name. This agreement concerns virtual regular-file entry names, not symbolic links or filesystem aliases.
