# Bun Migration Validation

Validated locally on macOS arm64 on 2026-10-29. The migration is implemented;
repository-wide validation still exposes the unrelated failures listed below.

## Result

- Bun 1.4.4 manages the complete workspace, its single `bun.lock`, package scripts,
  CI installation/caches, hooks, examples, benchmarks, site and release packing.
- Vitest, tsdown, Vite, Turbo and Cargo remain. Node 24 remains the consumer baseline
  and explicitly runs the documented incompatible tooling/test hosts.
- Repository AST tools and declaration generation use TypeScript 7.0.2. Third-party
  TS6 dependencies are declared and isolated at installation, including nested
  workspace dependencies. The old loader interception and `typescript6` alias are gone.
- Publication packs with Bun, validates the packed manifest, then uses Node/npm for
  registry authentication, channels and provenance. Release ordering is deterministic
  across Node/Bun filesystem enumeration. No package was published or deployed.
- Installer/MCP detection accepts `bun.lock` and `bun.lockb`; scanner workspace
  discovery accepts package.json workspaces. Other consumer package managers remain
  supported. No public package names, engine semantics or class syntax were changed.
- Reference reads actual built declarations. Its Svelte heading fixture now includes
  the existing `createMasterCSSHandle` and two option types already recorded in the
  public API contract. No CSS snapshot was regenerated.

See [toolchain.md](../toolchain.md) for commands, Node exceptions and maintenance rules.

## Passing Validation

| Check | Result |
| --- | --- |
| Clean Bun dependency installation | Successful; two subsequent frozen installs preserved lockfile and every workspace manifest byte |
| Package builds | 33 successful tasks |
| Example builds | All 37 selected tasks successful |
| Package lint | All 28 defined package lint tasks pass |
| Site lint | Passes with existing class-order warnings |
| Toolchain/release regression tests | 7 pass, including real Bun tarball workspace rewriting, credential cleanup, declaration failure propagation and source preservation with JSON imports |
| Package contracts / API census | 37 package contracts / 911 API records |
| Release configuration | 35 packages in dependency-safe order; workflow YAML parses |
| Rust quality | Formatting, Clippy, workspace tests, codegen and parity pass |
| Browser engine differential | 0 differences across 184,699 Rust/Wasm versus JavaScript comparisons |
| Runtime size / package artifacts | 3 size baselines / 858 published text artifacts pass |
| Next unit tests | 223 pass |
| MCP tests | 56 pass, including both Bun lockfile formats |
| Svelte add-on | 19 pass with Bun-installed temporary workspaces |
| Site build | 448 routes generated; postbuild verifies 92 referenced assets |
| Site Reference / docs examples / LLMS | 25 / 21 / 33 pass |
| Site homepage / islands | 34 / 8 pass under their explicit Node hosts |
| Site support | Image loader, public environment, syntax, MDX imports, lint cache and atomic authoring checks pass |
| Fixture dependency resolution | Root TS7, Angular/Svelte TS6 and workspace package resolution pass without a package-store layout assumption |
| Benchmarks | Report smoke passes |
| VS Code | 33 tests and lint pass; darwin-arm64 VSIX packages successfully |
| Bun CLI | Actual scratch-project CSS generation succeeds; CLI and installer help execute under Bun |

## Remaining Validation Failures

These failures were retained rather than changing unrelated behavior or approved CSS.
Logs from this session are under `/tmp/master-css-toolchain/`.

| Check | Observed failure / evidence |
| --- | --- |
| Full package unit run | 59/61 tasks pass. Svelte has 5 failing server hydration assertions; Vite has 2 failing style-entry expectations. Those assertions also fail under the Node test host; their implementations and assertions were not changed by this migration. |
| Package type checking | `packages/compiler/tests/diagnostics/index.test.ts:22` compares the diagnostic union with the removed `REMOVED_PRESET_UTILITY` value, and blocks dependent reference checks. |
| Site type checking | Seven existing errors at `packages/create/src/index.ts:370`–`376`: an array inferred with only `@master/css` rejects integration package names. No new site/native-API type errors remain. |
| Next integration E2E | 9/11 pass. The manifest-query fixture expects missing old fields; static-export encounters a missing generated `.master` stylesheet in Turbopack. |
| Runtime browsers | Chromium/WebKit: 400 pass. Standard local Firefox cannot find its profile. The existing isolated launcher now uses Bun: 198/200 pass; two preload/owned-stylesheet assertions also reproduce with a Node controller. |
| Approved site CSS snapshot | The current snapshot differs from generated CSS. Complete production contract objects from separate Node and Bun site builds are identical, including all route mappings, CSS bytes, hydration data and project manifests. The existing approved snapshot was preserved. |
| Native package consumer smoke | The unchanged smoke fixture passes Manifest v2 to a binding requiring v6 (`scripts/binding-package-smoke.mjs:29`). Native compilation/staging and loader/package tests succeed. |
| Example lint | The ESLint demonstration intentionally contains invalid `btn`, `unknow` and `font:` classes. Other five defined example lint tasks pass. |
| Optional old installation fixture smoke | Old `/react/static-rendering` fixture routes no longer exist. The resolver regression and maintained documentation example suite pass; obsolete guide content was not restored. |

Changed workspaces without lint scripts: `@master/css-engine-js`, benchmarks,
and the Lit, Angular, integration-lab, vanilla, Vite and Astro examples.
