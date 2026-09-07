# AI Notes For `mastercss-schema`

## Responsibility

Dependency-light serializable Rust contracts for manifests, engine transitions, and
compiler directives.

`manifest.rs`, `engine.rs`, and `directives.rs` are wire contracts consumed by native,
Wasm, and TypeScript schema surfaces. Keep behavior out of schema and validate every
shape/version change across generated bindings.

```sh
cargo test -p mastercss-schema
cargo clippy -p mastercss-schema --all-targets --all-features -- -D warnings
cargo xtask codegen --check
```
