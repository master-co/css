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
- `decimal.rs`: numbers decided on their decimal digits, which keeps range checks exact; use it instead of `str::parse::<f64>()`. `packages/engine-js/src/value.ts` ports it.
- `hash.rs`: the `HashMap` and `HashSet` aliases every module uses, hashed with an FxHash-style hasher; build them with `default()`.
- `tests/`: lifecycle and syntax behavior; `tests.rs` owns broader unit coverage.

## Guardrails

Exact CSS bytes, layer placement, priority, selectors, resources, and native/Wasm
parity are behavioral contracts. Do not add host filesystem, DOM, or editor policy.

Token utility identity is (form, decoded prefix, namespace); same-branch replacement is complete. Select the longest prefix, then a unique namespace by key before checking sign or opacity. Ambiguous keys emit no CSS. Retain requested classes without rules so refresh can restore them after ambiguity or missing-token changes. Metadata consumers use the resolved branch, never prefix alone.

A token key resolves to its variable on demand through `utility::utility_variable`: explicit aliases first, then each `~namespace` reference in order, where the earliest declared variable whose namespace key is the key wins (`namespace_variable_names` inverts `get_variable_key_by_namespace`, and every candidate is checked forward). `finish_program` builds no per-utility token maps: mapping every variable of every token utility was nearly all of session creation. Tooling lists a utility's tokens with `utility_variable_entries`, which must keep the same precedence.

`class_names_without_rules_in(selectors)` returns the classes in the given selectors that generate no rules themselves. Render applies it to the page's generated rule `selectorText` (state classes such as `active`) and, through `selector_class_names_without_rules()`, to theme preludes and mixin or `@utility` body selectors (including conditions, `@apply` contents and `@contents` fallbacks). Both lists follow the rendered classes in hydration manifest `classNames`, so client-toggled state and mode classes keep a progressive runtime's engine deferred; a class that generates rules must never appear in either.

## Browser Engine

Browsers do not run this crate: `packages/engine-js` executes the same programs in JavaScript and must produce byte-identical results (`.ai/architecture.md#browser-engine`). A change to what sessions execute (matching, values, selectors, conditions, priority, ordering, mixins, resources, transitions, snapshots, emitted globals, the program encoding or `finish_program`) lands with the matching `packages/engine-js` change: run `bun run build:rust:wasm`, then `bun run --filter @master/css-engine-js differential` at zero differences, adding differential sources for new syntax. Retired syntax has no JavaScript counterpart.

Code that sessions run for each class joins text with `concat_text!` and `mastercss_lexer::text::decimal`, and short lists sort with a small insertion sort or a partition. Both were chosen for the former browser runtime Wasm; `format!` stays fine in diagnostics, tests and tooling-only modules such as `completion.rs`. `EngineError::message()` is the single source of error text, which `Display` also writes.

## Validation

```sh
cargo test -p mastercss-engine
cargo clippy -p mastercss-engine --all-targets --all-features -- -D warnings
cargo xtask parity
```
