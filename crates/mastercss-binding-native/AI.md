# AI Notes For `mastercss-binding-native`

## Responsibility

Native napi ABI adaptation. It groups engine, compiler, tooling, and render/scanner
bindings without owning their semantics.

Route to `engine.rs`, `compiler.rs`, `tooling.rs`, or `render_scanner.rs`; keep
`lib.rs` as assembly/export glue. Do not duplicate semantic fallback logic here.

```sh
cargo test -p mastercss-binding-native
cargo clippy -p mastercss-binding-native --all-targets --all-features -- -D warnings
cargo xtask codegen --check
```
