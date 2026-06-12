# AI Notes For `@master/css.figma`

## Responsibility

This package implements a Figma plugin for importing and exporting Master CSS variables and modes.

## Main Files

- `src/plugin.min.ts`
- `src/features/getCollectionVariables.ts`
- `src/features/setCollectionVariables.ts`
- `src/utils/parse-color-value.ts`
- `src/utils/to-color-value.ts`
- `src/*variables*.tsx`

## Risks

- Figma API shape and async behavior.
- Color conversion precision and color spaces.
- Variable alias handling is limited.
- Import/export must preserve variable data structure.

## Rules

- Do not silently drop variables.
- Warn clearly for unsupported aliases.
- Add tests for variable/color conversion changes.

## Validation

```sh
pnpm --filter @master/css.figma test
pnpm --filter @master/css.figma build
pnpm --filter @master/css.figma type-check
```
