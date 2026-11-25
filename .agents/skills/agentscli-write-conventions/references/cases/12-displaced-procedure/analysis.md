# An operational procedure inside an agreement

## Hypothetical context

A fictional service already records a recurring migration agreement: SQL migration files use a UTC creation identifier in `YYYYMMDDHHmmss` form, a hyphen, a lowercase hyphenated description, and `.sql`. Once applied to a shared environment, a migration remains unchanged; later changes use a new migration. The service also has an operational runbook that owns environment selection, backups, execution, and deployment verification. The invented `db-step` command below belongs to that runbook, not to this product.

These assumptions let the revision remove a procedure without inventing a replacement convention.

Compare the complete [inadequate convention](inadequate/migration-history.md) and [corrected convention](corrected/migration-history.md).

## What remained wrong

The draft combines an enduring file agreement with a deployment session's commands. A contributor changing a migration cannot tell whether following the convention also authorizes operating on a shared database. The command sequence will also age independently of the migration naming rule.

The problem is not that numbered steps are inherently inappropriate. Here they answer how to execute a deployment, whereas the convention needs to answer whether to edit an applied file or introduce a new one.

## What changed and why

The corrected file keeps naming and applied-history immutability, and removes the operational sequence. It neither executes nor relocates that sequence. A concrete correction scenario shows that an already applied column addition is followed by a new migration when its definition needs changing. The example names both files so the meaning of preserving history is visible.

The two sections distinguish identifying a file from changing an established history. A short scenario provides the missing revision decision more directly than a command transcript, and does not duplicate the runbook.

**Transferable concept:** Keep the recurring choice and remove execution instructions whose responsibility belongs elsewhere. A useful convention can survive that removal when its agreement was established before the edit.
