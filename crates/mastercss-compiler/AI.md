# AI Notes For `mastercss-compiler`

## Responsibility

Canonical CSS directive parsing, import/native-style handling, Manifest v4 lowering,
and compiler report IR.

## Module Routing

- `directives.rs`, `syntax.rs`, `mixins.rs`, `theme.rs`, `variant.rs`: authoring IR.
- `imports.rs`, `native_style.rs`, `native_tokens.rs`: import, native CSS processing, and native token cataloging.
- `manifest/`: normalization, preset merge, mixins, variants, and variables.
- `lower/`: public lowering API, resolution, merge, render, and focused tests.
- `pattern.rs`: pattern semantics shared by compiler domains.

## Guardrails

TypeScript supplies files and package resolution; Rust remains the semantic source.
Directive behavior changes require compiler tests and the public directive guide.
Direct `@theme` declarations lower to ordered `:root,:host` groups. Native custom
properties supply catalog values without transferring CSS delivery to the engine.
Keep native descriptors, keyframe locals, and unexpanded mixin bodies out of that catalog.

## Validation

```sh
cargo test -p mastercss-compiler
cargo clippy -p mastercss-compiler --all-targets --all-features -- -D warnings
pnpm --filter @master/css-compiler test
```
