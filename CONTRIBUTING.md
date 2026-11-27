# Contributing to agentscli

This guide is for developing and releasing the package. To use agentscli in your own project, start with the [README](README.md) or the [usage guide](docs/usage.md).

- [Development setup and checks](#development)
- [Repository guide](#repository-guide)
- [Refresh local project resources](#refresh-local-project-resources)
- [Publish a release](#publish-a-release)

## Development

Requires Node.js 22, 24, or 26 and the exact pnpm version declared in `package.json`. Bootstrap the standalone package manager from the repository root with the [official installer](https://pnpm.io/installation), without npm or Corepack.

PowerShell:

```powershell
$env:PNPM_VERSION = (Get-Content -Raw -Encoding utf8 package.json | ConvertFrom-Json).packageManager.Substring(5)
Invoke-WebRequest https://get.pnpm.io/install.ps1 -OutFile "$env:TEMP/install-pnpm.ps1"
& "$env:TEMP/install-pnpm.ps1"
```

POSIX shell:

```sh
export PNPM_VERSION=$(node -p "require('./package.json').packageManager.slice('pnpm@'.length)")
curl --fail --silent --show-error --location https://get.pnpm.io/install.sh --output /tmp/install-pnpm.sh
sh /tmp/install-pnpm.sh
```

Open a new terminal after installation. If an older pnpm shadows the standalone executable, inspect its location before removing it; `corepack disable pnpm` removes Corepack's pnpm/pnpx shims while preserving its other managers. On Windows, `Get-Command pnpm -All` shows command precedence. Confirm `pnpm --version` matches the manifest pin.

Then, from the repository root:

```sh
pnpm ci
pnpm run setup
pnpm run check
```

`setup` configures the Git pre-push hook. `check` runs type, formatting, unit, and resource checks; CI uses the same gate. `pnpm ci` validates the lockfile, cleans the installation, and installs with a frozen lockfile. For everyday dependency installation, use `pnpm install`; checks fail on a stale installation instead of installing implicitly. Use `pnpm exec` for one-off local tools.

`pnpm-workspace.yaml` configures this single package; it declares no subpackages. Dependency versions are saved exactly, only esbuild may run an installation script, and the default store and supply-chain protections remain enabled. Review dependency changes in `pnpm-lock.yaml`; its generated formatting belongs to pnpm. The pnpm line was adopted with an explicit exception to the project's technology maturity period to provide a native release flow without starting on a line nearing end of support.

## Repository guide

| Location                                     | Purpose                                                               |
| -------------------------------------------- | --------------------------------------------------------------------- |
| `src/`, `assets/`, `scripts/`, `tests/unit/` | Package source, canonical templates, build support, and unit tests    |
| `.agentscli/conventions/`                    | Authored rules for working on this repository                         |
| `.agents/skills/`                            | Installed product skills and the repository's local publication skill |

## Refresh local project resources

Edit packaged skills in `assets/templates/skills`. After changing the CLI, packaged resources, or package metadata:

```sh
pnpm run dogfood
pnpm run check
```

`dogfood` builds the local CLI, refreshes this repository's installed skills, and synchronizes its `AGENTS.md` index. Commit generated resources along with their source changes.

## Publish a release

The [Publish agentscli workflow](https://github.com/devel-solid/agentscli/blob/main/.github/workflows/publish.yml) publishes through npm Trusted Publishing without a stored npm publishing token. Configure GitHub Actions as a trusted publisher for `@devel-solid/agentscli`, with owner `devel-solid`, repository `agentscli`, workflow filename `publish.yml`, and direct publishing enabled.

Use the publication skill to prepare the version, refresh resources, run checks, and inspect a tarball with the workflow's exact Node version and the manifest's pinned pnpm. Commit the reviewed source and create an annotated `agentscli-v<version>` tag containing one `Integrity: sha512-...` line with the reviewed tarball's integrity. Verify the npm trust configuration, then push the tag to start publication automatically. The workflow publishes only from a release tag, checks its version against package metadata, and requires the rebuilt archive to match the annotation's integrity. It publishes the inspected file with pnpm and OIDC and waits for registry availability. Success or the specific `ERR_PNPM_PUBLISH_AVAILABILITY_TIMEOUT` proceeds to read-only verification: `pnpm view` must match identity and integrity, and the downloaded tarball must match the reviewed SHA-512. Temporary metadata or tarball unavailability gets bounded read retries; other publication errors or mismatches fail. A timeout never retries the upload. If verification remains pending, inspect the same version without republishing it. Ordinary branch pushes do not publish, and no manual dispatch is configured. Verify the run and registry, then install and verify the exact published CLI version on the host with pnpm.
