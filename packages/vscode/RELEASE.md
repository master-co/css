# VS Code Extension Release

Use this package release flow for `master-css-vscode` Marketplace releases.

## Requirements

- Start from a clean git worktree.
- Use the repository package manager through Corepack:

```sh
corepack pnpm --version
```

- Authenticate VSCE with a token that can publish under `masterco`.

```sh
corepack pnpm --filter master-css-vscode exec vsce verify-pat masterco
```

If VSCE cannot open the system credential store, it may fall back to `~/.vsce`.

## Release

Preview the release plan without changing files:

```sh
corepack pnpm release:vscode -- --dry-run
```

Patch, build, package, and publish all supported targets:

```sh
corepack pnpm release:vscode -- --patch
```

Package without publishing:

```sh
corepack pnpm release:vscode -- --patch --no-publish
```

Release a limited target set:

```sh
corepack pnpm release:vscode -- --patch --target darwin-arm64
corepack pnpm release:vscode -- --patch --target linux-x64,darwin-arm64
```

The default target set is `win32-x64`, `win32-arm64`, `linux-x64`, `linux-arm64`, `linux-armhf`, `alpine-x64`, `alpine-arm64`, `darwin-x64`, and `darwin-arm64`.

## What The Script Does

1. Verifies `@types/vscode` does not declare a newer major/minor range than `engines.vscode`.
2. Requires a clean worktree before mutating files.
3. Runs the root `pnpm build`.
4. Bumps the extension version without creating a git commit or tag.
5. Runs `master-css-vscode` `build` and `type-check`.
6. Verifies VSCE publish rights when publishing.
7. Packages or publishes the selected VSIX targets.
8. Prints the Marketplace URL and remaining tracked changes.

Marketplace URL:

https://marketplace.visualstudio.com/items?itemName=masterco.master-css-vscode
