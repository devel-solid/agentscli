# Separate agreements from an operational procedure

## Hypothetical context

A fictional service names migration files with a UTC `YYYYMMDDHHmmss` identifier, a hyphen, a lowercase hyphenated description, and `.sql`. It also preserves migrations applied to shared environments. A separate runbook already owns environment selection, backups, execution, and deployment verification. The invented `db-step` command belongs to that runbook.

Read the complete [inadequate convention](inadequate/migration-history.md) and both complete replacements: [migration identifiers](corrected/migration-identifiers.md) and [migration immutability](corrected/migration-immutability.md).

## Before: three independent reading needs

A contributor naming a new file needs the filename agreement. A contributor correcting an applied column needs immutability. An operator deploying needs a procedure and environment authorization. A common database subject does not make these one decision.

The draft also implies that adding a migration requires operating a shared environment, without establishing deployment authorization.

## After: preserve each agreement and its owner

The identifier convention owns filenames and contrasts a compliant UTC identifier with an inadequate name. The immutability convention owns the edit-versus-new-file decision and explains divergent histories. Both have independent triggers and complete bodies.

The deployment sequence stays owned by the existing runbook established in this case's context. The correction neither executes it nor creates a skill. In a real project without that established owner, flag the displaced procedure and obtain scope for relocation or removal; do not silently lose its obligations.

Two headings inside Migration history would still couple naming and revision. A new convention containing the deployment transcript would still confuse a procedure with an agreement.
