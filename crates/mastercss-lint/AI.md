# AI Notes For `mastercss-lint`

## Responsibility

Canonical class ordering, conflict detection, compose checks, partial conflicts,
recommendations, and lint session/edit IR.

Route class-list behavior to `class_list.rs`, ordering to `order.rs`, conflicts to
`conflicts.rs`/`partial_conflicts.rs`, compose to `compose.rs`, and session behavior to
`session*.rs`. ESLint only adapts Rust diagnostics and edits to AST ranges.

```sh
cargo test -p mastercss-lint
cargo clippy -p mastercss-lint --all-targets --all-features -- -D warnings
pnpm --filter @master/eslint-plugin-css test
```
