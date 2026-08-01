# AI Notes For `mastercss-project`

## Responsibility

Canonical project entry/import graph policy and Manifest v1 merge orchestration.
TypeScript hosts supply filesystem and package resolution callbacks.

Read `src/lib.rs` with `src/tests.rs` and `packages/compiler/src/project/**`. Entry
markers, graph order, and merge order affect all compiler consumers.

```sh
cargo test -p mastercss-project
cargo clippy -p mastercss-project --all-targets --all-features -- -D warnings
pnpm --filter @master/css-compiler test
```
