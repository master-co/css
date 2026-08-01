# AI Notes For `mastercss-compiler`

## Responsibility

Canonical CSS directive parsing, import/native-style handling, Manifest v1 lowering,
and compiler report IR.

## Module Routing

- `directives.rs`, `syntax.rs`, `managed.rs`, `theme.rs`, `variant.rs`: authoring IR.
- `imports.rs`, `native_style.rs`: import and native CSS processing.
- `manifest/`: normalization, preset merge, utilities, and variables.
- `lower/`: public lowering API, resolution, merge, render, and focused tests.
- `pattern.rs`: pattern semantics shared by compiler domains.

## Guardrails

TypeScript supplies files and package resolution; Rust remains the semantic source.
Directive behavior changes require compiler tests and the public directive guide.

## Validation

```sh
cargo test -p mastercss-compiler
cargo clippy -p mastercss-compiler --all-targets --all-features -- -D warnings
pnpm --filter @master/css-compiler test
```
