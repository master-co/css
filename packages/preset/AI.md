# AI Notes For `@master/css-preset`

## Responsibility

`@master/css-preset` owns the default Master CSS stylesheet source and generated `defaultPlan`. The public `@master/css` package re-exports these preset CSS entries and plan values through its facade.

## Inputs And Outputs

- Input: preset CSS source files, source utility definitions, default settings, and generated-plan script inputs.
- Output: `defaultPlan`, `index.css`, `base.css`, `theme.css`, `variants.css`, and `utilities.css`.

## Boundaries

- Keep default token, utility, managed keyframe, variant, and layer-statement source here.
- Do not put engine execution behavior, project plan discovery, or build integration behavior here.
- Regenerate `src/default-plan.ts` only when the source preset intentionally changes.
- The layer statement lives in `src/base.css` and must stay `@layer theme, base, defaults, components, utilities;`.

## Required Tests

```sh
pnpm --filter @master/css-preset test
pnpm --filter @master/css-preset type-check
pnpm --filter @master/css-preset build
```

Generated default-plan changes must be intentional and covered by preset or compiler tests.
