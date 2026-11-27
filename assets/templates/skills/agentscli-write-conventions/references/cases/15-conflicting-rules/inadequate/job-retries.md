---
trigger: Read when changing background job retries or cancellation handling.
---

# Job retries

Retry transient failures up to three total attempts. Use the same deduplication token for every attempt of one job, so retrying does not create a second logical operation. Do not retry permanent failures.

Stop scheduling attempts when a cancellation request is observed. An attempt already in flight may finish; record its actual outcome because cancellation does not roll back completed effects.

## Recover unfinished jobs

Keep unfinished work recoverable while attempt capacity remains. A cancelled job that has not completed its operation remains eligible for retry, provided it has used fewer than three attempts. This allows a temporary interruption to use the same recovery path as other transient failures.
