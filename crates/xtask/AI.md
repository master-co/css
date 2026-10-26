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
Both browser module builds use the pinned nightly `RUNTIME_WASM_TOOLCHAIN`
(`artifacts.rs`, installed with `rust-src` on first use) to rebuild the standard
library with `panic = "immediate-abort"` and trimmed paths, so no panic formatting,
location or Unicode escape table is linked (about 8 KB brotli). Panics there trap as
`RuntimeError: unreachable` without a message; reproduce them with the full build or
native to see it. The rebuilt `core`, `alloc`, `std` and `dlmalloc` keep opt-level 3
like the prebuilt library: `s` measured 1.5 KB larger under brotli and 13% slower
empty-page startup, `z` larger still. Fat LTO measured no smaller. The runtime build
goes to `target/wasm-runtime`, apart from stable outputs. Native code and every other
Wasm build keep the stable toolchain.
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
