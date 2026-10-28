# AI Notes For `xtask`

## Responsibility

Repository-only Rust orchestration for native/Wasm artifacts, generated binding
protocols, parity evidence, and release target staging.

Use `artifacts.rs` for build/staging, `codegen.rs` for generated contracts,
`parity.rs` for parity ledgers, and `main.rs` only for command routing. Never edit a
generated target to bypass codegen.

`build-native` builds the native binding and CLI into `packages/binding/artifacts`
with the `native-dev` profile, which turbo's `build:artifacts` runs for every local
package build; `--release` uses `release` for staging and publishing. `native-dev` is
release optimization without LTO, with incremental compilation: measured on the site,
it runs as fast as `release` (opt-level 0 was about five times slower) and rebuilds an
edited crate in seconds instead of about a minute.

`build-wasm engine` (the default) builds the engine binding with the `release-wasm`
profile, which optimizes every crate for size, into
`packages/binding-wasm-engine/artifacts`, for Node without a native binding and other
non-browser hosts. Browsers execute programs with the JavaScript engine
(`packages/engine-js`), so no browser Wasm is built, staged or released, and every
Wasm build uses the stable toolchain in `rust-toolchain.toml`. The profile's
settings were measured on the former browser runtime Wasm: `opt-level "z"` was
smaller still but about 18% slower. Compiler and tooling Wasm keep the `release`
profile. Every Wasm surface drops the name and producers sections, so stack traces
show no Rust function names; inspect a local unstripped build when debugging.
Binaryen `wasm-opt` is not part of the pipeline: its inlining grew brotli output, and
without inlining it saved only about 0.7% brotli, too little for another build
dependency. Report raw/gzip/brotli sizes when changing this pipeline.

```sh
cargo test -p xtask
cargo xtask codegen --check
cargo xtask parity
```
