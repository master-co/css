# Commands

## Root Commands

```sh
bun run build
bun run build:site
bun run build:examples
bun run dev:site
bun run dev:site:clean
bun run check
bun run test
bun run e2e
bun run lint
bun run type-check
bun run type-check:refs
bun run type-check:affected
bun run type-check:clean
bun run commit-check
bun run check:ai-context
bun run test:ai-context
```

`bun run check` runs commit check, build, and package test/lint/type-check scripts.

`bun run check:ai-context` enforces production, support-code, and AI-context line/byte
budgets. Generated files need an explicit marker; exceptional static data needs a
bounded entry in `.ai/context/source-budget.json`.

Run site orchestration from the repository root (`/Users/aron/master/css`). Use `bun run dev:site` for normal site development, `bun run dev:site:clean` when Astro or Vite caches need to be reset, and `bun run build:site` for a full site build after package dist warm-up.

`bun run type-check` runs package-local type-check scripts through Turbo for all packages, including framework-specific checkers such as Vue's `vue-tsc`.

`bun run type-check:refs` runs the plain TypeScript project-reference solution graph with `tsc -b tsconfig.typecheck.json`. This is the fastest full TypeScript-only check after `.tsbuild/typecheck` is warm.

Use `bun run type-check:refs --force` to force a cold project-reference validation.

`bun run type-check:affected` runs Turbo type-check only for packages affected by the current branch diff.

`bun run type-check:clean` removes TypeScript project-reference build info and declaration-only cache output for the root solution graph.

## Common Package Commands

```sh
bun run --filter @master/css build
bun run --filter @master/css test
bun run --filter @master/css type-check
bun run --filter @master/css lint
```

Use the real scripts in each package `package.json`. Some packages have `test`, some have `e2e`, and some only have build/type-check/lint.

For package-local TypeScript checks, most packages use `tsc -b tsconfig.typecheck.json` and emit declaration-only cache output under `.tsbuild/typecheck`. Vue stays on `vue-tsc --noEmit`.

Shared tsdown package builds use TypeScript 7's native declaration emitter.
A local `rolldown-plugin-dts` patch accepts the common root of all imported
workspace sources and rejects failed compiler subprocesses. Output stays in a
temporary tree before tsdown writes `dist`; ambient and generated JSON declarations
remain intact. Validate this boundary with `bun test scripts/tsdown-package.test.mjs`.
See [toolchain.md](toolchain.md) for the isolated third-party TS6 dependencies and
Node execution exceptions.

For site-local checks, stay in the repository root and let bun run set the workspace cwd:

```sh
bun run --filter site prepare-app
bun run --filter site lint
bun run --filter site lint:full
bun run --filter site test:lint-cache
bun run --filter site type-check
```

Site `lint` uses ESLint's content cache, namespaced by CSS/project inputs, config,
lockfile, built workspace packages, and native artifact bytes. Build changed
packages before linting. `lint:full` bypasses the cache and is the CI check; both
commands retain the full configured file scope and rules.

## High-Value Scoped Checks

```sh
bun run --filter @master/css test
bun run --filter @master/css-runtime e2e
bun run --filter @master/css-server test
bun run --filter @master/css-tooling test
bun run --filter @master/css-compiler test
bun run --filter @master/css-vite test
bun run --filter @master/css-language-service test
bun run --filter @master/css-language-server test
bun run --filter @master/eslint-plugin-css test
bun run --filter @master/css-cli test
```

## Benchmark Commands

```sh
bun run --filter @master/css bench
bun run --filter @master/css-runtime bench
node scripts/benchmark-site-lint.mjs --output /tmp/lint-before.json
node scripts/benchmark-site-lint.mjs --output /tmp/lint-after.json --baseline /tmp/lint-before.json
```

The site lint benchmark records uncached per-rule timings and native artifact
identity. Passing a baseline fixes the file list and asserts identical diagnostics
and fixes. Compare the same build profile and use repeated runs for timing; keep
reports outside source control.

