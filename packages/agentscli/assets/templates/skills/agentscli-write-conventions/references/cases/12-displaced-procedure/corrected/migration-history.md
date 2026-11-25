---
trigger: Read when creating or changing SQL migration files.
---

# Migration history

## Identify a migration

Name SQL migration files with a UTC creation identifier in `YYYYMMDDHHmmss` form, followed by a hyphen, a lowercase hyphenated description, and `.sql`. For example, a migration created at 09:30:00 UTC on 14 July 2026 can be named `20260714093000-add-shelf-code.sql`.

## Preserve applied history

Once a migration has been applied to a shared environment, keep that file unchanged. Express a later database change in a new migration.

Suppose `20260714093000-add-shelf-code.sql` has already added a column, and the column now needs a wider type. Keep that file and add a migration such as `20260715110000-widen-shelf-code.sql`. Editing the original addition would give a fresh database a different history from the environment that already applied it.

This agreement governs migration files. Environment selection, backups, execution, and deployment verification belong to the deployment procedure.
