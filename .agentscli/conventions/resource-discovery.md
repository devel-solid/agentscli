---
trigger: Read when introducing resource links, locating another operation, or moving skill support.
reviewedHash: '283563d15e949414392aac38b01f01f7d297b5f4570f57b77af5ed6b762a40c3'
reviewPolicyVersion: '1'
---

# Resource discovery

- Start with the identified project root, current instructions, configuration, and resource provenance. Recognize resources by purpose and identity, confirm their actual consumers, and reject material ambiguity. Moved authored resources remain discoverable through maintained instructions. Do not guess directory depth or search personal/global skills as a fallback.

- Skill instructions and support must not link directly to conventions or other skills, including entrypoints, directories, scripts, and support files. They may mention identities. The agent discovers the project's actual resource locations. Own sibling support links and self anchors are allowed; complete-directory movement must preserve them.

Active `file:` links in skill Markdown are prohibited, including links to apparent own support, because machine-local URLs do not preserve bundle portability. Use relative bundled references instead. Split raw fragment/query delimiters before percent-decoding the path; a decoded filename character is not a URL delimiter. For example, the illustrative target `references/notes%23release.md#example` selects file `notes#release.md` and fragment `example`; an unencoded `#` begins the fragment. A target ending in `/` must name an actual bundled directory, not a file with a slash appended.

- Do not hide foreign resource paths in executable examples. A skill may use its own relative support paths and verified public product input contracts. It must discover another skill's entrypoint by identity instead of hardcoding a path. No machine-specific absolute paths or unshipped repository references may be required.

- Convention checkers reject active links to any other convention or skill. Skill checkers reject direct links and fixed foreign-resource workflow paths, while permitting their own support files and plain identity mentions. Root instruction discovery links remain permitted.

Before: a refactoring instruction embeds the author's path to another skill's script. After: identify agentscli-build-agents, discover its project installation, and use its declared entrypoint. A relative link to the refactoring skill's own example library remains valid when its complete directory moves; a link to another skill's private support does not.

Make literal and executable examples explicit. Shell/console and JavaScript/TypeScript/Python fences, and command-shaped inline or paragraph examples, are executable workflow examples. Use a `text` fence for an intentionally invalid command and a `markdown` fence for a literal document. Mentioning a path in ordinary prose does not make it a command. Markdown blockquotes still contain active links and must be checked; quoting a forbidden link does not make it literal.

For example, a `text` fence can teach that a fixed foreign script path is inadequate. The same path in an executable shell command must fail. An own-support link to `references/cases/corrected.md` must resolve to a shipped file even if its parent example index exists; checking only the index's presence is insufficient.
