---
trigger: Read when changing a migration already applied to a shared environment.
---

# Migration immutability

Once a migration has been applied to a shared environment, keep that file unchanged. Express a later database change in a new migration.

Suppose `20260714093000-add-shelf-code.sql` has already added a column that now needs a wider type. Preserve that file and add a later widening migration. Editing the original would give a fresh database a different history from the environment that already applied it.

This agreement decides whether a file can change. It does not authorize executing a deployment.
