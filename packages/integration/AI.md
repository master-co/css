# AI Notes For `@master/css-build-internal`

## Responsibility

`@master/css-build-internal` owns adapter-neutral contracts shared by official build and framework integrations. It is repository-private and bundled into published consumers.

## Owns

- Virtual module ids and `?master-css-manifest` request helpers.
- Generated manifest and emittedGlobals module source helpers.
- Explicit Node helper subpaths.

## Does Not Own

- Vite, Next, Webpack, Nuxt, Astro, or framework lifecycle behavior.
- Project manifest discovery or CSS import graph resolution.
- Extraction, runtime hydration, server rendering, scanner state, or compiler lowering.
- Browser runtime boot code.
- Public ambient module declarations; `@master/css/client` owns them.
- Browser-safe helpers that import `node:*`, use `Buffer`, or read `process`.

## Internal Surface

- Browser-safe: `.`, `./module`, `./manifest-module`, `./manifest-facade`, `./style-module`, `./emitted-globals-module`.
- Node-only: `./node`.

These subpaths exist only for repository build boundaries. Do not document them as a
third-party API, publish this package, or leave its specifier in emitted JavaScript or
declarations.

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
- Accidentally exposing the package as a published dependency or third-party SPI.

## Safe Changes

- Protocol helper fixes with downstream-aware tests.
- Node-only path/hash/resolved-id fixes isolated under `./node`.

## Dangerous Changes

- Depending on scanner, compiler, runtime, server, build adapters, or frameworks.
- Moving project discovery or import graph behavior here.
- Adding Node globals to browser-safe subpaths.

## Validation

```sh
pnpm --filter @master/css-build-internal test
pnpm --filter @master/css-build-internal lint
pnpm --filter @master/css-build-internal type-check
pnpm --filter @master/css-build-internal build
```
