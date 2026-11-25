---
trigger: Read when renaming or adding aliases for public command options.
---

# Public option aliases

Give each public option one canonical spelling. Use it in documentation and in newly changed callers.

Retain an old spelling as a temporary compatibility alias only when both conditions hold:

- It was shipped in a release the team still supports.
- A maintained caller still uses it.

Keep a qualifying alias through the current major version and remove it in the next major version. Its continued use does not extend that endpoint.

For example, version 2.6 replaces `--destination` with `--output-dir`. Version 2.5 shipped `--destination`, remains supported, and a maintained automation still passes it. Retain `--destination` as an alias in version 2 and remove it in version 3; new documentation uses `--output-dir`.

If `--dest` existed only on an unreleased prototype branch, it does not qualify, even if that branch's author prefers it. There is no supported shipped caller to preserve, so expose only the canonical spelling.
