---
trigger: Read when renaming or adding aliases for public command options.
---

# Public option aliases

Give each public command option one canonical spelling. Use that spelling in documentation and when changing callers so new usage converges on the same interface.

Keep an old spelling as an alias where compatibility requires it. Avoid unnecessary aliases, and remove compatibility aliases when they are no longer needed. Document the preferred spelling clearly so callers can migrate without confusion.
