---
trigger: Read when naming a new SQL migration file.
---

# Migration identifiers

Name SQL migration files with a UTC creation identifier in `YYYYMMDDHHmmss` form, followed by a hyphen, a lowercase hyphenated description, and `.sql`.

A migration created at 09:30:00 UTC on 14 July 2026 can be named `20260714093000-add-shelf-code.sql`. `add_shelf_code.sql` omits the identifier and uses another description convention. The agreed name does not depend on the creator's local timezone.
