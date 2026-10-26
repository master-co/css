# AI Notes For `mastercss-schema`

## Responsibility

Dependency-light serializable Rust contracts for manifests, engine transitions, and
compiler directives.

`manifest.rs`, `engine.rs`, and `directives.rs` are wire contracts consumed by native,
Wasm, and TypeScript schema surfaces. Keep behavior out of schema and validate every
shape/version change across generated bindings.

Types that the runtime engine deserializes must not use serde's internally tagged,
untagged or flattened derives: their buffered `Content` path adds a second
deserializer per recursive type to the runtime Wasm. Derive `Serialize` with the
tagged wire shape and deserialize through a `Raw*` struct with `try_from`, using
`tagged.rs` to report missing and other-variant fields with serde's messages.

`EmittedGlobals` counts are `NameCounts` (`name_counts.rs`): one sorted `Vec` with the
`BTreeMap` methods the workspace uses and the same JSON object. Runtime-reachable
types avoid `BTreeMap`, whose node code costs the runtime Wasm several KB.

```sh
cargo test -p mastercss-schema
cargo clippy -p mastercss-schema --all-targets --all-features -- -D warnings
cargo xtask codegen --check
```
