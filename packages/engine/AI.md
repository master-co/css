# AI Notes For `@master/css-engine`

## Responsibility

`@master/css-engine` executes `MasterCSSPlan` values. It owns class matching, value parsing, selector and at-rule parsing/generation, variable and animation insertion, cascade layers, rule priority sorting, runtime manifest generation, and CSS text emission.

## Inputs And Outputs

- Input: `MasterCSSPlan`, class names, optional preloaded variable/keyframe counts.
- Output: `MasterCSS` instances, generated rules, layer state, runtime manifests, and CSS text.

## Public APIs

- `MasterCSS`
- `createCSS(plan, preloaded?)`
- `compareRulePriority`
- `createRuntimeManifest`
- `./compiler` helpers for compiler-only parse/generate/inspection use
- runtime-safe `MasterCSSPlan` and generated-rule types

## Boundaries

- Do not depend on compiler, integration contracts, runtime, server, extractor, language service, ESLint, examples, or site.
- Do not resolve project CSS entries, CSS import graphs, package stylesheet imports, or CSS plan directives here.
- Keep `MasterCSSPlan` execution behavior here; keep CSS-first authoring and plan lowering in `@master/css-compiler`.
- Keep default preset source and generated default plan ownership in `@master/css-preset`.

## Required Tests

```sh
pnpm --filter @master/css-engine test
pnpm --filter @master/css-engine type-check
pnpm --filter @master/css-engine build
```

Add focused tests for parser, selector, at-rule, value, priority, layer, variable, animation, and CSS output changes.
