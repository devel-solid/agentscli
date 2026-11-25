---
trigger: Read when changing dictionary loading or phrase selection.
---

# Dictionary access

Phrase-selection logic receives a `DictionarySource` from its caller. It does not construct a source or read files or HTTP responses directly. Keep access details in the source adapter so changing a dictionary's location does not change phrase selection.

All sources expose this contract:

```typescript
interface DictionarySource {
  find(key: string): Promise<string | undefined>;
}
```

Return the phrase when the key exists and `undefined` when it is absent. Reject the promise when access fails; do not turn a file read failure or an unavailable service into an absent key. Selection logic must be able to distinguish “there is no phrase” from “the source could not be read.”

The dependency direction is:

```text
caller chooses source
        |
        v
phrase selection -> DictionarySource <- file or HTTP adapter
```

An embedded dictionary added later also implements this contract and is supplied by the caller. Its local availability does not justify adding a second lookup path inside phrase selection. The source implementation may change; the selector's access boundary remains the same.
