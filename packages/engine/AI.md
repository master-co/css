# AI Notes For `@master/css-engine`

## Responsibility

`@master/css-engine` executes `MasterCSSManifest` values. It owns class matching, value parsing, selector and condition parsing/generation, variable and animation insertion, cascade layers, rule priority sorting, hydration manifest generation, CSS text emission, and built-in registries.

## Owns

- `MasterCSS` execution and rule generation.
- Tooling-only semantic class inspection under `./inspect`, including generated rules, class base/suffix, key/value tokens, matcher type metadata, important/state metadata, and token-backed variable metadata.
- Layer state and generated CSS text.
- Hydration manifest generation.
- Built-in key aliases, variable namespaces, namespace refs, and native value namespaces.
- Compiler-only parse/generate/inspection helpers under `./compiler`.

## Does Not Own

- CSS-first authoring or manifest lowering; use `@master/css-compiler`.
- Default preset source or generated default manifest; use `@master/css-preset`.
- Project discovery, CSS import graphs, runtime DOM behavior, server rendering, scanning, language tooling, ESLint, examples, or site docs.
- Manifest-provided key aliases or native namespace registries; those are engine built-ins.

## Public Surface

- `MasterCSS`
- `MasterCSS.create({ manifest, emittedGlobals })`
- `compareRulePriority`
- `createHydrationManifest`
- Built-in registry exports
- Runtime-safe manifest and generated-rule types
- `./inspect` tooling helpers
- `./compiler` helpers

## Key Files

- `src/core.ts`
- `src/utility.ts`
- `src/compile-manifest.ts`
- `src/layer.ts`
- `src/utility-layer.ts`
- `src/theme-layer.ts`
- `src/hydration-manifest.ts`
- `src/key-aliases.ts`
- `src/native-value-namespaces.ts`
- `src/namespaces.ts`

## Risk Areas

- Class matching and compiled utility order.
- `src/core.ts` and root value exports are runtime-covered because `@master/css-runtime` extends `MasterCSS`.
- Value, selector, and condition parsing/generation.
- Priority sorting and cascade layer insertion.
- Variable, animation, emittedGlobals, and hydration behavior.
- Any CSS output or cascade order difference.

## Safe Changes

- Focused parser, matching, priority, layer, variable, animation, or CSS output fixes with engine tests.
- Built-in registry fixes that preserve manifest payload expectations.

## Dangerous Changes

- Moving compiler, runtime, scanner, language, or integration behavior into engine.
- Adding lint, language, docs, or compiler-only helpers to `MasterCSS` or runtime-imported engine modules instead of an explicit tooling subpath.
- Serializing compiled indexes or caches into `MasterCSSManifest` without browser payload measurement.
- Changing CSS output without explicit tests and explanation.

## Validation

```sh
pnpm --filter @master/css-engine test
pnpm --filter @master/css-engine lint
pnpm --filter @master/css-engine type-check
pnpm --filter @master/css-engine build
```

## Benchmark Guidance

Run `pnpm --filter @master/css-engine bench` when changing class matching, rule creation, generation, parsing, priority sorting, layer insertion, manifest loading, manifest compilation, or cache/index behavior. Correctness validation must run first. Report benchmark status, `dist/core.js` raw/gzip/brotli size risk, memory/cold-start/runtime CPU tradeoffs, and whether CSS output or cascade order changed. For runtime-covered core changes, also report likely `@master/css-runtime` browser bundle impact.
