---
trigger: Read when writing survey records to CSV exports.
---

# CSV field encoding

Export each survey record as `label` followed by `note`, without a header. Separate fields with a comma and end every record with a line feed.

Enclose a field in double quotes when it contains a comma, a double quote, or a line feed. Inside an enclosed field, double each double quote. Preserve the field contents, including embedded line feeds; do not replace them with spaces or backslash escapes.

For this record:

```json
{ "label": "West, gate", "note": "He said \"ready\"." }
```

Write this CSV record, followed by a line feed:

```csv
"West, gate","He said ""ready""."
```

The comma in `West, gate` stays inside the first field. The doubled quotes represent the literal quotes around `ready`; `\"ready\"` would introduce backslashes instead of the agreed encoding.

A note containing a line feed also remains one field. This input:

```json
{ "label": "Route", "note": "Level 1\nLevel 2" }
```

Produces one CSV record spanning two physical lines, again followed by a record-ending line feed:

```csv
Route,"Level 1
Level 2"
```

The line feed inside the quotes belongs to the note. The line feed after the closing quote ends the record.
