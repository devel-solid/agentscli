# Give an agreement its audience and boundary

## Hypothetical context

A fictional library team maintains public release notes for consumers and a separate internal change log for maintainers. The established agreement is to put observable changes to supported interfaces in public notes, including fixes to documented behavior, and implementation-only changes in the internal log. Public entries explain the effect on consumers. The team has not agreed to publish every internal task or to hide externally observable fixes. This context is invented for instruction, not a repository policy.

Read the complete [inadequate convention](inadequate/change-note-scope.md) and [corrected convention](corrected/change-note-scope.md).

## What fails

“Relevant changes” and “unnecessary implementation detail” do not identify the audience or destination. The inadequate version can be followed by publishing a refactor summary, omitting a small compatibility fix, or duplicating every entry in both logs. Its emphasis on concise prose cannot resolve a scope decision.

## The reader's unresolved decision

Does an internal parser rewrite merit a public entry? Does a small correction to an output promised by the supported interface belong there even if the code change is tiny?

## What changes and why

The correction names both audiences and distinguishes the destinations by observable effect, rather than by implementation size or how interesting a change seems. Two contrasting scenarios expose that distinction: a substantial parser rewrite leaves consumer behavior unchanged, while a small fix changes the documented result consumers receive. An example public entry then shows the consumer's perspective.

The short sections separate “where does this belong?” from “what does the public entry say?” They do not impose a release process or a template for all notes.

## Transferable concept

A rule can be linguistically clear yet impossible to apply because its audience or boundary is absent. Supply the context that makes the decision meaningful before polishing wording.
