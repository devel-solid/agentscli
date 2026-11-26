---
trigger: Read when inspecting or producing content that may contain credentials or private data.
reviewedHash: '45def937e3c732d501dac8f6da96eed65120c831e7c219a50c48665ebb238dd0'
reviewPolicyVersion: '1'
---

# Sensitive data

- Do not copy credentials, tokens, private keys, sensitive personal data, or secret-like values into commands, logs, tests, documentation, commits, or replies. Report the affected location and corrective action without reproducing the value.

For example, a configuration reader fails to open a token file. A useful diagnostic identifies the option and unreadable-file condition. Printing the environment or copying the token into a regression fixture would disclose unrelated private data and is unnecessary to explain the failure.
