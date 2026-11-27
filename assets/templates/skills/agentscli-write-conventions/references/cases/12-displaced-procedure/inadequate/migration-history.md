---
trigger: Read when creating or changing SQL migration files.
---

# Migration history

Name SQL migration files with a UTC creation identifier in `YYYYMMDDHHmmss` form, followed by a hyphen, a lowercase hyphenated description, and `.sql`. For example, use `20260714093000-add-shelf-code.sql`.

Do not change a migration after it has been applied to a shared environment. A later database change needs a new migration so environments share the same history.

## Apply the migration

1. Select the shared environment for the deployment and take its database backup.
2. Inspect the pending migrations:

   ```sh
   db-step plan --environment staging
   ```

3. Apply the inspected plan:

   ```sh
   db-step apply --environment staging
   ```

4. Check the application's health page and compare the resulting schema with the deployment's expected schema.

Run these steps whenever a change adds a migration, so the file and the deployed database stay aligned.
