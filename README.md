# agentscli workspace

**Development repository for [`@devel-solid/agentscli`](packages/agentscli/README.md).**

This private npm workspace contains the CLI source, packaged skills, and unit tests. For installation, examples, and usage, read the [package documentation](packages/agentscli/README.md).

## Development

Requires Node.js 22, 24, or 26. From the repository root:

```sh
npm ci
npm run setup
npm run check
```

`setup` configures the Git pre-push hook. `check` runs type, formatting, unit, and resource checks; CI uses the same gate.

## Repository guide

| Location                  | Purpose                                                               |
| ------------------------- | --------------------------------------------------------------------- |
| `packages/agentscli/`     | Public package, product documentation, source, templates, and tests   |
| `.agentscli/conventions/` | Authored rules for working on this repository                         |
| `.agents/skills/`         | Installed product skills and the repository's local publication skill |

## Refresh local project resources

Edit packaged skills in `packages/agentscli/assets/templates/skills`. After changing the CLI, packaged resources, or package metadata:

```sh
npm run dogfood
npm run check
```

`dogfood` builds the local CLI, refreshes this repository's installed skills, and synchronizes its `AGENTS.md` index. Commit generated resources along with their source changes.

[MIT License](packages/agentscli/LICENSE)
