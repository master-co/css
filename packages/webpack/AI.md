# AI Notes For `@master/css.webpack`

## Responsibility

`@master/css.webpack` provides a Webpack extraction plugin based on `CSSScanner` and `webpack-virtual-modules`.

## Owns

- Webpack plugin integration.
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
- `src/style-css-loader.ts`
- `src/plugins/*`

## Risk Areas

- Module source detection depends on Webpack internals.
- Virtual module updates affect static CSS output.
- Tests are sparse, so behavior changes need coverage.
- Virtual module id behavior must stay compatible with configured scanner options.

## Safe Changes

- Focused Webpack plugin fixes.
- Virtual module tests.
- Loader behavior tests.

## Dangerous Changes

- Duplicating scanner logic here.
- Replacing `CSSScanner` as the source of extraction behavior.
- Changing virtual module id behavior casually.

## Validation

```sh
pnpm --filter @master/css.webpack test
pnpm --filter @master/css.webpack lint
pnpm --filter @master/css.webpack type-check
pnpm --filter @master/css.webpack build
```

Run the Webpack example build when plugin behavior changes.
