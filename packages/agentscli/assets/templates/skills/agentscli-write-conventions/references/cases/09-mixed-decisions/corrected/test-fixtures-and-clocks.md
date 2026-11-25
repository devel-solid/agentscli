---
trigger: Read when creating reusable test fixtures or testing elapsed-time behavior.
---

# Test fixtures and clocks

## Give each fixture its own mutable state

Every fixture factory call returns fresh mutable objects, including nested collections. A shallow copy of an object containing a shared array does not meet this agreement.

For a parcel fixture whose default `checkpoints` array is empty, this test must pass:

```javascript
const first = makeParcel();
const second = makeParcel();
first.checkpoints.push('sorting-room');
expect(second.checkpoints).toEqual([]);
```

The second parcel remains unchanged even before a test cleanup hook runs. Independence belongs to the factory result; clearing a shared array after the test only conceals the coupling.

## Control time where the result depends on it

Supply a fixed clock to the unit under test when its result depends on elapsed time. For example, a lease test can construct its unit with a clock returning a known number of milliseconds:

```javascript
const lease = new ParcelLease({ now: () => 5000 });
```

All time reads made through that dependency in this test return `5000`. Supply the clock per test instead of replacing global time. A test of parcel label formatting does not need a clock when its result is independent of time.

Fixture freshness and time control solve separate problems. Do not make a combined fixture-and-clock reset a prerequisite for every test.
