# AI Notes For `@master/css.webpack`

## Responsibility

This package provides a Webpack extraction plugin based on `CSSExtractor` and `webpack-virtual-modules`.

## Main File

- `src/index.ts`

## Risks

- Module source detection depends on Webpack internals.
- Virtual module updates affect static CSS output.
- Tests are sparse, so add coverage before changing behavior.

## Rules

- Do not duplicate extractor logic here.
- Preserve `CSSExtractor` as the source of extraction behavior.
- Keep virtual module ID behavior compatible with configured extractor options.

## Validation

```sh
pnpm --filter @master/css.webpack build
pnpm --filter @master/css.webpack type-check
pnpm --filter @master/css.webpack lint
```

Run the Webpack example build when plugin behavior changes.

