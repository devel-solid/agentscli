---
trigger: Read when naming text snapshot fixture files.
---

# Snapshot extensions

Give text snapshot fixture files the lowercase `.snap` extension. Using one extension makes these fixtures recognizable when browsing changes.

## Understanding the filename

A filename consists of a name and, commonly, an extension after the final dot. For these fixtures, `.snap` is that extension. The extension identifies the file as a text snapshot fixture; it is not part of the descriptive basename.

## Applying the extension

For a fixture with basename `receipt`, use `receipt.snap`. Do not name that fixture `receipt.SNAP`, because the chosen extension is lowercase. Do not use `receipt.snapshot`, because the agreed extension is `.snap`.

These examples illustrate the same extension choice for different spellings of a filename. When creating another text snapshot fixture, retain the chosen lowercase suffix so the convention continues to apply consistently.
