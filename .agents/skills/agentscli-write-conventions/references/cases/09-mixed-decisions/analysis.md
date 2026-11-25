# Mixed decisions: test fixtures and clocks

## Hypothetical context

A fictional parcel-tracking service has two established testing agreements. Reusable fixture factories return fresh mutable objects, including nested collections, for each call. Separately, tests whose result depends on elapsed time supply a fixed clock to the unit under test; tests unrelated to time do not need a clock. Clocks are supplied per test, without changing global time. No particular factory library or clock library has been selected.

Compare the complete [inadequate convention](inadequate/test-fixtures-and-clocks.md) with the [corrected convention](corrected/test-fixtures-and-clocks.md).

## Why the draft is difficult to apply

The inadequate text interleaves object isolation with elapsed-time control and concludes that they belong in one shared setup. A reader trying to add a plain formatting test cannot tell whether it needs a fixed clock. A reader fixing a mutation leak is directed toward the same combined reset even though a frozen clock cannot make two shared arrays independent. These are distinct decisions with different activation conditions.

## What changes and why

The corrected version separates the two agreements by the problem they prevent. The fixture example observes an untouched second nested collection after the first is mutated; it demonstrates fresh nested state rather than merely naming a factory. The clock example places the fixed value on the time-dependent unit and explains why the fixture factory is not the owner of global time.

Sections are useful because the reader may need one decision without the other. The change also removes the unsupported combined-reset requirement instead of preserving it under clearer headings. Two headings alone would not repair the mistaken coupling.

## Transferable concept

Group decisions by when they apply and what they control. Shared vocabulary such as “deterministic tests” is not enough to combine independent agreements into one required setup.
