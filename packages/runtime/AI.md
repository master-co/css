# AI Notes For `@master/css-runtime`

## Responsibility

`@master/css-runtime` runs Master CSS in the browser. It observes DOM class changes, creates or hydrates `style#master-css`, tracks class usage counts, registers emittedGlobals global CSS counts, and inserts/removes native CSS rules.

`MasterCSSRuntime` hosts a Rust `@master/css-binding-wasm-engine` session. Any feature added to the runtime Wasm surface, runtime source, schema value constants, preset manifest loading, or other runtime-imported modules can enter the browser runtime bundle.

`cargo xtask build-wasm runtime` builds `artifacts/` with the `release-wasm` profile and without the binding's `full` feature, so the global bundle's engine module omits render sessions and inspection (calling them throws `WASM_FEATURE_UNAVAILABLE`, and its `bindingInfo().features` is `['engine']`); `tsdown.config.ts` pairs the bundled bindings with that module. Bundler applications load the complete `@master/css-binding-wasm-engine` artifact through `@master/css`, including after deferred startup. `pnpm run check:runtime-size` guards the global bundle, this Wasm, and the progressive critical path: `dist/index.js` bundled and minified without the lazily imported engine.

The engine is imported dynamically. On a progressive page whose `style#master-css` has a valid, non-empty hydration manifest, `start()` defers it: no engine module, Wasm or project manifest is loaded, the pre-rendered CSSOM stays untouched, and the runtime only tracks class usage against the hydration manifest's `classNames`: rendered rule-producing classes in rule order, rendered classes without rules, then rule-free classes that project manifest selectors reference, so page scripts can toggle mode classes such as `dark`. Startup replays them in that order; hydration then trusts the client engine's own snapshot IR and verifies it against `resourceOrder`, per-layer node counts and the CSSOM text. Deferred `snapshot().classRules` has usage counts and no rules. The first uncovered connected class, `ready()`, a rule API call, `refresh()` or `enginePrefetch: 'idle'` starts the engine. A deferred `refresh()` replaces the manifest source without calling the loader; during loading, `refresh()` and emitted-global registrations queue in order. Startup runs the existing hydration checks, ensures uncovered connected classes, and queues removal of hydrated classes that are no longer connected, in eager startup as well. A failed engine keeps rule APIs throwing `RUNTIME_ENGINE_NOT_READY`; `refresh()` or a new `start()` retries. `disconnect()` lets startup continue; `dispose()` cancels it and rejects `ready()` with `RUNTIME_DISPOSED`. Pages without that hydration data, and `engine: 'eager'`, start the engine during `start()`.

Runtime does not expose a global event bus or tooling observer API. Third-party class observation should use DOM `MutationObserver` or explicit public runtime state. Development debug helpers are internal and must remain development-only.

## Owns

- Browser runtime lifecycle.
- DOM observation and class tracking.
- DOM-facing layer state and native stylesheet insertion/deletion from Rust transition/resource IR.
- Hydration of pre-rendered CSS rules.
- Engine startup scheduling: deferred, loading, ready and failed states, idle startup, and operations queued until the engine is ready.
- Global runtime bundle and registration behavior.
- Internal development-only runtime debugging.

## Does Not Own

- Core parser or CSS generation semantics.
- Tooling-only engine inspection, lint, language, compiler, or docs helpers.
- Framework provider lifecycle.
- Build integration injection policy.
- Server rendering.

## Public Surface

- `MasterCSSRuntime`
- `MasterCSSRuntime.start({ manifest, root, emittedGlobals, hydrationManifest, engine, enginePrefetch })`; `manifest` may be an async loader.
- `ready()`, `observe()`, `disconnect()`, `refresh()`, immutable `snapshot()` including its `engine` state
- readonly-array rule ensure/delete methods; they throw `RUNTIME_ENGINE_NOT_READY` and start the engine until it is ready
- `binding`, `undefined` until the engine is ready
- Optional compiler-owned stylesheet bindings and official adapter asset delivery.
- `dispose()` / `Symbol.dispose`
- `withMasterCSSRuntime`
- readonly global `MasterCSSRuntime` and `masterCSSRuntime` facades

