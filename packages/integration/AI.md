# AI Notes For `@master/css-integration`

## Responsibility

`@master/css-integration` owns the adapter-neutral contracts shared by official build and framework integrations: virtual module ids, `?master-css-plan` request helpers, generated plan/preloaded module source helpers, runtime injection source, and ambient client module declarations.

## Boundaries

- Keep this package dependency-light and adapter-neutral.
- This package may depend on `@master/css` for public types.
- Do not depend on Vite, Next, Webpack, Nuxt, Astro, Extractor, Runtime, Server, Configer, or Compiler.
- Do not implement project config discovery, CSS import graph resolution, extraction, runtime hydration, or framework lifecycle behavior here.
- Node filesystem helpers belong in `./node`; browser-safe helpers must not import `node:*`.

## Public APIs

- `./client`
- `./module`
- `./plan-module`
- `./style-module`
- `./preloaded-module`
- `./config-loader-plugin`
- `./runtime`
- `./node`

## Validation

```sh
pnpm --filter @master/css-integration test
pnpm --filter @master/css-integration type-check
pnpm --filter @master/css-integration build
pnpm --filter @master/css-integration lint
```
