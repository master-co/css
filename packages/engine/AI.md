# AI Notes For `@master/css-engine`

## Responsibility

`@master/css-engine` executes `MasterCSSPlan` values. It owns class matching, value parsing, selector and at-rule parsing/generation, variable and animation insertion, cascade layers, rule priority sorting, runtime manifest generation, CSS text emission, and the built-in key alias / variable namespace / native value namespace registry.

## Inputs And Outputs

- Input: `MasterCSSPlan`, class names, optional preloaded variable/keyframe counts.
- Output: `MasterCSS` instances, generated rules, layer state, runtime manifests, and CSS text.
- Built-ins: `builtinKeyAliases`, `builtinNamespaces`, `builtinNamespaceSet`, `builtinNamespaceRef`, and `builtinNativeValueNamespaces`.

## Public APIs

- `MasterCSS`
- `createCSS(plan, preloaded?)`
- `compareRulePriority`
- `createRuntimeManifest`
- Built-in registry exports for compiler, language tooling, docs, and tests
- `./compiler` helpers for compiler-only parse/generate/inspection use
- runtime-safe `MasterCSSPlan` and generated-rule types

## Boundaries

- Do not depend on compiler, integration contracts, runtime, server, extractor, language service, ESLint, examples, or site.
- Do not resolve project CSS entries, CSS import graphs, package stylesheet imports, or CSS plan directives here.
- Keep `MasterCSSPlan` execution behavior here; keep CSS-first authoring and plan lowering in `@master/css-compiler`.
- Keep default preset source and generated default plan ownership in `@master/css-preset`.
- Do not accept key aliases, builtin namespaces, or native value namespaces through `MasterCSSPlan`; these are engine built-ins only.

## Required Tests

```sh
pnpm --filter @master/css-engine test
pnpm --filter @master/css-engine type-check
pnpm --filter @master/css-engine build
```

Add focused tests for parser, selector, at-rule, value, priority, layer, variable, animation, and CSS output changes.
