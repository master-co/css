# AI Notes For `@master/css-engine`

## Responsibility

`@master/css-engine` executes `MasterCSSManifest` values in Rust. It owns class matching, value parsing, selector and condition parsing/generation, variable and animation resources, cascade layers, rule priority sorting, hydration state, CSS text emission, and built-in registries. TypeScript is a session/backend shell only.

## Owns

- Rust engine-session execution and rule generation.
- Versioned inspection, transition, snapshot, layer, and resource IR.
- Layer state and generated CSS text.
- Hydration manifest generation.
- Built-in key aliases, variable namespaces, namespace refs, and native value namespaces.
- Native synchronous initialization under `./node` and universal native-to-runtime-Wasm initialization at the root.

## Does Not Own

- CSS-first authoring or manifest lowering; use `@master/css-compiler`.
- Default preset source or generated default manifest; use `@master/css-preset`.
- Project discovery, CSS import graphs, runtime DOM behavior, server rendering, scanning, language tooling, ESLint, examples, or site docs.
- Manifest-provided key aliases or native namespace registries; those are engine built-ins.

## Public Surface

- `createEngine({ manifest, emittedGlobals, backend? })`
- `createEngineSync({ manifest, emittedGlobals })` under `./node`
- `MasterCSSEngine` session methods and Rust-owned IR/schema types

## Key Files

- `src/create-engine.ts`
- `src/node.ts`
- `src/backend.ts`
- `src/bound-engine.ts`
- `crates/mastercss-engine/src/lib.rs`

## Risk Areas

- Class matching and compiled utility order.
- Runtime Wasm surface size and session initialization.
- Value, selector, and condition parsing/generation.
- Priority sorting and cascade layer insertion.
- Variable, animation, emittedGlobals, and hydration behavior.
- Any CSS output or cascade order difference.

## Safe Changes

- Focused parser, matching, priority, layer, variable, animation, or CSS output fixes with engine tests.
- Built-in registry fixes that preserve manifest payload expectations.

## Dangerous Changes

- Moving compiler, runtime, scanner, language, or integration behavior into engine.
- Adding lint, language, docs, or compiler-only operations to the runtime engine surface.
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
