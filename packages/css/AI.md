# AI Notes For `@master/css`

## Responsibility

`@master/css` is the public Manifest v1 execution surface. It binds the canonical Rust
engine through native or runtime-Wasm bindings and exposes the stable preset CSS
entrypoints.

## Owns

- Public engine session creation and binding selection.
- Bound engine state and transition application.
- Public schema/type exports required by engine consumers.
- Ambient virtual-module declarations exposed through `./client`.
- CSS proxies for `index.css`, `base.css`, `theme.css`, `variants.css`, and
  `utilities.css`.

## Does Not Own

- Class, value, selector, condition, priority, layer, variable, or animation semantics;
  those stay in Rust.
- CSS directive lowering, project loading, stylesheet composition, or diagnostics;
  use `@master/css-compiler`.
- Extraction, scanning, validation, lint, or language analysis; use
  `@master/css-tooling`.
- Runtime DOM observation; use `@master/css-runtime`.

## Public Surface

- `createEngine()` from `.` for universal async loading.
- `createEngineSync()` from `./node` for native-only Node loading.
- Manifest v1, generated rule, engine state, and emitted-global types.
- Virtual manifest, emitted-global, and generated CSS declarations from `./client`.
- Stable CSS subpaths listed above.

Do not restore legacy Config APIs, semantic TypeScript helpers, engine deep imports,
or compatibility subpaths.

## Key Files

- `src/index.ts`
- `src/node.ts`
- `src/engine/binding.ts`
- `src/engine/bound-engine.ts`
- `src/engine/create-engine.ts`
- `src/*.css`
- `crates/mastercss-engine/AI.md`

## Risk Areas

- Native/Wasm behavior divergence.
- Engine state disposal and refresh.
- Generated CSS bytes, layer order, priority, variables, animations, and snapshots.
- Accidentally widening the public API or pulling tooling/compiler code into runtime
  consumers.

## Validation

```sh
pnpm --filter @master/css test
pnpm --filter @master/css lint
pnpm --filter @master/css type-check
pnpm --filter @master/css build
```

Run Rust engine parity and downstream runtime/server checks for semantic or output
changes.
