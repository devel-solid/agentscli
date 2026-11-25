---
trigger: Read when adding terminal transcripts or copy-only command examples to documentation.
---

# Terminal examples

In a terminal transcript, prefix each entered command with `$ ` on the same line. Put its output on following lines without a command marker:

```console
$ orbit inspect sample.conf
configuration valid
```

The first line represents input; `configuration valid` is output, not a second command. Readers copying the command omit `$ `.

When a block is intended only for copying a command, omit both the marker and the output:

```sh
orbit inspect sample.conf
```

Choose the block according to whether the documentation needs to show the interaction or only supply an executable command.
