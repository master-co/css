# AI Notes For `@master/css-integration`

## Responsibility

`@master/css-integration` owns the adapter-neutral contracts shared by official build and framework integrations: virtual module ids, `?master-css-plan` request helpers, generated plan/preloaded module source helpers, runtime injection source, ambient client module declarations, and explicit Node/build helper subpaths.

## Boundaries

- Keep this package dependency-light and adapter-neutral.
- This package may depend on `@master/css-engine` for public plan/preloaded types and `shared` for plan JSON helpers.
- Do not depend on Vite, Next, Webpack, Nuxt, Astro, Extractor, Runtime, Server, Configer, or Compiler.
- Do not implement project plan discovery, CSS import graph resolution, extraction, runtime hydration, or framework lifecycle behavior here.
- Browser-safe helpers must not import `node:*`, use `Buffer`, or read `process`.
- Node filesystem, path, hash, and resolved-id helpers belong in `./node`; build plugins belong in explicit build-only subpaths such as `./plan-loader-plugin`.

## Public APIs

- Browser-safe: `.`, `./client`, `./module`, `./plan-module`, `./plan-facade`, `./style-module`, `./preloaded-module`, `./runtime`
- Node/build-only: `./node`, `./plan-loader-plugin`

## Validation

```sh
pnpm --filter @master/css-integration test
pnpm --filter @master/css-integration type-check
pnpm --filter @master/css-integration build
pnpm --filter @master/css-integration lint
```
