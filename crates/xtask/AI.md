# AI Notes For `xtask`

## Responsibility

Repository-only Rust orchestration for native/Wasm artifacts, generated binding
protocols, parity evidence, and release target staging.

Use `artifacts.rs` for build/staging, `codegen.rs` for generated contracts,
`parity.rs` for parity ledgers, and `main.rs` only for command routing. Never edit a
generated target to bypass codegen.

`build-wasm runtime` builds the engine binding twice with the `release-wasm`
profile, which optimizes every crate for size: with the default `full` feature into
`packages/binding-wasm-engine/artifacts` for Node, and without it into
`packages/binding-wasm-engine/artifacts/runtime` for the binding's browser entry. It
then stages that Wasm into `packages/runtime/artifacts` for the CDN bundle and the
release asset. `build-wasm runtime --names` builds the browser module with its name
section into `target/wasm-size/runtime` for `pnpm run report:runtime-wasm-size`.
`opt-level "z"` is smaller still but measured about 18% slower in the runtime
benchmark. Compiler and tooling Wasm keep the `release` profile. Every Wasm surface
drops the name and producers sections, so browser stack traces show no Rust function
names; inspect a local unstripped build when debugging. Binaryen `wasm-opt` is not
part of the pipeline: its inlining grows brotli output, and without inlining it saved
only about 0.7% brotli, too little for another build dependency. Report raw/gzip/brotli sizes and
`pnpm run check:runtime-size` when changing this pipeline.

```sh
cargo test -p xtask
cargo xtask codegen --check
cargo xtask parity
```
