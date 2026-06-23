# AI Notes For `@master/css.figma`

## Responsibility

`@master/css.figma` implements the Figma plugin for importing and exporting Master CSS variables and modes.

## Owns

- Figma plugin entry and UI bundles.
- Variable collection import/export workflows.
- Color value parsing and conversion helpers.

## Does Not Own

- Core Master CSS variable semantics.
- Site docs or runtime behavior.
- Unsupported Figma alias behavior beyond clear warnings.

## Public Surface

- Figma plugin bundle.
- Import/export UI entrypoints.

## Key Files

- `src/plugin.min.ts`
- `src/features/getCollectionVariables.ts`
- `src/features/setCollectionVariables.ts`
- `src/utils/parse-color-value.ts`
- `src/utils/to-color-value.ts`
- `src/*variables*.tsx`

## Risk Areas

- Figma API shape and async behavior.
- Color conversion precision and color spaces.
- Limited variable alias handling.
- Preserving variable data structure across import/export.

## Safe Changes

- Focused Figma API or UI fixes.
- Variable/color conversion tests.
- Clear unsupported-alias warnings.

## Dangerous Changes

- Silently dropping variables.
- Changing color conversion without tests.
- Treating unsupported aliases as successfully round-tripped.

## Validation

```sh
pnpm --filter @master/css.figma test
pnpm --filter @master/css.figma lint
pnpm --filter @master/css.figma type-check
pnpm --filter @master/css.figma build
```
