---
trigger: Read when changing background job retries or cancellation handling.
---

# Job retries

Retry transient failures up to three total attempts: the original attempt and at most two retries. Keep one deduplication token across all attempts of the same job.

Observed cancellation takes precedence over retry eligibility. Before starting another attempt, apply these decisions:

| Condition                                           | Start another attempt? |
| --------------------------------------------------- | ---------------------- |
| A cancellation request has been observed            | No                     |
| No cancellation; the failure is permanent           | No                     |
| No cancellation; three attempts have already run    | No                     |
| No cancellation; transient failure; attempts remain | Yes                    |

For example, the first attempt fails transiently and the worker then observes cancellation before starting the second. Do not start the second attempt, even though two attempts remain available. Cancellation is not another transient failure.

An attempt already in flight may finish. Record its actual outcome; cancellation does not roll back effects that have completed. This preserves the executed result without authorizing another attempt.
