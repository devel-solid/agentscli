---
trigger: Read when rendering ranked report rows.
---

# Ranked row order

Render ranked report rows by descending numeric score. Resolve equal scores by ascending stable record identifier. Record identifiers use fixed-width uppercase ASCII strings.

For example, when producing a ranked report, sort its rows by score and use the identifier to put tied rows into the agreed order. This gives reports a consistent sequence even when rows come from different providers.

Use the scores supplied by the report; presentation code does not calculate a different ranking.
