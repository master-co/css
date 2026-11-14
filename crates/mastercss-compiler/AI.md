# AI Notes For `mastercss-compiler`

## Responsibility

Canonical CSS directive parsing, import/native-style handling, Manifest v6 lowering,
and compiler report IR.

## Module Routing

- `directives.rs`, `syntax.rs`, `mixins.rs`, `theme.rs`, `variant.rs`: authoring IR.
- `imports.rs`, `native_style.rs`: import and native CSS processing. `theme.rs` owns token registration and modes.
- `manifest/`: normalization, preset merge, mixins, variants, and variables.
- `lower/`: public lowering API, resolution, merge, render, and focused tests.
- `pattern.rs`: pattern semantics shared by compiler domains.
- `graph_memo.rs`: process-wide reuse of identical JSON graph requests for the native and Wasm bindings.
- `manifest_store.rs`: content-addressed manifests that graph requests pass and return as `{"$ref": key}` (`manifestRefs`), so per-stylesheet requests stop carrying the project and reference manifests. Keys name immutable entries; an evicted key fails with `UNKNOWN_MANIFEST_REFERENCE` and the host resends the manifest.
- `lower/memo.rs`: reuse of a lowering (both manifests plus the resolution engine) onto stored manifests for an identical manifest input; most local stylesheets declare none.

## Guardrails

TypeScript supplies files and package resolution; Rust remains the semantic source.
Directive behavior changes require compiler tests and the public directive guide.
`@theme` accepts only ordered custom properties. Keyframes remain native CSS with per-file preserve/prune policy.
Tokens use `:root,:host`; static retains them and inline substitutes values once in
Master-generated declarations. Native custom properties do not register tokens.

## Validation

```sh
cargo test -p mastercss-compiler
cargo clippy -p mastercss-compiler --all-targets --all-features -- -D warnings
bun run --filter @master/css-compiler test
```
