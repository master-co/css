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
on each intended release branch after the workflow is available on that branch:

```sh
gh workflow run marketplace-auth-check.yml --repo master-co/css --ref rc
gh workflow run marketplace-auth-check.yml --repo master-co/css --ref main
```

The workflow uses the release job's Azure identity and locked VSCE dependency,
then runs only `vsce verify-pat --azure-credential masterco`. Dependency lifecycle
scripts are disabled. It does not build or package the extension, change versions,
push commits, publish packages, or deploy the website. It grants only repository
read access and OIDC token access, and only runs against this repository's `rc`
and `main` branches. Azure must have a federated credential for each exact branch
subject (`repo:master-co/css:ref:refs/heads/rc` and
`repo:master-co/css:ref:refs/heads/main`). A successful `rc` check does not verify
the `main` subject. Record each run's branch, source revision and both job results;
merely inspecting the Azure credential configuration does not prove CI login.

Check that both the Azure login and Marketplace verification steps succeed; a
skipped job is not a successful authorization check. This checks credentials and
publisher access, not VSIX contents or release acceptance. Do not rerun the
Release workflow for this purpose. Introducing this workflow still requires a
remote update: honor any release/deployment hold before pushing, because the
existing push-triggered release workflow and hosting integrations are separate.

The same manual workflow separately checks Open VSX with the release-pinned
`ovsx@1.0.2 verify-pat master` command against `https://open-vsx.org`, using the
existing `OVSX_PAT` secret only through the environment. The explicit `master`
namespace is required; the source package's Marketplace publisher is `masterco`.
This is a read-only token and namespace-permission check, with a two-minute
command deadline and no interactive input. It does not create a namespace or
publish an extension. Both authorization jobs must succeed. Raw command output
is discarded to keep unexpected service error bodies out of public CI logs and
artifacts. Token verification does not establish final VSIX acceptance, listing
versions, or successful public installation.

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

The editor ships with the npm release of the same revision and takes that release's version. `scripts/editor-version.mjs` resolves it from the release plan: the planned npm version, unless that is below `package.json`'s extension version or is a prerelease, in which case `package.json`'s version stays. `package.json`'s version is therefore a floor (2.0.38, above the 2.0.x npm releases); from 2.1.0 on, the editor and npm versions are the same and need no editor bump. Validation's `version` job resolves the version and writes it into the manifest before packaging and before the evidence check. The release job's store gate resolves it again from its own plan, and `publish-editors` resolves it from the version npm actually released, so the evidence check fails if the tested VSIX carries a different version. Do not push another commit between validation and publication. The local `release:vscode --patch` convenience command above creates a new candidate and therefore requires validation again, even with `--no-publish`.

Package both identities from the same revision and version: Marketplace uses `masterco.master-css-vscode`; Open VSX uses `master.master-css-vscode`. Only the staged publisher field differs. An npm prerelease channel does not version the editor: a release from `rc` keeps `package.json`'s version. Existing editor publication uses the normal Marketplace release channel, including releases initiated from `rc`; do not infer `--pre-release` from the Git branch or introduce an odd/even version scheme without a separate migration decision.

Check both stores before an authorized publication. An already published version is immutable; duplicate-skipping is not evidence that its bytes match the tested artifact. If the existing version identifies a different candidate, raise `package.json`'s version and repeat validation. Stable-branch workflow integration is maintained in the repository release workflow.

## Legacy listing and omitted-target migration

`masterco.master-css-language-service` is a separate legacy extension ID. The migration message for that listing should direct users to disable or uninstall it, install `masterco.master-css-vscode`, and reload VS Code. Open VSX editors use `master.master-css-vscode`. Keep only one Master CSS language extension enabled to avoid competing language servers, review `masterCSS.*` settings, and verify completion and hover in a trusted project.

The legacy listing's version is independent of the current extension's version; its larger number does not indicate a newer release of this product. Users of historical ARM32 or Universal variants should retain a working installation until they have a supported host. No automatic extension-ID migration or update for omitted targets is promised. Keep the legacy listing unchanged while publication is held; its eventual deprecation banner or retention decision requires explicit external-listing approval and a tested migration path.

## Verify VSIX artifacts without publishing

The **Editor artifact verification** workflow (`editor-verification.yml`) runs manually or as a required reusable workflow during release validation when editor inputs changed. A release compares those inputs with the revision of the editor the stores serve, not with the previous push: `scripts/published-editor-revision.mjs` takes the newest version both stores serve on all eight targets and resolves its `v<version>` release tag, so the editor changes of a push whose release failed or planned none still ship with the next release. A push that plans no npm release selects no editor delivery; a served revision that cannot be proven (stores that disagree or cannot be read, a version without a release tag, a tag outside the history) selects it. It builds native artifacts on eight matching hosts, packages both publisher identities, and tests the extracted VSIX native addon, CLI self-test, and bundled LSP initialize/completion/hover/shutdown cycle. All verification jobs use repository read access; there are no publication credentials, version changes, pushes, or deployment steps.

For a complete candidate rehearsal, manually run **CI** with `release_candidate: true` (default: `false`). This enables release artifact validation and all editor host checks even when the comparison base equals the candidate SHA. It never publishes or deploys. Normal full validation does not by itself select editor publication.

The candidate inventory checks all 16 archives against the source version, publisher, target, bundled JavaScript, and staged native payloads. The final gate reads every VSIX again and matches its SHA-256 to the inventory, execution proof, source version, and workflow revision. `verify-vsix-archives.mjs` produces the inventory from the build inputs; `verify-editor-evidence.mjs --candidate-dir <directory> --proof-dir <directory>` validates the complete downloaded artifacts and host proofs against `GITHUB_SHA` and the source extension version.

An authorized release waits for that same-run gate before npm publication. Editor publication then downloads the same run's `editor-vsix` and `editor-proof-*` artifacts, repeats the complete evidence check, and uploads those exact 16 VSIX files to the stores without rebuilding or repackaging. Evidence from a prior manual run or another revision cannot satisfy this gate.

Six desktop targets additionally install their real VSIX into a fresh VS Code profile and test extension activation, completion, hover, and language-server restart at the declared minimum VS Code version, `1.123.0`. User profiles and workspace dependencies are not reused. The official `@vscode/test-electron` helper is installed at a pinned version in a disposable tools directory, outside the project dependency graph.

Alpine targets additionally install those same VSIX bytes into the official VS Code Server's remote Node extension host in disposable musl containers. A headless browser connects only to loopback and runs the same activation, completion, hover and restart assertions. The server's version, commit and archive SHA-256 are pinned, and the proof confirms the remote platform, architecture, musl and Node.js version. This creates no public tunnel or deployed service. The final gate rejects an Alpine native/LSP-only proof. Remote-SSH to Alpine remains unsupported; see [VS Code's Linux remote requirements](https://code.visualstudio.com/docs/remote/linux).

The minimum VS Code version is `1.123.0` because its [remote server uses Node.js 24](https://github.com/microsoft/vscode/blob/1.123.0/remote/.npmrc), matching the bundled language server. The previous `1.120.0` claim was incorrect for remote hosts: its official server uses Node.js 22.22.1 and rejects the bundle's `using` syntax before initialization, even though the desktop Electron host passed. The checks use the actual installed server runtime and bundled VSIX; they do not substitute a system Node executable or rewrite the bundle.

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
