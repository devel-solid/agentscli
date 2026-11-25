---
trigger: Read when changing dictionary loading or phrase selection.
---

# Dictionary access

The dictionary layer contains `FileDictionarySource` for files and `HttpDictionarySource` for remote dictionaries. `PhraseSelector` uses a dictionary source to find phrases, and the application entrypoint constructs the source before passing it to the selector.

File loading lives in the file source; HTTP requests live in the HTTP source. Keep dictionary changes consistent with this structure and reuse these classes where possible. New sources should follow the existing organization so the selector stays simple and all dictionaries fit the same design.
