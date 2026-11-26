---
trigger: Read when creating or changing skill entrypoint metadata.
reviewedHash: '6a78525a894fc71e249763ce6d70041948630afbb8fd52f6a5cfa18a90bc0360'
reviewPolicyVersion: '1'
---

# Skill frontmatter

Use standard leading YAML skill frontmatter with a nonempty `name` matching its directory and a nonempty activation `description`. Metadata values are strings. The three distributed operational skills declare MIT.

Before, an entrypoint in `review-schema` declares a different identity and numeric metadata:

```yaml
name: database
description: Review schema compatibility.
metadata:
  revision: 2
```

After, the same entrypoint has its matching identity and a string metadata value:

```yaml
name: review-schema
description: Review whether a schema change preserves supported consumers.
license: MIT
metadata:
  revision: '2'
```

The identity lets discovery select the intended operation; the description states its activation and outcome. Quoting the metadata preserves the string contract. This example teaches metadata shape and does not add review-schema to the product's delivered skill inventory.
