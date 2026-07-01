# AI Notes For `@master/css.webpack`

## Responsibility

`@master/css.webpack` provides a Webpack integration plugin based on `CSSScanner`, `webpack-virtual-modules`, and build-tool runtime injection.

## Owns

- Webpack plugin integration.
- Runtime mode script injection and runtime/manifest preload for HTML assets emitted by the Webpack compilation.
- Virtual module update orchestration.
- Webpack style CSS loader behavior.

## Does Not Own

- Scanner extraction behavior.
- Engine CSS generation.
- Project manifest loading protocol.
- Framework-specific lifecycle behavior.

## Public Surface

- Root Webpack plugin export.

## Key Files

- `src/index.ts`
- `src/plugin.ts`
- `src/options.ts`
- `src/runtime.ts`
- `src/style-css-loader.ts`
- `src/plugins/*`

## Risk Areas

- Module source detection depends on Webpack internals.
- Virtual module updates affect static CSS output.
- Runtime HTML mutation only covers compilation HTML assets; do not claim devServer static file mutation.
- Script/preload tags must match Webpack output type: `modulepreload` for module output and `preload as="script"` for classic output.
- Tests are sparse, so behavior changes need coverage.
- Virtual module id behavior must stay compatible with configured scanner options.
- Runtime, preload, mode default, and cascade-layer changes must be audited against Vite, Next, Nuxt, and Astro so integration behavior does not drift.

## Safe Changes

- Focused Webpack plugin fixes.
- Virtual module tests.
- Loader behavior tests.

## Dangerous Changes

- Duplicating scanner logic here.
- Replacing `CSSScanner` as the source of extraction behavior.
- Changing virtual module id behavior casually.
- Injecting runtime through app source rewrites instead of Webpack asset/entry orchestration.

## Validation

```sh
pnpm --filter @master/css.webpack test
pnpm --filter @master/css.webpack lint
pnpm --filter @master/css.webpack type-check
pnpm --filter @master/css.webpack build
```

Run the Webpack example build when plugin behavior changes.
