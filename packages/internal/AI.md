# AI Notes For `@master/css-internal`

## Responsibility

`@master/css-internal` owns adapter-neutral implementation shared by official build,
framework, editor, and tooling hosts. It is repository-private and bundled into
published consumers. It is not a general-purpose shared utility package.

## Owns

- Virtual module ids and `?master-css-manifest` request helpers.
- Generated manifest, emittedGlobals, and runtime-bootstrap module source helpers.
- Shared default project-manifest loading and the narrow manifest virtual-module plugin.
- Default build manifest and manifest-entry request helpers.
- Explicit Node virtual-path/hash helpers.
- Official-host workspace package and directory discovery.

## Does Not Own

- Vite, Next, Webpack, Nuxt, Astro, or framework lifecycle behavior.
- Compiler-owned project discovery or CSS import graph semantics.
- Extraction, runtime hydration, server rendering, scanner state, or compiler lowering.
- DOM runtime lifecycle or runtime semantics.
- Public ambient module declarations; `@master/css/client` owns them.
- Browser-safe helpers that import `node:*`, use `Buffer`, or read `process`.

## Internal Surface

- Browser-safe: `.`, `./module`, `./manifest-module`, `./manifest-facade`,
  `./style-module`, `./emitted-globals-module`, `./runtime-bootstrap`, `./project`.
- Node-only: `./node`, `./manifest-loader`, `./manifest-virtual-module`,
  `./workspace`, `./workspace-directories`.

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
- `src/runtime-bootstrap.ts`
- `src/project.ts`
- `src/node.ts`
- `src/workspace.ts`
- `src/workspace-directories.ts`

## Risk Areas

- Browser-safe versus Node-only subpath boundaries.
- Virtual id and generated import specifier compatibility.
- Keeping the package dependency-light and adapter-neutral.
- Shared protocol changes affecting multiple integrations.
- Dependency/watch registration remaining stable when manifest compilation fails.
- Accidentally exposing the package as a published dependency or third-party SPI.
- Turning the package into a generic home for unrelated repository helpers.

## Safe Changes

- Protocol helper fixes with downstream-aware tests.
- Node-only path/hash/resolved-id fixes isolated under `./node`.

## Dangerous Changes

- Depending on scanner, compiler, runtime, server, build adapters, or frameworks.
- Reimplementing compiler-owned project discovery or import graph semantics here.
- Adding Node globals to browser-safe subpaths.

## Validation

```sh
pnpm --filter @master/css-internal test
pnpm --filter @master/css-internal lint
pnpm --filter @master/css-internal type-check
pnpm --filter @master/css-internal build
```