Mutable registries, DOM nodes, layers, and binding sessions are internal.

## Key Files

- `src/core.ts`
- `src/host.ts`
- `src/hydration.ts`
- `src/mutation.ts`
- `src/retention-config.ts`
- `src/startup.ts`
- `src/types.ts`
- `src/class-tracker.ts`
- `src/layer.ts`
- `src/utility-layer.ts`
- `src/css-runtime.ts`
- `src/global.min.ts`
- `src/register-global.ts`

## Risk Areas

- `MutationObserver` diff logic.
- `classCounts` increment/decrement behavior.
- emittedGlobals variable counts preventing duplicate global insertion without suppressing utility insertion.
- Hydrating generated `CSSLayerBlockRule` rules and keyframe resources by definition ID. Retain actual CSSOM parents and nodes for deletion. Native keyframes use compiler-owned slots at their original location; preserve anonymous-layer identity and conditional containers. HMR refreshes manifest and emitted-global ownership atomically.
- Matching generated rule text to native `CSSRule` text.
- The deferred-to-ready handoff: class counts recorded before startup, classes removed before startup, queued `refresh()`/`emittedGlobals`/keyframe reconciliation, and dispose during loading.
- Anything that loads the engine module, Wasm or project manifest before a progressive page needs them.
- ShadowRoot versus Document behavior.
- Native `CSSStyleSheet` insertion indexes.
- Engine core growth that is not required for runtime execution.
- Compiler/tooling Wasm accidentally entering the runtime bundle.
- Accidental growth of runtime-covered value dependencies that are neither runtime core nor intentional observability.

## Constraints

- Derive CSSOM deletion indexes from tracked state.
- NativeStylesheets only owns declared adapter asset URLs or explicit sheet/owner bindings. Companion JSON contains Rust-serialized CSS URL placeholders; browser code only resolves URLs and installs CSS. Preserve complete imported sheets and anonymous layers. Never parse animation semantics in TypeScript.
- Compare generated CSS text when rehydrating.
- While the engine is deferred, do not mutate the CSSOM and do not implement generation, deletion or resource counting in TypeScript; record usage and let the engine reconcile it at startup.
- Preserve class count tracking and hydration error checks.
- Validate integration behavior when changing FOUC handling.
- Treat global names `MasterCSSRuntime` and `masterCSSRuntime` as public contracts.
- Keep tooling-only operations out of `MasterCSSRuntime` and the Wasm engine.
- Keep build-time-only config imports and tooling helpers out of browser runtime dependencies.

## Validation

For behavior changes, use the focused tests below. Run lint for package changes; type-check/build when types or package output change. AI-guidance-only edits need lint and the root context check.

```sh
pnpm --filter @master/css-runtime e2e
pnpm --filter @master/css-runtime lint
pnpm --filter @master/css-runtime type-check
pnpm --filter @master/css-runtime build
```

Use or extend `e2e/lifecycle.test.ts`, `e2e/class-usages.test.ts`, `e2e/hydration-edge-cases.test.ts`, `e2e/wasm-startup.test.ts`, `e2e/progressive/**`, and issue-specific browser regressions. Deferred-engine tests assert network requests: a fully pre-rendered page must not request the engine module, Wasm or project manifest.

## Benchmark Guidance

For runtime implementation changes, run `pnpm --filter @master/css-runtime bench` when changing DOM observation, class tracking, lifecycle behavior, hydration, runtime layer insertion/deletion, CSSOM mutation, or the global browser bundle. Correctness e2e should remain browser correctness, not timing assertions. Report benchmark status, global runtime asset impact, memory/cold-start/runtime CPU/CSSOM tradeoffs, and whether generated CSS output, progressive hydration, or fallback hydration changed. For progressive changes, also report the deferred critical-path size and the first engine-startup latency.

## Bundle Audit Notes

When auditing `dist/global.min.js`, the removed devtools hook global, generic listener maps, and runtime event emit callsites must not be present. Build-time-only config imports in `tsdown.config.ts` are not browser runtime bundle surface.
