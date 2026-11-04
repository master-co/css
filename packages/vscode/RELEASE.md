# VS Code Extension Release

Use this package release flow for `master-css-vscode` Marketplace releases.

## Requirements

- Use the repository package manager through Corepack:

```sh
bun --version
```

- Configure GitHub Actions OIDC through `azure/login` with `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, and `AZURE_SUBSCRIPTION_ID`.
- Add the managed identity resource ID as a Contributor of the `masterco` Visual Studio Marketplace publisher.
- Verify VSCE can publish with Microsoft Entra ID after Azure login:

```sh
bun run --filter @master/css-vscode vsce verify-pat --azure-credential masterco
```

If the publisher has not authorized the managed identity, Marketplace returns `InvalidAccessException: The requested operation is not allowed.`

## Check CI authorization without publishing

Manually run **Marketplace authorization check** (`marketplace-auth-check.yml`)
on `rc` after the workflow is available on GitHub:

```sh
gh workflow run marketplace-auth-check.yml --repo master-co/css --ref rc
```

The workflow uses the release job's Azure identity and locked VSCE dependency,
then runs only `vsce verify-pat --azure-credential masterco`. Dependency lifecycle
scripts are disabled. It does not build or package the extension, change versions,
push commits, publish packages, or deploy the website. It grants only repository
read access and OIDC token access, and only runs against this repository's `rc`
branch to match the release identity's federated subject.

Check that both the Azure login and Marketplace verification steps succeed; a
skipped job is not a successful authorization check. This checks credentials and
publisher access, not VSIX contents or release acceptance. Do not rerun the
Release workflow for this purpose. Introducing this workflow still requires a
remote update: honor any release/deployment hold before pushing, because the
existing push-triggered release workflow and hosting integrations are separate.

## Release

Preview the release plan without changing files:

```sh
bun run release:vscode -- --dry-run --azure-credential
```

Patch, build, package, and publish all supported targets:

```sh
bun run release:vscode -- --patch --azure-credential
```

Package without publishing:

```sh
bun run release:vscode -- --patch --no-publish
```

Release a limited target set:

```sh
bun run release:vscode -- --patch --azure-credential --target darwin-arm64
bun run release:vscode -- --patch --azure-credential --target linux-x64,darwin-arm64
```

The default target set is `win32-x64`, `win32-arm64`, `linux-x64`, `linux-arm64`, `linux-armhf`, `alpine-x64`, `alpine-arm64`, `darwin-x64`, and `darwin-arm64`.

## What The Script Does

1. Verifies `@types/vscode` does not declare a newer major/minor range than `engines.vscode`.
2. Records the current worktree state so pre-existing CI changes do not fail the release.
3. Runs the root `bun run build`.
4. Bumps the extension version without creating a git commit or tag.
5. Runs `master-css-vscode` `build` and `type-check`.
6. Verifies that the release only adds expected VS Code version changes.
7. Verifies VSCE publish rights when publishing, using Microsoft Entra ID when `--azure-credential` is set.
8. Packages or publishes the selected VSIX targets.
9. Prints the Marketplace URL and remaining tracked changes.

Marketplace URL:

https://marketplace.visualstudio.com/items?itemName=masterco.master-css-vscode
