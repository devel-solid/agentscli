---
trigger: Read when writing survey records to CSV exports.
---

# CSV field encoding

Export each survey record as `label` followed by `note`, with no header row. Separate the fields with a comma and end each record with a line feed.

Apply standard CSV escaping to punctuation and control characters in either field. Retain the original field contents so exported text can be read back accurately. Do not build rows by joining unescaped values: labels and notes can contain CSV punctuation, and those values must remain valid fields.
