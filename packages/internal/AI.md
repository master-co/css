# AI Notes For `@master/css-internal`

## Responsibility

`@master/css-internal` owns adapter-neutral implementation shared by official build,
framework, editor, and tooling hosts. It is repository-private and bundled into
published consumers. It is not a general-purpose shared utility package.

## Owns

- Virtual module ids and `?master-css-manifest` / `?master-css-program` request helpers.
- Generated manifest, runtime program, emittedGlobals, and runtime-bootstrap module source helpers.
- Merging emittedGlobals of separate stylesheet hosts.
- Shared default project-manifest loading and the narrow manifest virtual-module plugin,
  which also serves `virtual:master-css-program` when its host passes a program compiler.
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
  `./program-module`, `./style-module`, `./emitted-globals-module`, `./runtime-bootstrap`,
  `./project`.
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
- `src/program-module.ts`
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
- Browsers receive runtime programs, never manifests: `virtual:master-css-program` is
  inline in development and server builds, and browser builds emit a
  `master-css-program.bin` asset that a fetch facade loads. Server rendering keeps
  `virtual:master-css-manifest`.
- Runtime bootstrap modes: progressive pages pass the program as a dynamic
  `import('virtual:master-css-program')` loader so a fully pre-rendered page never
  requests it; runtime mode imports it statically for its preload.
- Dependency/watch registration remaining stable when manifest compilation fails.
- Production manifest JSON (`toProductionManifestJSON`) omits `source` provenance, which only
  serves tooling and names build-host paths; production programs compile from it, and
  development modules keep it.
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
bun run --filter @master/css-internal test
bun run --filter @master/css-internal lint
bun run --filter @master/css-internal type-check
bun run --filter @master/css-internal build
```