Use `bun run --filter @master/css bench` for engine session startup and execution. Rust engine benchmarks remain authoritative for matching, parsing, priority, layer insertion, and resource behavior.

Use `bun run --filter @master/css-runtime bench` for browser runtime CPU, DOM scan, mutation tracking, hydration, engine startup, CSSOM insertion/deletion, or global bundle work. Run `bun run --filter @master/css-runtime e2e` as the browser correctness check for runtime and hydration changes; add a targeted browser benchmark when CPU or CSSOM behavior is part of the change.

`bun run check:runtime-size` compares raw/gzip/brotli sizes of the global runtime bundle, which inlines the JavaScript engine, the default runtime program it fetches, and the progressive critical path (the runtime ESM entry bundled without its lazily imported engine) against `.ai/contracts/runtime-bundle-size.json`. Build `@master/css-runtime` first. Use `bun run check:runtime-size:update` only for an intentional, reported size change.

The browser engine has its own gates (`.ai/architecture.md#browser-engine`): `bun run --filter @master/css-engine-js differential [--fuzz <n>] [--seed <n>]` compares it with the Rust engine Wasm and must report zero differences (its `test` task, which CI runs), `verify:program` checks the program decoder against Rust, and `check:size` checks the engine and CDN page brotli budgets. `bench:baseline [--rc87 <dist>] [--wasm <runtime package dir>]` compares browser runtime builds. Rebuild the Rust Wasm (`bun run build:rust:wasm`) before the differential after `crates/` changes.

The `Benchmark` GitHub Actions workflow runs on relevant benchmark, Rust core, CSS execution, tooling, preset, runtime, schema, shared-build, and workspace configuration changes pushed to `main`, `alpha`, `beta`, `rc`, and `canary`, plus manual `workflow_dispatch`. It uploads package-scoped benchmark artifacts and compares against the latest 50 matching artifacts per branch and package. Do not commit benchmark history files to the repo.

For bundle reports, build first and measure the changed artifacts on the same machine:

```sh
bun run --filter @master/css build
bun run --filter @master/css-runtime build
wc -c packages/css/dist/engine/bound-engine.js packages/runtime/dist/global.min.js
wc -c packages/runtime/dist/default-program.bin
gzip -c packages/css/dist/engine/bound-engine.js | wc -c
brotli -c packages/css/dist/engine/bound-engine.js | wc -c
gzip -c packages/runtime/dist/global.min.js | wc -c
brotli -c packages/runtime/dist/global.min.js | wc -c
gzip -c packages/runtime/dist/default-program.bin | wc -c
brotli -c packages/runtime/dist/default-program.bin | wc -c
shasum -a 256 packages/css/dist/engine/bound-engine.js packages/runtime/dist/global.min.js packages/runtime/dist/default-program.bin
```

## CI Equivalents

- Linux quality: install dependencies, audit site translations, install the Chromium headless shell, run package `test`, `lint`, and `type-check` tasks together, then build examples. Pull requests use Turbo's `--affected`; scheduled and manual CI run every task.
- Windows compatibility: install dependencies and the Chromium headless shell, then run affected package tests and example builds with concurrency limited to four. macOS does not run because Linux covers the POSIX web toolchain surface while Windows retains distinct path and process coverage.
- E2E: install dependencies plus Chromium headless shell and Firefox, then run package E2E tasks serially through Turbo. Pull requests and releases use `--affected`; scheduled and manual CI run every E2E task.
- Release: wait for all validation jobs, restore the Linux build cache, run `bun run build` as an integrity check, then execute `bun run semantic-release`. On `rc`, deploy the site or publish editor extensions only when their Turbo build graph is affected.
- Fork and Dependabot pull requests do not receive the private submodule token; preflight skips the validation jobs and the single `CI / required` check fails with an explicit message.
