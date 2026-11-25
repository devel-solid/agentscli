# Make an example discriminate between outcomes

## Hypothetical context

A fictional team has already agreed how to present ranked report rows: higher numeric scores first, then ascending stable record identifiers for equal scores. The identifiers in this system are fixed-width uppercase ASCII strings, so their lexical ordering is unambiguous. Scores are supplied by the report and are not recalculated by this convention. The agreement concerns reproducible presentation across data providers; it is not an agentscli default.

Read the complete [inadequate convention](inadequate/ranked-row-order.md) and [corrected convention](corrected/ranked-row-order.md).

## What fails

The inadequate rule states the two ordering keys correctly. Its example, however, merely renames the instruction as an activity: sort rows by the agreed order. It does not exercise equal scores, the point at which an author might accidentally preserve provider order or reverse both keys together. Calling the rule “clear” would not demonstrate the reader's ability to apply its secondary key.

## The reader's unresolved decision

When the provider sends `R14` before `R09` at the same score, should that order survive? Does descending score also imply descending identifier?

## What changes and why

The correction retains the same two-key agreement and supplies a small unsorted input and its exact output. One row has a higher score; two share a score. The reader can see that the primary key is descending while the secondary key is ascending. The explanation identifies why the equal-score pair moves and why provider arrival order is irrelevant.

Whole input and output lists let the reader inspect the resulting sequence without translating a sorting API or mentally combining separate comparisons. No scoring formula or additional ordering policy is introduced.

## Transferable concept

An example earns its place when it separates plausible interpretations. Repeating an instruction with “for example” adds neither evidence nor applicability.
