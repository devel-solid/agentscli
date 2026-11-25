---
trigger: Read when representing byte ranges or splitting them into chunks.
---

# Byte ranges

Use half-open intervals `[start, end)` for internal byte ranges. This representation makes length calculation and composition straightforward: the length is `end - start`, and adjacent ranges can share a boundary without overlapping.

Keep endpoints valid byte offsets and preserve half-open semantics when passing ranges between helpers. Do not mix inclusive and exclusive range conventions in the processing pipeline. Empty ranges and invalid ranges should be handled consistently with the representation.
