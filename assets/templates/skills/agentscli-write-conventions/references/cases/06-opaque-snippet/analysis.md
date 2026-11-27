# An opaque snippet: archive destinations

## Hypothetical context

A fictional archive builder writes regular files under a chosen bundle root. Entry names are virtual slash-separated paths; symbolic links and filesystem alias handling are outside this interface. The team has agreed to reject absolute entry names, resolve relative names against the bundle root, and accept only strict descendants after removing `.` and resolving `..` segments. Resolving to the root itself is rejected because the entry must name a file. There is already a helper implementing that agreement.

Compare the complete [inadequate convention](inadequate/archive-destinations.md) with the [corrected convention](corrected/archive-destinations.md).

## What remains hidden

The inadequate version names the approved helper and shows where to call it. That is plausible integration guidance, but it leaves its central promise opaque: what does “inside” mean? A reader cannot tell whether an internal parent segment is acceptable, whether an absolute name under the root is acceptable, or whether sharing the root's text prefix is enough. Calling a function whose name restates the promise supplies no evidence about those choices.

## What changes and why

The corrected version states the path relation and shows observed destinations or rejection for individual entries. The internal `..` example distinguishes normalization from a blanket ban on parent segments. The sibling-prefix example distinguishes ancestry from a string-prefix check. The absolute-name example shows that an otherwise plausible final location does not override the input restriction.

The input/result block exposes the helper's relevant behavior without replacing the helper with a path-processing tutorial. It is deliberately about virtual entry names, so it does not pretend to establish security properties of a real filesystem.

## Transferable concept

A snippet earns its space by making a decision visible. A trusted helper can remain the implementation, but its name and invocation alone do not demonstrate the agreement a caller or reviewer must understand.
