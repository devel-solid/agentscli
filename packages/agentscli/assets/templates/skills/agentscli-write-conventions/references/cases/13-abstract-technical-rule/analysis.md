# A technical rule without its decisive boundary

## Hypothetical context

A fictional file-processing library standardizes internal byte ranges as half-open intervals: `start` is included and `end` excluded. Both are nonnegative integer offsets, and `end` must be at least `start`. Equal endpoints represent an empty range; reversed endpoints are rejected. Contributors are replacing older inclusive-range code and must preserve the new agreement when splitting work into chunks.

This is an assumed representation choice for the example, not a general byte-range requirement.

Compare the complete [inadequate convention](inadequate/byte-ranges.md) and [corrected convention](corrected/byte-ranges.md).

## What remained wrong

The inadequate convention names half-open intervals and their useful properties, but leaves validity implicit and illustrates none of the boundary decisions the intended reader is changing. An author accustomed to inclusive ranges can still subtract one from the next chunk's start or treat equal endpoints as a one-byte range.

The unresolved question is concrete: after processing `[4, 7)`, does the next chunk start at 7 or 8, and which bytes were processed?

## What changed and why

The correction states endpoint validity and shows the bytes selected by neighboring, empty, and reversed ranges. A small table helps because the reader must compare several range conditions against their outcomes. The following adjacency example explains the shared endpoint, rather than asking the reader to infer it from interval notation alone.

The representation remains the same; no chunk size, storage API, or processing algorithm is introduced. For a reader already fluent in interval notation, less illustration could suffice. Here the specified migration from inclusive code makes the boundary demonstration informative.

**Transferable concept:** A technically accurate abstraction may still omit the application evidence its reader needs. Demonstrate the boundary that distinguishes plausible implementations, rather than asserting that a named mathematical rule is already clear.
