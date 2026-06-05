# AI Notes For `@master/css-runtime`

## Responsibility

`@master/css-runtime` runs Master CSS in the browser. It observes DOM class changes, creates or hydrates `style#master`, tracks class usage counts, registers preloaded global CSS counts, and inserts/removes native CSS rules.

## Inputs And Outputs

- Input: `Document` or `ShadowRoot`, optional config, optional preloaded variable/keyframe counts, connected DOM classes, mutation records, pre-rendered CSS rules.
- Output: live `style#master` stylesheet, runtime layer state, hydrated virtual rules, devtools events.

## Public APIs

- `CSSRuntime`
- `initCSSRuntime({ config, root, autoObserve, preloaded })`
- `RuntimeUtilityLayer`
- runtime types

## Core Files

- `src/core.ts`
- `src/layer.ts`
- `src/utility-layer.ts`
- `src/init.ts`
- `src/register-global.ts`
- `src/global.min.ts`

## Allowed Changes

- Focused lifecycle fixes.
- Hydration fixes with progressive e2e coverage.
- Runtime insertion/deletion fixes with browser tests.

## Forbidden Without Explicit Request

- Changing core parser behavior here.
- Changing global names (`CSSRuntime`, `cssRuntime`) casually.
- Removing hydration error checks.
- Changing FOUC behavior without integration validation.

## Risk Areas

- `MutationObserver` diff logic.
- `classCounts` increment/decrement behavior.
- Preloaded variable/keyframe counts must prevent duplicate runtime insertion without suppressing utility insertion.
- Hydrating CSSLayerBlockRule and CSSKeyframesRule.
- Matching generated rule text to native CSSRule text.
- ShadowRoot vs Document behavior.
- Native CSSStyleSheet insertion indexes.

## Required Tests

```sh
pnpm --filter @master/css-runtime e2e
pnpm --filter @master/css-runtime type-check
pnpm --filter @master/css-runtime build
```

Use or extend:

- `e2e/lifecycle.test.ts`
- `e2e/class-usages.test.ts`
- `e2e/progressive/**`
- `tests/issues/*.test.ts` for issue-specific browser regressions

## Good Changes

- Fix a class removal leak and add a lifecycle e2e test.
- Fix hydration of a pre-rendered variable rule with a progressive fixture.

## Dangerous Changes

- Deleting rules by guessed indexes.
- Rehydrating without comparing generated CSS text.
- Removing class count tracking.
