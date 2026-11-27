---
trigger: Read when defining deterministic checks or interpreting their proof boundaries.
reviewedHash: 'd3b01e5172db5da3844aab2106ba5d7086d634dc08fe64c2c16adf5b0476c473'
reviewPolicyVersion: '1'
---

# Mechanical validation

- Prefer deterministic validation whenever a rule is mechanical: schemas, required fields, duplicate keys, file ownership, paths, links, hashes, executable intent, role guards, and release identities. Apply this equally to this repository and consumer projects.

- Parse YAML and Markdown structurally. Reject duplicate/unknown keys, aliases, invalid types, unsafe paths, and unsupported active syntax. Inspect inline, reference, image, and HTML links, normalized/encoded targets, fragments, queries, resource path aliases, and resource support ownership. Resolve convention body links from the final convention path and trigger links from root AGENTS.md. Literal invalid examples are data; executable workflow examples cannot conceal foreign-resource paths.

- Keep semantic review distinct. Scripts cannot prove that a convention is self-contained prose, a skill has one useful responsibility, or a release has compatible impact. Agents review those properties and choose impact; scripts compute and verify deterministic consequences.

For example, YAML with two `trigger` keys is mechanically invalid. A valid file titled Testing that mixes fixtures and clocks can pass all structural checks while failing semantic responsibility review. Do not invent a keyword score, maximum paragraph count, or required example count to classify it. Likewise, validation must treat an intentionally invalid YAML block in a teaching example as literal data rather than the resource's active frontmatter.
