---
trigger: Read when writing code review comments.
---

# Review comment labels

Prefix each code review comment according to what is known about compliance:

| Label        | Use when                                                                    |
| ------------ | --------------------------------------------------------------------------- |
| `required`   | The change violates an established agreement or acceptance criterion.       |
| `question`   | Information is missing to determine whether the change complies.            |
| `suggestion` | You propose an optional alternative; no established requirement demands it. |

A `required` comment names the applicable agreement or criterion and the behavior that conflicts with it. Personal preference alone does not make a change required.

For a proposed variable rename:

- **`required`:** “The agreed vocabulary calls this value `batchId`; `groupId` identifies a different concept. Rename it to `batchId`.”
- **`question`:** “Is `groupId` the agreed name for this identifier? I cannot tell whether it represents a batch or a group.”
- **`suggestion`:** “Consider `batchId` to make the local name more descriptive. I found no naming agreement that requires the change.”

The first comment supplies a compliance reason. The last remains optional even if the reviewer strongly prefers it.
