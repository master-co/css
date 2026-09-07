# AI Notes For `mastercss-engine`

## Responsibility

Canonical Manifest v1 execution: class matching, values, selectors, conditions,
priority, resources, rule generation, snapshots, and transitions.

## Module Routing

- `session.rs`, `state.rs`: lifecycle, batch execution, snapshots, transition state.
- `utility.rs`, `value_syntax.rs`: utility lookup and value/declaration matching.
- `condition.rs`: modes, selectors, and conditional wrappers.
- `generation.rs`, `render.rs`: generated rule assembly and render IR.
- `resources.rs`, `stylesheet_resources.rs`: variables, animations, and references.
- `manifest.rs`: manifest indexes and normalization.
- `completion.rs`: completion-facing engine data.
- `tests/`: lifecycle and syntax behavior; `tests.rs` owns broader unit coverage.

## Guardrails

Exact CSS bytes, layer placement, priority, selectors, resources, and native/Wasm
parity are behavioral contracts. Do not add host filesystem, DOM, or editor policy.

## Validation

```sh
cargo test -p mastercss-engine
cargo clippy -p mastercss-engine --all-targets --all-features -- -D warnings
cargo xtask parity
```
