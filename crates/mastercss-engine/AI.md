# AI Notes For `mastercss-engine`

## Responsibility

Canonical Manifest v6 execution: class matching, values, selectors, conditions,
priority, resources, rule generation, snapshots, and transitions.

Sessions execute a `Program`. `compile_program` validates a manifest and encodes the
compiled program (`program.rs`); `EngineSession::create`/`from_manifest` compile,
encode and decode it, and `EngineSession::from_program` decodes a received encoding.
Both paths run `finish_program` for derived lookup state, so a host that starts from a
manifest executes exactly what a browser receiving the program executes. Sessions take
emitted globals as `EmittedGlobals` values; hosts that receive JSON use
`parse_emitted_globals`.

## Module Routing

- `session.rs`, `state.rs`: lifecycle, batch execution, snapshots, transition state.
- `utility.rs`, `value_syntax.rs`: utility lookup and value/declaration matching.
- `condition.rs`: custom media, variants, selectors, and conditional wrappers.
- `generation.rs`, `render.rs`: generated rule assembly and render IR.
- `resources.rs`, `stylesheet_resources.rs`: scoped variables and references.
- `manifest.rs`: manifest validation, compilation into a `Program`, and `finish_program`.
- `program.rs`: the versioned binary `Program` encoding; decoding checks every bound.
- `completion.rs`: completion-facing engine data.
- `decimal.rs`: numbers decided on their decimal digits; use it instead of `str::parse::<f64>()`, whose tables the runtime Wasm omits.
- `tests/`: lifecycle and syntax behavior; `tests.rs` owns broader unit coverage.

## Guardrails

Exact CSS bytes, layer placement, priority, selectors, resources, and native/Wasm
parity are behavioral contracts. Do not add host filesystem, DOM, or editor policy.

Token utility identity is (form, decoded prefix, namespace); same-branch replacement is complete. Select the longest prefix, then a unique namespace by key before checking sign or opacity. Ambiguous keys emit no CSS. Retain requested classes without rules so refresh can restore them after ambiguity or missing-token changes. Metadata consumers use the resolved branch, never prefix alone.

`selector_class_names_without_rules()` lists classes that theme preludes and mixin or `@utility` body selectors (including conditions, `@apply` contents and `@contents` fallbacks) reference without generating rules themselves. Render appends them to hydration manifest `classNames` so client-toggled mode classes keep a progressive runtime's engine deferred; a class that generates rules must never appear there.

## Runtime Wasm Features

`diagnostic-messages`, `manifest` and `stylesheet-resources` are default features that the browser runtime Wasm disables. `manifest` compiles manifests into programs and parses JSON inputs; without it a session starts only from an encoded program and the program encoder is absent, so keep manifest parsing, validation and `serde_json` input on that side of the gate. Without `diagnostic-messages`, every verdict, code and control flow is unchanged but message and note text is empty: build new diagnostic or error text inside `message(|| ...)`. `stylesheet-resources` compiles keyframe slots, native stylesheet replay and rendered stylesheets, which only compiler and render hosts feed; gate code that only they reach. Check both builds with `cargo clippy -p mastercss-engine --no-default-features` and `pnpm run report:runtime-wasm-size`.

## Validation

```sh
cargo test -p mastercss-engine
cargo clippy -p mastercss-engine --all-targets --all-features -- -D warnings
cargo xtask parity
```
