# AI Notes For `@master/css-engine`

## Responsibility

`@master/css-engine` executes `MasterCSSManifest` values. It owns class matching, value parsing, selector and at-rule parsing/generation, variable and animation insertion, cascade layers, rule priority sorting, hydration manifest generation, CSS text emission, and the built-in key alias / variable namespace / native value namespace registry.

## Inputs And Outputs

- Input: `MasterCSSManifest`, class names, optional emittedGlobals variable/keyframe counts.
- Output: `MasterCSS` instances, generated rules, layer state, hydration manifests, and CSS text.
- Built-ins: `builtinKeyAliases`, `builtinNamespaces`, `builtinNamespaceSet`, `builtinNamespaceRef`, and `builtinNativeValueNamespaces`.

## Public APIs

- `MasterCSS`
- `createCSS(manifest, emittedGlobals?)`
- `compareRulePriority`
- `createHydrationManifest`
- Built-in registry exports for compiler, language tooling, docs, and tests
- `./compiler` helpers for compiler-only parse/generate/inspection use
- runtime-safe `MasterCSSManifest` and generated-rule types

## Boundaries

- Do not depend on compiler, integration contracts, runtime, server, extractor, language service, ESLint, examples, or site.
- Do not resolve project CSS entries, CSS import graphs, package stylesheet imports, or CSS manifest directives here.
- Keep `MasterCSSManifest` execution behavior here; keep CSS-first authoring and manifest lowering in `@master/css-compiler`.
- Keep default preset source and generated default manifest ownership in `@master/css-preset`.
- Do not accept key aliases, builtin namespaces, or native value namespaces through `MasterCSSManifest`; these are engine built-ins only.

## Required Tests

```sh
pnpm --filter @master/css-engine test
pnpm --filter @master/css-engine lint
pnpm --filter @master/css-engine type-check
pnpm --filter @master/css-engine build
```

Add focused tests for parser, selector, at-rule, value, priority, layer, variable, animation, and CSS output changes.

## Benchmark Guidance

Run `pnpm --filter @master/css-engine bench` when changing class matching, rule creation, generation, value parsing, selector parsing/generation, at-rule parsing/generation, priority sorting, layer insertion, manifest loading, manifest compilation, or cache/index behavior. Correctness validation must run before benchmark reporting.

For benchmark-relevant engine changes, report whether the benchmark ran, whether `dist/core.mjs` raw/gzip/brotli size is affected, and any memory, cold-start, or runtime CPU tradeoff. Also state whether CSS output or cascade order changed.

Do not put compiled matcher indexes, caches, or runtime-only acceleration data into `MasterCSSManifest` unless the browser payload impact is explicitly justified and measured.
