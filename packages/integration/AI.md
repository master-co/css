# AI Notes For `@master/css-integration`

## Responsibility

`@master/css-integration` owns adapter-neutral contracts shared by official build and framework integrations.

## Owns

- Virtual module ids and `?master-css-manifest` request helpers.
- Generated manifest and emittedGlobals module source helpers.
- Ambient client module declarations.
- Explicit Node helper subpaths.

## Does Not Own

- Vite, Next, Webpack, Nuxt, Astro, or framework lifecycle behavior.
- Project manifest discovery or CSS import graph resolution.
- Extraction, runtime hydration, server rendering, scanner state, or compiler lowering.
- Browser runtime boot code.
- Browser-safe helpers that import `node:*`, use `Buffer`, or read `process`.

## Public Surface

- Browser-safe: `.`, `./client`, `./module`, `./manifest-module`, `./manifest-facade`, `./style-module`, `./emitted-globals-module`.
- Node-only: `./node`.

## Key Files

- `src/index.ts`
- `src/module.ts`
- `src/manifest-module.ts`
- `src/manifest-facade.ts`
- `src/style-module.ts`
- `src/emitted-globals-module.ts`
- `src/node.ts`

## Risk Areas

- Browser-safe versus Node-only subpath boundaries.
- Virtual id and generated import specifier compatibility.
- Keeping the package dependency-light and adapter-neutral.
- Shared protocol changes affecting multiple integrations.

## Safe Changes

- Protocol helper fixes with downstream-aware tests.
- Node-only path/hash/resolved-id fixes isolated under `./node`.

## Dangerous Changes

- Depending on scanner, compiler, runtime, server, build adapters, or frameworks.
- Moving project discovery or import graph behavior here.
- Adding Node globals to browser-safe subpaths.

## Validation

```sh
pnpm --filter @master/css-integration test
pnpm --filter @master/css-integration lint
pnpm --filter @master/css-integration type-check
pnpm --filter @master/css-integration build
```
