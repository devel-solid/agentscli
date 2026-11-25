# Keep a continuous representation intact

## Hypothetical context

A fictional tool's documentation distinguishes terminal transcripts from copy-only command blocks. Its established agreement is to prefix entered commands with `$ ` in transcripts, put each command and its output on separate lines, and leave output unprefixed. Copy-only blocks omit the marker and output. The invented tool `orbit` and its response below provide example content; they do not prescribe a tool or documentation format for clients.

Read the complete [inadequate convention](inadequate/terminal-examples.md) and [corrected convention](corrected/terminal-examples.md).

## What fails

The inadequate document states the positioning rules correctly and records the right pieces, including a command and its output, but distributes one transcript across table cells. Its rule already determines where the marker and line break belong. The table adds no complete representation to inspect: the reader must still assemble the fragments to see the terminal interaction the writer must produce.

## The reader's unresolved decision

What does the assembled transcript look like beside a complete copy-only block? This is a need to inspect the result directly, rather than an unanswered choice about marker placement. The example should expose that whole result instead of making the reader reconstruct it from a redundant inventory.

## What changes and why

The correction presents the complete transcript as consecutive lines. A second, copy-only block makes the boundary concrete: it contains the command alone. The explanation names what a reader can copy and why the output lacks a marker.

The agreed content is unchanged. The gain comes from keeping spatially related information together. A table could help compare multiple transcript conventions, but this task is to show one agreed representation intact.

## Transferable concept

Choose a form that preserves the relationships the reader needs to inspect. Breaking a whole into labeled parts can make technically accurate information harder to apply.
