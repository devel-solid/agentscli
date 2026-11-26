---
trigger: Read when creating or changing reusable test fixture factories.
---

# Fixture independence

Every fixture factory call returns fresh mutable objects, including nested collections. A shallow copy of an object containing a shared array does not meet this agreement.

For a parcel fixture whose default `checkpoints` array is empty, this test must pass:

```javascript
const first = makeParcel();
const second = makeParcel();
first.checkpoints.push('sorting-room');
expect(second.checkpoints).toEqual([]);
```

The second parcel remains unchanged even before a cleanup hook runs. Clearing a shared array after the test conceals the coupling; independence belongs to each factory result.
