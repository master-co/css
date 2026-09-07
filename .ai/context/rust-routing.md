# Rust Crate Routing Pack

Use this after `.ai/context/package-routing.md` whenever a task touches `crates/**`,
Rust-backed behavior, native bindings, Wasm bindings, code generation, or parity.

## Read Order

1. Root `Cargo.toml` and the affected crate `Cargo.toml`.
2. The affected crate `AI.md`, when present.
3. The smallest source module and adjacent tests named below.
4. The matching TypeScript host package `package.json` and `AI.md` only when the
   binding or public host surface is involved.

Do not begin with every crate or every binding. Rust owns semantics; TypeScript hosts
own loading, filesystem, browser, editor, and platform adaptation.

## Semantic Crates

| Crate | Responsibility | Start with |
|---|---|---|
| `mastercss-schema` | Serializable Manifest, engine, and directive contracts | `src/manifest.rs`, `src/engine.rs`, `src/directives.rs` |
| `mastercss-lexer` | Escapes, functions, variables, directives, statements, class-list tokens | matching `src/*.rs`, then `src/tests.rs` |
| `mastercss-engine` | Manifest execution, utility/value matching, conditions, priority, resources, transitions | `src/session.rs`, then the owning domain module |
| `mastercss-compiler` | Directive parsing, import graph, managed CSS, manifest lowering | `src/directives.rs`, `src/manifest/`, or `src/lower/` |
| `mastercss-project` | Project entry/import graph and manifest merge policy | `src/lib.rs`, `src/tests.rs` |
| `mastercss-source` | HTML/JS/Vue/Svelte-neutral source extraction IR | `src/lib.rs` and scanner tests |
| `mastercss-scanner` | Multi-file scan state over source extraction and engine transitions | `src/lib.rs` and tooling scanner tests |
| `mastercss-validator` | Rust validation operations | `src/lib.rs` |
| `mastercss-lint` | Ordering, conflict, compose, and recommendation policy | matching domain module and its tests |
| `mastercss-language` | UTF-16 positions, document analysis, formatting, semantic tokens | `src/session.rs`, then domain module |
| `mastercss-render` | Server render/hydration IR | `src/lib.rs` and server fixtures |
| `mastercss-diagnostics` | Dependency-light diagnostic/report contracts | `src/lib.rs` |

## Delivery And Host Crates

| Crate | Responsibility | Pair with |
|---|---|---|
| `mastercss-binding-native` | napi ABI adapters grouped by engine, compiler, tooling, render/scanner | `packages/binding`, affected public host package |
| `mastercss-binding-wasm-engine` | Runtime-safe engine Wasm ABI | `packages/binding-wasm-engine`, `packages/runtime`, `packages/css` |
| `mastercss-binding-wasm-compiler` | Compiler Wasm ABI | `packages/binding-wasm-compiler`, `packages/compiler` |
| `mastercss-binding-wasm-tooling` | Tooling Wasm ABI | `packages/binding-wasm-tooling`, `packages/tooling` |
| `mastercss-cli` | Native CLI transport over project/scanner/engine | `packages/cli` |
| `xtask` | Artifact builds, codegen, parity, and release staging | generated target plus `parity/**` evidence |

## Engine Module Routing

- Session lifecycle, batches, snapshots, and transitions: `session.rs`, `state.rs`.
- Utility lookup and declaration/value matching: `utility.rs`, `value_syntax.rs`.
- Selectors, modes, and conditions: `condition.rs`.
- Rule assembly and CSS-facing IR: `generation.rs`, `render.rs`.
- Variables, animations, and retained resources: `resources.rs`,
  `stylesheet_resources.rs`.
- Manifest indexing and normalization: `manifest.rs`.
- Completion-facing engine data: `completion.rs`.

## Compiler Module Routing

- Directive syntax and parsed authoring IR: `directives.rs`, `syntax.rs`, `theme.rs`,
  `variant.rs`, `managed.rs`.
- Import discovery and native CSS handling: `imports.rs`, `native_style.rs`.
- Manifest normalization and domains: `manifest/normalize.rs`, `manifest/preset.rs`,
  `manifest/utilities.rs`, `manifest/variables.rs`.
- Lowering orchestration: `lower/api.rs`, `lower/resolution.rs`, `lower/merge.rs`,
  `lower/render.rs`.

## Validation

Start scoped, then widen for semantic or ABI changes:

```sh
cargo test -p <crate>
cargo clippy -p <crate> --all-targets --all-features -- -D warnings
cargo fmt --check
```

For generated bindings or ABI changes also run:

```sh
cargo xtask codegen --check
cargo xtask parity
```

Engine/compiler output changes require the matching npm package tests. Runtime-Wasm
changes require runtime e2e and bundle-size review. Never edit generated binding
protocol files directly.
