# VS Code Extension Release

Use this package release flow for `master-css-vscode` Marketplace releases.

## Requirements

- Use the repository package manager through Corepack:

```sh
corepack pnpm --version
```

- Configure GitHub Actions OIDC through `azure/login` with `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, and `AZURE_SUBSCRIPTION_ID`.
- Add the managed identity resource ID as a Contributor of the `masterco` Visual Studio Marketplace publisher.
- Verify VSCE can publish with Microsoft Entra ID after Azure login:

```sh
corepack pnpm --filter @master/css-vscode exec vsce verify-pat --azure-credential masterco
```

If the publisher has not authorized the managed identity, Marketplace returns `InvalidAccessException: The requested operation is not allowed.`

## Release

Preview the release plan without changing files:

```sh
corepack pnpm release:vscode -- --dry-run --azure-credential
```

Patch, build, package, and publish all supported targets:

```sh
corepack pnpm release:vscode -- --patch --azure-credential
```

Package without publishing:

```sh
corepack pnpm release:vscode -- --patch --no-publish
```

Release a limited target set:

```sh
corepack pnpm release:vscode -- --patch --azure-credential --target darwin-arm64
corepack pnpm release:vscode -- --patch --azure-credential --target linux-x64,darwin-arm64
```

The default target set is `win32-x64`, `win32-arm64`, `linux-x64`, `linux-arm64`, `linux-armhf`, `alpine-x64`, `alpine-arm64`, `darwin-x64`, and `darwin-arm64`.

## What The Script Does

1. Verifies `@types/vscode` does not declare a newer major/minor range than `engines.vscode`.
2. Records the current worktree state so pre-existing CI changes do not fail the release.
3. Runs the root `pnpm build`.
4. Bumps the extension version without creating a git commit or tag.
5. Runs `master-css-vscode` `build` and `type-check`.
6. Verifies that the release only adds expected VS Code version changes.
7. Verifies VSCE publish rights when publishing, using Microsoft Entra ID when `--azure-credential` is set.
8. Packages or publishes the selected VSIX targets.
9. Prints the Marketplace URL and remaining tracked changes.

Marketplace URL:

https://marketplace.visualstudio.com/items?itemName=masterco.master-css-vscode
