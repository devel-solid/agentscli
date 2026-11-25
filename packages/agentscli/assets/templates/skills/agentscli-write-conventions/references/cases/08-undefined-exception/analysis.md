# An undefined exception: public option aliases

## Hypothetical context

A fictional command-line team prefers one public spelling for each option. It has agreed that an old spelling may remain as a compatibility alias only when it was shipped in a supported release and a maintained caller still uses it. That alias lasts through the current major version and is removed in the next major version. New documentation and newly changed callers use the canonical spelling. An unshipped spelling or a personal preference does not qualify for the exception.

Compare the complete [inadequate convention](inadequate/public-option-aliases.md) with the [corrected convention](corrected/public-option-aliases.md).

## What the draft leaves open

“Where compatibility requires it” can justify almost any alias indefinitely. It does not tell the reader whether a spelling from an unreleased branch counts, what evidence establishes compatibility, or when support ends. The draft's canonical-spelling advice is useful, but it cannot settle those exception decisions.

## What changes and why

The corrected version makes the exception conditional on two existing facts and gives its already agreed endpoint. Its two scenarios differ in the fact that matters: a supported shipped caller exists in one, whereas an unreleased prototype is the only user in the other. The first also names the removal boundary, so an exception does not become a second permanent interface.

Short scenarios work here because the decision depends on release history and caller support, not the visual spelling of the flags. A side-by-side comparison of flag names alone would add no evidence about eligibility.

## Transferable concept

An exception needs an entry condition and, when the agreement has one, an exit condition. Show the decisive difference between a qualifying situation and a plausible nonqualifying one; “when necessary” does not supply that boundary.
