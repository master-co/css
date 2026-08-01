# AI Notes For `xtask`

## Responsibility

Repository-only Rust orchestration for native/Wasm artifacts, generated binding
protocols, parity evidence, and release target staging.

Use `artifacts.rs` for build/staging, `codegen.rs` for generated contracts,
`parity.rs` for parity ledgers, and `main.rs` only for command routing. Never edit a
generated target to bypass codegen.

```sh
cargo test -p xtask
cargo xtask codegen --check
cargo xtask parity
```
