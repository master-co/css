# AI Notes For `xtask`

## Responsibility

Repository-only Rust orchestration for native/Wasm artifacts, generated binding
protocols, parity evidence, and release target staging.

Use `artifacts.rs` for build/staging, `codegen.rs` for generated contracts,
`parity.rs` for parity ledgers, and `main.rs` only for command routing. Never edit a
generated target to bypass codegen.

`build-wasm runtime` builds the engine binding with the `release-wasm` profile, which
optimizes every crate for size, and the default `full` feature into
`packages/binding-wasm-engine/artifacts`, for Node without a native binding and other
non-browser hosts. Browsers execute programs with the JavaScript engine
(`packages/engine-js`), so no browser Wasm is built, staged or released.
`build-wasm runtime --names` still builds the former browser module, without `full`,
with its name section into `target/wasm-size/runtime` for
`pnpm run report:runtime-wasm-size`. It uses the pinned nightly
`RUNTIME_WASM_TOOLCHAIN` (`artifacts.rs`, installed with `rust-src` on first use) to
rebuild the standard library with `panic = "immediate-abort"` and trimmed paths.
Native code and every other Wasm build keep the stable toolchain.
The engine Wasm binding allocates with talc instead of std's dlmalloc: 2.0 KB smaller under brotli and within 2% of its memory over
repeated ensure and delete cycles, for up to 3% slower startup in the runtime
benchmark.
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
