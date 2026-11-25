---
trigger: Read when choosing destinations for files written from archive entries.
---

# Archive destinations

Keep every archive entry inside the bundle root. Use the shared destination helper so all writers enforce the same boundary:

```javascript
const destination = checkedDestination(bundleRoot, entry.name);
await writeFile(destination, entry.content);
```

Pass the original entry name to the helper before writing. Do not construct a destination by concatenating strings or bypass the helper for entries that appear safe. A rejected destination must stop that entry from being written.
