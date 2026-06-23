# AI Notes For `@master/css-runtime`

## Responsibility

`@master/css-runtime` runs Master CSS in the browser. It observes DOM class changes, creates or hydrates `style#master-css`, tracks class usage counts, registers emittedGlobals global CSS counts, and inserts/removes native CSS rules.

## Owns

- Browser runtime lifecycle.
- DOM observation and class tracking.
- Runtime layer state and native stylesheet insertion/deletion.
- Hydration of pre-rendered CSS rules.
- Global runtime bundle and registration behavior.

## Does Not Own

- Core parser or CSS generation semantics.
- Framework provider lifecycle.
- Build integration injection policy.
- Server rendering.

## Public Surface

- `CSSRuntime`
- `CSSRuntime.create({ manifest, root, emittedGlobals, hydrationManifest })`
- `CSSRuntime#loadHydrationManifest()`
- `CSSRuntime#observe()`
- `RuntimeUtilityLayer`
- Runtime types

## Key Files

- `src/core.ts`
- `src/class-tracker.ts`
- `src/layer.ts`
- `src/utility-layer.ts`
- `src/css-runtime.ts`
- `src/global.min.ts`
- `src/register-global.ts`

## Risk Areas

- `MutationObserver` diff logic.
- `classCounts` increment/decrement behavior.
- emittedGlobals variable/keyframe counts preventing duplicate global insertion without suppressing utility insertion.
- Hydrating `CSSLayerBlockRule` and `CSSKeyframesRule`.
- Matching generated rule text to native `CSSRule` text.
- ShadowRoot versus Document behavior.
- Native `CSSStyleSheet` insertion indexes.

## Safe Changes

- Focused lifecycle fixes.
- Hydration fixes with progressive e2e coverage.
- Runtime insertion/deletion fixes with browser tests.

## Dangerous Changes

- Deleting rules by guessed indexes.
- Rehydrating without comparing generated CSS text.
- Removing class count tracking or hydration error checks.
- Changing FOUC behavior without integration validation.
- Changing global names `MasterCSSRuntime` or `masterCSSRuntime` casually.

## Validation

```sh
pnpm --filter @master/css-runtime e2e
pnpm --filter @master/css-runtime lint
pnpm --filter @master/css-runtime type-check
pnpm --filter @master/css-runtime build
```

Use or extend `e2e/lifecycle.test.ts`, `e2e/class-usages.test.ts`, `e2e/progressive/**`, and issue-specific browser regressions.

## Benchmark Guidance

Run `pnpm --filter @master/css-runtime bench` when changing DOM observation, class tracking, lifecycle behavior, hydration, runtime layer insertion/deletion, CSSOM mutation, or the global browser bundle. Correctness e2e should remain browser correctness, not timing assertions. Report benchmark status, global runtime asset impact, memory/cold-start/runtime CPU/CSSOM tradeoffs, and whether generated CSS output, progressive hydration, or fallback hydration changed.
