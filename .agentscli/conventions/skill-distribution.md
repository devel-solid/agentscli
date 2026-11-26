---
trigger: Read when changing canonical skill sources, packaged support, or managed installations.
reviewedHash: 'c3ff5ad65bb9dfa02e4bc0d546bb90a6114053b57154ac9926fbfe6e75a99ae9'
reviewPolicyVersion: '1'
---

# Skill distribution

- Project generation is offline. Its real engine and complete executable closure belong to the build skill; the CLI uses its own packaged copy. Installed project scripts must run with Node.js and versioned project resources, without a global CLI, compiler, source checkout, implicit installation, Git, or network.

- Keep the three product skill sources canonical in the package's asset templates. Builds derive complete distributed resources from those sources, independently of root installations. Install and version the root copies through the compiled checkout CLI; never edit them manually or replace them with proxies, links, or another implementation. The repository's publication skill remains local and is not distributed. Ordinary libraries and native tools are permitted dependencies; all distributed scripts and declared support files must be included.

Package engines declare the Node.js requirement. Asset assembly stamps `metadata.generatedBy` and `metadata.generatorVersion` from the package's actual name/version; maintained sources stay unchanged.

- Replace disposable managed outputs from desired sources.

Before: a root-installed skill is edited by hand and its package source stays unchanged. The next installation loses that edit. After: edit the canonical template, build the assets, and refresh the root installation through the checkout CLI. Keep all referenced support in the shipped tree. Validate local links from each referring file, including transitive example links, so a present example index cannot hide a missing corrected convention. Complete-directory movement must preserve relative support links.
