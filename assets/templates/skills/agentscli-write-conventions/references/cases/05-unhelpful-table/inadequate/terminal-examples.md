---
trigger: Read when adding terminal transcripts or copy-only command examples to documentation.
---

# Terminal examples

Use `$ ` before entered commands in terminal transcripts. Put commands and their output on separate lines, leaving output unprefixed. Use the following parts to assemble a transcript:

| Part           | Content                     | Treatment                         |
| -------------- | --------------------------- | --------------------------------- |
| Command marker | `$ `                        | Before each entered command       |
| Command        | `orbit inspect sample.conf` | After the command marker          |
| Output         | `configuration valid`       | Following the command, unprefixed |

For a copy-only command block, omit the command marker and the output. Keep the command itself unchanged so the example can be copied into a terminal.
