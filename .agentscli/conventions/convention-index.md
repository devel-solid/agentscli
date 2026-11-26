---
trigger: Read when changing AGENTS.md generation, index ownership, or discovery entries.
reviewedHash: '69697c8640688990cde9b7f2e26524df7519a44c2cdc3585beff9bc30a93ab96'
reviewPolicyVersion: '1'
---

# Convention index

- Generate root AGENTS.md mechanically as leading YAML frontmatter containing only `generatedBy: "@devel-solid/agentscli"`, the fixed `# AGENTS.md` title, and a deterministically ordered convention index. Derive items from convention titles and triggers with calculated links. This is the product contract, not a universal AGENTS.md requirement.

The build skill alone validates conventions and generates or checks the index, including an empty index when no conventions exist. Index synchronization preserves all authored convention bytes, edits, and deletions.

Optional convention review fields are validated for shape but do not appear in the index. Recording or invalidating only `reviewedHash` and `reviewPolicyVersion` must leave the generated index unchanged. Generation and validation never invoke the refactoring review filter, record semantic review state, or clear receipts.

Input validation does not plan an index replacement or require root index ownership. For valid conventions beside handwritten root instructions, `validate` succeeds without reading or changing those instructions. `sync`, `sync --dry-run`, and `sync --check` all require the index's generator identity because they plan its replacement; report DOCUMENT_CONFLICT and preserve the handwritten file until adoption is authorized.

Before: an approved split creates `fixture-independence.md` and `fixed-test-clocks.md`, but the index still lists the retired broad Testing document. After: regenerate from the final authored files so each title and trigger gets its own calculated link and the retired entry disappears. Handwritten root instructions remain protected; a split never permits silently overwriting them.
