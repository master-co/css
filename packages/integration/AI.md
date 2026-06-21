# AI Notes For `@master/css-integration`

## Responsibility

`@master/css-integration` owns the adapter-neutral contracts shared by official build and framework integrations: virtual module ids, `?master-css-manifest` request helpers, generated manifest/emittedGlobals module source helpers, runtime injection source, ambient client module declarations, and explicit Node/build helper subpaths.

## Boundaries

- Keep this package dependency-light and adapter-neutral.
- This package may depend on `@master/css-engine` for public manifest/emittedGlobals types and `shared` for manifest JSON helpers.
- Do not depend on Vite, Next, Webpack, Nuxt, Astro, Extractor, Runtime, Server, Configer, or Compiler.
- Do not implement project manifest discovery, CSS import graph resolution, extraction, runtime hydration, or framework lifecycle behavior here.
- Browser-safe helpers must not import `node:*`, use `Buffer`, or read `process`.
- Node filesystem, path, hash, and resolved-id helpers belong in `./node`; build plugins belong in explicit build-only subpaths such as `./manifest-loader-plugin`.

## Public APIs

- Browser-safe: `.`, `./client`, `./module`, `./manifest-module`, `./manifest-facade`, `./style-module`, `./emitted-globals-module`, `./runtime`
- Node/build-only: `./node`, `./manifest-loader-plugin`

## Validation

```sh
pnpm --filter @master/css-integration test
pnpm --filter @master/css-integration type-check
pnpm --filter @master/css-integration build
pnpm --filter @master/css-integration lint
```
