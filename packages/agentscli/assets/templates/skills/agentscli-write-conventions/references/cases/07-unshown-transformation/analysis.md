# An unshown transformation: CSV fields

## Hypothetical context

A fictional survey tool exports records as two CSV fields, `label` then `note`, without a header. The agreed format uses commas between fields and a line feed after each record. A field containing a comma, a double quote, or a line feed is enclosed in double quotes; each double quote inside that field is doubled. Field contents, including embedded line feeds, are preserved. This is an established export agreement for this exercise, not a format selected by the convention author.

Compare the complete [inadequate convention](inadequate/csv-field-encoding.md) with the [corrected convention](corrected/csv-field-encoding.md).

## The unresolved decision

The inadequate version sounds precise about ordering and separators, but delegates the meaningful transformation to “CSV escaping.” A reader still has to decide whether an embedded quote becomes `\"`, whether a comma creates another field, and whether an embedded line feed is replaced by a space. The document has named an encoding without showing how its input survives it.

## What changes and why

The corrected version gives the actual quoting rule and paired JSON input and CSV output. One record combines a comma and quotes, making both framing and quote doubling visible in the resulting record. A separate multiline field shows why physical line count is not the record count. Its output preserves the embedded line feed instead of silently inventing a cleanup policy.

Keeping each CSV result intact lets the reader inspect the representation a consumer receives. A table of individual punctuation substitutions would obscure the interaction between field delimiters, enclosing quotes, and field contents. No parser implementation is needed to reveal that interaction.

## Transferable concept

When an agreement changes representation, state what changes and what survives, then show a complete representative result. Naming a standard or a transformation is insufficient when the reader's concrete doubt concerns the bytes it produces.
