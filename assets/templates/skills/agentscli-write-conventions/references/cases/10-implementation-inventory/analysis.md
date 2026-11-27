# An implementation inventory: dictionary access

## Hypothetical context

A fictional phrase-selection library can read dictionary entries from a local file or an HTTP service. Its team has agreed that selection logic receives a `DictionarySource` from its caller rather than constructing a transport. The source exposes `find(key)`, returning the phrase or `undefined` when the key is absent; access failures reject the promise. Adapters own file and HTTP details. Current class names are incidental evidence, not the agreement. The convention must remain useful when another source is introduced.

Compare the complete [inadequate convention](inadequate/dictionary-access.md) with the [corrected convention](corrected/dictionary-access.md).

## The missing recurring choice

The inadequate version lists current classes and describes their wiring. A contributor adding an embedded dictionary still has to infer where it belongs and whether phrase selection may read it directly. “Use the existing structure” preserves an inventory without expressing why the boundary exists or what a new implementation must preserve.

## What changes and why

The corrected version names the dependency direction, the shared source contract, and the distinction between absent entries and failed access. Its small diagram makes ownership visible without prescribing a directory tree. The embedded-dictionary scenario then applies the same boundary to a source absent from the inventory.

The method signature supplies the concrete information a new adapter needs. The prose explains the observable consequence of its two outcomes: an outage must not masquerade as a missing phrase. The selection algorithm and transport-specific request details are unnecessary to this agreement.

## Transferable concept

Use existing implementation facts to identify the enduring decision, then state that decision so it governs the next change. A class catalog or wiring description cannot substitute for an agreement about dependency direction and observable boundaries.
