---
trigger: Read when testing behavior that depends on elapsed time.
---

# Fixed test clocks

Supply a fixed clock to the unit under test when its result depends on elapsed time. Supply it per test instead of replacing global time.

A lease test can construct its unit with a clock returning a known number of milliseconds:

```javascript
const lease = new ParcelLease({ now: () => 5000 });
```

All time reads through that dependency return `5000` in this test. A label-formatting test independent of time needs no clock. Freezing global time affects unrelated units instead of expressing this test's dependency.
