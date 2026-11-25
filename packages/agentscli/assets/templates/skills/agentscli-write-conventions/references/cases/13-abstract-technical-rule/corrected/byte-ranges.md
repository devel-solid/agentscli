---
trigger: Read when representing byte ranges or splitting them into chunks.
---

# Byte ranges

Represent internal byte ranges as `[start, end)`: include `start` and exclude `end`. Both endpoints are nonnegative integer offsets, and `end` must be at least `start`. The range's length is `end - start`.

| Range    | Selected byte offsets | Meaning                     |
| -------- | --------------------- | --------------------------- |
| `[4, 7)` | 4, 5, 6               | Three bytes; 7 is excluded. |
| `[7, 9)` | 7, 8                  | Two bytes starting at 7.    |
| `[4, 4)` | None                  | A valid empty range.        |
| `[7, 4)` | Rejected              | The end precedes the start. |

When splitting `[4, 9)` at 7, use `[4, 7)` and `[7, 9)`. The shared endpoint is the first byte of the second chunk, so every byte is processed once. Starting the second chunk at 8 would skip byte 7; ending the first chunk at 8 would include byte 7 twice if the second still starts at 7.
