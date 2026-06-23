# Commands

## Root Commands

```sh
pnpm build
pnpm build:examples
pnpm check
pnpm test
pnpm e2e
pnpm lint
pnpm type-check
pnpm commit-check
pnpm submodules
```

`pnpm check` runs commit check, build, and package test/lint/type-check scripts.

## Common Package Commands

```sh
pnpm --filter @master/css build
pnpm --filter @master/css test
pnpm --filter @master/css type-check
pnpm --filter @master/css lint
```

Use the real scripts in each package `package.json`. Some packages have `test`, some have `e2e`, and some only have build/type-check/lint.

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

The `Benchmark` GitHub Actions workflow runs on `main`, `alpha`, `beta`, `rc`, and `canary`, plus manual `workflow_dispatch`. It uploads package-scoped benchmark artifacts and compares against the latest 50 matching artifacts per branch and package. Do not commit benchmark history files to the repo.

For bundle reports, build first and measure the changed artifacts on the same machine:

```sh
pnpm --filter @master/css-engine build
pnpm --filter @master/css-runtime build
wc -c packages/engine/dist/core.mjs packages/runtime/dist/global.min.js
wc -c packages/runtime/dist/default-manifest.json
gzip -c packages/engine/dist/core.mjs | wc -c
brotli -c packages/engine/dist/core.mjs | wc -c
gzip -c packages/runtime/dist/global.min.js | wc -c
brotli -c packages/runtime/dist/global.min.js | wc -c
gzip -c packages/runtime/dist/default-manifest.json | wc -c
brotli -c packages/runtime/dist/default-manifest.json | wc -c
shasum -a 256 packages/engine/dist/core.mjs packages/runtime/dist/global.min.js packages/runtime/dist/default-manifest.json
```

## CI Equivalents

- Test workflow: `pnpm run build` then `pnpm test`
- Lint workflow: `pnpm run build` then `pnpm run lint`
- Type-check workflow: `pnpm run build` then `pnpm run type-check`
- E2E workflow: Playwright install, `pnpm run build`, then `pnpm e2e`
- Example check: `pnpm build`, reinstall, then `pnpm build:examples`
