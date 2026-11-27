---
trigger: Read when creating reusable test fixtures or testing elapsed-time behavior.
---

# Test fixtures and clocks

Keep tests deterministic through a shared fixture setup. Each factory call must return fresh mutable state, and tests that depend on elapsed time must use a fixed clock. Reset the setup between tests so changes to nested objects and changes to the current time cannot affect later tests.

Use fixture factories consistently, including when arranging time-dependent units. Put the clock and fixture reset together in the common test setup so callers do not have to remember separate controls. This keeps fixtures reproducible and makes elapsed-time assertions stable.
