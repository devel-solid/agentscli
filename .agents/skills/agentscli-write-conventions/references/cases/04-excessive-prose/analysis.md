# Expose the agreement buried in explanation

## Hypothetical context

A fictional operations team shares a work queue. It has agreed that every active item has exactly one named owner, that the owner is responsible for keeping its status current, and that a handoff changes the owner only after the recipient explicitly accepts it. Until acceptance, the existing owner remains responsible. Other people can help without becoming co-owners. These are invented coordination agreements for this case.

Read the complete [inadequate convention](inadequate/queue-ownership.md) and [corrected convention](corrected/queue-ownership.md).

## What fails

The inadequate version contains the relevant decisions, so missing policy is not its problem. Each decision is surrounded by repeated explanations about collaboration, clarity, and continuity. The handoff boundary is especially costly to find: a reader scanning for who owns a pending transfer must extract it from a long paragraph about communication.

## The reader's unresolved decision

The answer technically exists, but can an operator quickly establish who remains responsible after a handoff is proposed and before it is accepted?

## What changes and why

The correction puts the stable ownership rule first and the transition boundary under its own heading. It removes repeated rationale while retaining status responsibility and the distinction between help and co-ownership. A short named scenario makes the pending-transfer state visible: proposing a recipient does not itself replace the owner.

The gain is access to the decision, not simply fewer words or more headings. The scenario preserves the one nuance that compression could easily erase: responsibility continues during the gap before acceptance.

## Transferable concept

When a draft already contains the agreement, revision may require subtraction and organization rather than more explanation. Preserve the boundary conditions while reducing the effort needed to retrieve them.
