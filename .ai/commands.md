# Commands

## Root Commands

```sh
pnpm build
pnpm build:site
pnpm build:examples
pnpm dev:site
pnpm dev:site:clean
pnpm check
pnpm test
pnpm e2e
pnpm lint
pnpm type-check
pnpm type-check:refs
pnpm type-check:affected
pnpm type-check:clean
pnpm commit-check
pnpm submodules
```

`pnpm check` runs commit check, build, and package test/lint/type-check scripts.

Run site orchestration from the repository root (`/Users/aron/master/css`). Use `pnpm dev:site` for normal site development, `pnpm dev:site:clean` when Next's local cache needs to be reset, and `pnpm build:site` for a full site build after package dist warm-up.

`pnpm type-check` runs package-local type-check scripts through Turbo for all packages, including framework-specific checkers such as Vue's `vue-tsc`.

`pnpm type-check:refs` runs the plain TypeScript project-reference solution graph with `tsc -b tsconfig.typecheck.json`. This is the fastest full TypeScript-only check after `.tsbuild/typecheck` is warm.

Use `pnpm run type-check:refs --force` to force a cold project-reference validation.

`pnpm type-check:affected` runs Turbo type-check only for packages affected by the current branch diff.

`pnpm type-check:clean` removes TypeScript project-reference build info and declaration-only cache output for the root solution graph.

## Common Package Commands

```sh
pnpm --filter @master/css build
pnpm --filter @master/css test
pnpm --filter @master/css type-check
pnpm --filter @master/css lint
```

Use the real scripts in each package `package.json`. Some packages have `test`, some have `e2e`, and some only have build/type-check/lint.

For package-local TypeScript checks, most packages use `tsc -b tsconfig.typecheck.json` and emit declaration-only cache output under `.tsbuild/typecheck`. Vue stays on `vue-tsc --noEmit`.

For site-local checks, stay in the repository root and let pnpm set the workspace cwd:

```sh
pnpm --filter site prepare-app
pnpm --filter site lint
pnpm --filter site type-check
```

## High-Value Scoped Checks

```sh
pnpm --filter @master/css test
pnpm --filter @master/css-runtime e2e
pnpm --filter @master/css-server test
pnpm --filter @master/css-scanner test
pnpm --filter @master/css.vite test
pnpm --filter @master/css-language test
pnpm --filter @master/css-language-service test
pnpm --filter @master/css-language-server test
pnpm --filter @master/eslint-plugin-css test
pnpm --filter @master/css-validator test
pnpm --filter @master/css-cli test
```

## Benchmark Commands

```sh
pnpm --filter @master/css-engine bench
pnpm --filter @master/css-runtime bench
```

Use `pnpm --filter @master/css-engine bench` for engine matching, generation, parsing, priority, layer insertion, and manifest compilation/cache work.

Use `pnpm --filter @master/css-runtime bench` for browser runtime CPU, DOM scan, mutation tracking, hydration, CSSOM insertion/deletion, or global bundle work. Run `pnpm --filter @master/css-runtime e2e` as the browser correctness check for runtime and hydration changes; add a targeted browser benchmark when CPU or CSSOM behavior is part of the change.

The `Benchmark` GitHub Actions workflow runs on relevant benchmark, engine, preset, runtime, schema, lexer, shared-build, and workspace configuration changes pushed to `main`, `alpha`, `beta`, `rc`, and `canary`, plus manual `workflow_dispatch`. It uploads package-scoped benchmark artifacts and compares against the latest 50 matching artifacts per branch and package. Do not commit benchmark history files to the repo.

For bundle reports, build first and measure the changed artifacts on the same machine:

```sh
pnpm --filter @master/css-engine build
pnpm --filter @master/css-runtime build
wc -c packages/engine/dist/core.js packages/runtime/dist/global.min.js
wc -c packages/runtime/dist/default-manifest.json
gzip -c packages/engine/dist/core.js | wc -c
brotli -c packages/engine/dist/core.js | wc -c
gzip -c packages/runtime/dist/global.min.js | wc -c
brotli -c packages/runtime/dist/global.min.js | wc -c
gzip -c packages/runtime/dist/default-manifest.json | wc -c
brotli -c packages/runtime/dist/default-manifest.json | wc -c
shasum -a 256 packages/engine/dist/core.js packages/runtime/dist/global.min.js packages/runtime/dist/default-manifest.json
```

## CI Equivalents

- Linux quality: install dependencies, audit site translations, install the Chromium headless shell, run package `test`, `lint`, and `type-check` tasks together, then build examples. Pull requests use Turbo's `--affected`; scheduled and manual CI run every task.
- Windows compatibility: install dependencies and the Chromium headless shell, then run affected package tests and example builds with concurrency limited to four. macOS does not run because Linux covers the POSIX web toolchain surface while Windows retains distinct path and process coverage.
- E2E: install dependencies plus Chromium headless shell and Firefox, then run package E2E tasks serially through Turbo. Pull requests and releases use `--affected`; scheduled and manual CI run every E2E task.
- Release: wait for all validation jobs, restore the Linux build cache, run `pnpm build` as an integrity check, then execute `pnpm exec semantic-release`. On `rc`, deploy the site or publish editor extensions only when their Turbo build graph is affected.
- Fork and Dependabot pull requests do not receive the private submodule token; preflight skips the validation jobs and the single `CI / required` check fails with an explicit message.
