# AI Notes For `@master/css`

## Responsibility

`@master/css` is the core engine. It resolves config, matches class syntax, creates `Utility` objects, resolves values/variables/functions/selectors/at-rules/modes, inserts rules into cascade layers, and emits CSS text. Pure config contracts live in `shared/css-config`; core re-exports and interprets them.

## Inputs And Outputs

- Input: `Config`, class names, selector text.
- Output: `MasterCSS` state, utility objects, layer state, CSS text.

## Public APIs

The package exports core classes, config, types, factories, and utilities from `src/index.ts`. Treat changes to exports as public API changes.

Important public symbols include:

- `MasterCSS`
- `createCSS`
- `Utility`
- `UtilityType`
- `Layer`, `UtilityLayer`, `NonLayer`
- `VariableRule`, `AnimationRule`
- config and config sections
- parser/generator utilities
- config and syntax types

## Core Files

- `src/core.ts`
- `src/utility.ts`
- `src/factories/with-utility-layer.ts`
- `src/config/utilities.ts`
- `src/config/variables.ts`
- `src/config/modes.ts`
- `src/utils/compare-rule-priority.ts`
- `src/utils/parse-at.ts`
- `src/utils/generate-at.ts`
- `src/utils/parse-selector.ts`
- `src/utils/generate-selector.ts`
- `src/utils/extend-config.ts`
- `src/utils/parse-value.ts`

## Allowed Changes

- Focused bug fixes with tests.
- New utility coverage.
- New utilities when behavior is clear and documented by tests.
- Refactors that preserve generated CSS output.

## Forbidden Without Explicit Request

- Changing package exports casually.
- Changing layer order.
- Broad rewrites of parser, matcher, or priority code.
- Removing validation coverage.
- Updating snapshots/fixtures without explaining the output change.

## Risk Areas

- Utility matching order in `MasterCSS.match()`.
- `Utility.parseValues()` and `resolveValue()`.
- Variable alias and mode resolution.
- Selector and at-rule parsing.
- `compare-rule-priority.ts`.
- Component expansion and fixed-class output.
- `config/utilities.ts`, because small matcher/type changes can affect many classes.

## Required Tests

Use focused tests first:

```sh
pnpm --filter @master/css test
pnpm --filter @master/css type-check
pnpm --filter @master/css build
```

Add or update tests in:

- `tests/rules`
- `tests/utils`
- `tests/config`
- `tests/layers`
- `tests/rule-priority.test.ts`
- `tests/render.test.ts`
- `tests/__snapshots__` only for intentional snapshot changes

## Good Changes

- Add a regression test for a class that parses incorrectly.
- Fix a specific selector generation bug and test the exact selector.
- Add a missing variable resolution case with expected CSS output.

## Dangerous Changes

- Reordering `AT_IDENTIFIERS`.
- Changing `UtilityType` values.
- Changing layer names or layer statement.
- Making extraction/runtime-specific assumptions in core.
