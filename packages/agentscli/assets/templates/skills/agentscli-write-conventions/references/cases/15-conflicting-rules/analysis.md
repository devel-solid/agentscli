# Rules without a consistent precedence

## Hypothetical context

A fictional background worker has an established agreement: retry transient failures up to three total attempts, using the same deduplication token for every attempt of one job. Permanent failures are not retried. Once the worker observes a cancellation request, it starts no further attempt, even if retry capacity remains. An attempt already in flight may finish, and its actual outcome is recorded; cancellation does not roll back completed effects.

These are explicit teaching assumptions, not default retry or cancellation semantics.

Compare the complete [inadequate convention](inadequate/job-retries.md) and [corrected convention](corrected/job-retries.md).

## What remained wrong

The inadequate draft describes recovery and stopping in separate paragraphs, then treats a cancelled unfinished job as eligible for recovery. Both passages sound locally reasonable. Together they leave a worker author with incompatible directions when a transient failure and cancellation arrive close together.

The unresolved decision is which condition wins before a second attempt starts. Rewording either paragraph more confidently would preserve the conflict.

## What changed and why

The correction makes observed cancellation take precedence over retry eligibility. It separates starting another attempt from recording the result of one already running, so stopping retries is not confused with pretending an executed write never happened. The maximum remains three attempts in total, and the token remains stable.

A decision table makes the competing conditions visible side by side. A short race scenario then establishes that available retry capacity does not override an observed cancellation. The table alone would not explain the difference between an in-flight attempt and a new one.

**Transferable concept:** Review interacting rules at the point where both apply. Resolve their precedence from established agreements, then demonstrate the combined case rather than polishing each instruction in isolation.
