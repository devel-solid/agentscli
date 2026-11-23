---
name: agentscli-adm-edit-agents
description: Maintain this tool monorepo's handwritten root AGENTS.md and convention discovery. Use for repository orientation and discovery changes, not detailed convention or skill authorship.
metadata:
  requires: requires.yml
---

# Maintain the monorepo entrypoint

Discover the repository root and run this skill's `node scripts/check.mjs --repo-root <root>` before and after editing. It verifies real tool workspace identities, direct-authoring context, the root entrypoint, and discovery targets. Do not create consumer configuration or initialize to resolve a missing context.

Edit only the handwritten English root AGENTS.md. Keep concise purpose, essential orientation, verified commands, and convention discovery with consultation conditions. Preserve customized sections and unrelated decisions; generated client headings/markers are not required here.

Detailed self-contained topic rules belong to conventions, handled by agentscli-adm-write-conventions. Execution procedures belong to their responsible skills. Mention skills by identity and discover their entrypoints, without hardcoded foreign skill paths.

Root AGENTS discovery may link conventions; conventions themselves cannot link other conventions or skills. Check existing targets before updating discovery. Keep each separate authoring responsibility within the existing authorization and do not maintain another catalog.

Review-only requests write nothing. Report the changed entrypoint, actual checks, and separate work still needed. Authorship does not imply generation, migration, Git mutation, or publication.
