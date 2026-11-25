---
trigger: Read when rendering ranked report rows.
---

# Ranked row order

Render ranked report rows by descending numeric score, then ascending stable record identifier for equal scores. Identifiers use fixed-width uppercase ASCII strings. Use the supplied scores without recalculating the ranking.

For rows received in this order:

```text
record  score
R14     0.88
R20     0.95
R09     0.88
```

Render:

```text
record  score
R20     0.95
R09     0.88
R14     0.88
```

`R20` leads because its score is higher. Among the tied rows, `R09` precedes `R14` even though it arrived later. Preserving provider order would leave the tie unresolved; reversing identifiers along with scores would apply the wrong secondary order.
