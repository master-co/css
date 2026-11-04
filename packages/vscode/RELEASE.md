# VS Code Extension Release

Use this package release flow for `master-css-vscode` Marketplace releases.

## Requirements

- Use the repository's pinned Bun version:

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

The default target set is exactly eight: `win32-x64`, `win32-arm64`, `linux-x64`, `linux-arm64`, `alpine-x64`, `alpine-arm64`, `darwin-x64`, and `darwin-arm64`. There is no ARM32 or Universal candidate. Do not infer support from the older listing's target inventory.

## Candidate version and publisher policy

Review and commit `package.json`'s extension version before validating release artifacts. CI packaging must retain that version: do not bump it or push another commit between validation and publication. The local `release:vscode --patch` convenience command above creates a new candidate and therefore requires validation again, even with `--no-publish`.

Package both identities from the same revision and version: Marketplace uses `masterco.master-css-vscode`; Open VSX uses `master.master-css-vscode`. Only the staged publisher field differs. Keep the extension version independent of npm's package/channel versions. Existing editor publication uses the normal Marketplace release channel, including releases initiated from `rc`; do not infer `--pre-release` from the Git branch or introduce an odd/even version scheme without a separate migration decision.

Check both stores before an authorized publication. An already published version is immutable; duplicate-skipping is not evidence that its bytes match the tested artifact. If the existing version identifies a different candidate, prepare a new version and repeat validation. Stable-branch workflow integration is maintained in the repository release workflow.

## Legacy listing and omitted-target migration

`masterco.master-css-language-service` is a separate legacy extension ID. The migration message for that listing should direct users to disable or uninstall it, install `masterco.master-css-vscode`, and reload VS Code. Open VSX editors use `master.master-css-vscode`. Keep only one Master CSS language extension enabled to avoid competing language servers, review `masterCSS.*` settings, and verify completion and hover in a trusted project.

The legacy listing's version is independent of the current extension's version; its larger number does not indicate a newer release of this product. Users of historical ARM32 or Universal variants should retain a working installation until they have a supported host. No automatic extension-ID migration or update for omitted targets is promised. Keep the legacy listing unchanged while publication is held; its eventual deprecation banner or retention decision requires explicit external-listing approval and a tested migration path.

## Verify VSIX artifacts without publishing

The manual-only **Editor artifact verification** workflow (`editor-verification.yml`) builds native artifacts on eight matching hosts, packages both publisher identities, and tests the extracted VSIX native addon, CLI self-test, and bundled LSP initialize/completion/hover/shutdown cycle. All jobs use repository read access; there are no publication credentials, version changes, pushes, or deployment steps.

The candidate inventory checks all 16 archives against the source version, publisher, target, bundled JavaScript, and staged native payloads. The final gate matches each execution proof to its archive's SHA-256 and the workflow revision. Run `verify-vsix-archives.mjs` with `--marketplace-dir`, `--open-vsx-dir`, and `--proof` to perform the same content check before publication.

Six desktop targets additionally install their real VSIX into a fresh VS Code profile and test extension activation, completion, hover, and language-server restart at the declared minimum VS Code version, `1.120.0`. User profiles and workspace dependencies are not reused. The official `@vscode/test-electron` helper is installed at a pinned version in a disposable tools directory, outside the project dependency graph.

Alpine targets run inside musl containers. Their proof explicitly records **no remote extension-host activation coverage**. Completing that acceptance criterion requires a supported Dev Containers/WSL host and a real remote extension-host test; native/LSP success cannot substitute for it. Remote-SSH to Alpine is not a supported VS Code configuration. See [VS Code's Linux remote requirements](https://code.visualstudio.com/docs/remote/linux).

For a local artifact check after building and packaging:

```sh
node packages/vscode/scripts/verify-vsix.mjs \
  --vsix /absolute/path/master-css-vscode-2.0.37-darwin-arm64.vsix \
  --target darwin-arm64 --publisher masterco --proof /tmp/editor-proof.json
```

Add `--test-electron-module /absolute/path/to/@vscode/test-electron/out/index.js` for desktop installation/activation checks. `--vscode-version` selects the downloaded official release; `--executable` can use an existing VS Code executable while retaining isolated profiles. This launches a separate test window. Proofs record the actual VS Code version and artifact hash.

Before announcing readiness, retain same-revision proofs for both stores, inspect legacy-listing migration messaging and omitted-target behavior, and verify public listing versions and installation after an explicitly authorized release. Local README changes do not update the public legacy listing or deprecate it remotely.

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
