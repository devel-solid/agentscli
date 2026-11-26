# Give an agreement its audience and boundary

## Hypothetical context

A fictional library team maintains public release notes for consumers and a separate internal change log for maintainers. The established agreement is to put observable changes to supported interfaces in public notes, including fixes to documented behavior, and implementation-only changes in the internal log. Public entries explain the effect on consumers. The team has not agreed to publish every internal task or to hide externally observable fixes. This context is invented for instruction, not a repository policy.

Read the complete [inadequate convention](inadequate/change-note-scope.md) and both complete replacements: [change note scope](corrected/change-note-scope.md) and [change note content](corrected/change-note-content.md).

## What fails

“Relevant changes” and “unnecessary implementation detail” do not identify the audience or destination. The inadequate version can be followed by publishing a refactor summary, omitting a small compatibility fix, or duplicating every entry in both logs. Its emphasis on concise prose cannot resolve a scope decision.

## The reader's unresolved decision

Does an internal parser rewrite merit a public entry? Does a small correction to an output promised by the supported interface belong there even if the code change is tiny?

## What changes and why

The scope convention names both audiences and distinguishes destinations by observable effect, rather than implementation size or how interesting a change seems. Two contrasting scenarios expose that distinction: a substantial parser rewrite leaves consumer behavior unchanged, while a small fix changes the documented result consumers receive.

The content convention owns how an already selected entry is written: consumer effect for public notes, useful technical context for internal entries, and one change per entry without copied development history. Its example contrasts a useful public statement with an implementation-only summary and illustrates why unrelated changes need separate entries.

These are independent reading needs. Someone classifying an existing change can need only the scope decision; someone rewriting an already placed public note can need only the content decision. Two headings in the old file would still couple their discovery. Each replacement has a precise trigger and a self-contained body. The scope conditions stay in the scope file; audience-specific wording, entry focus, and the restriction against copying discussion stay in the content file. No agreed obligation is discarded.

## Transferable concept

A rule can be linguistically clear yet impossible to apply because its audience or boundary is absent. Supply that context, then separate independently consulted decisions into complete conventions rather than merely polishing two sections of a broad document.
