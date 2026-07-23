# Architecture

## Package Layers

```txt
external data / repository build support
  -> @master/css-schema
  -> @master/css-backend / @master/css-wasm-{engine,compiler,tooling}
  -> @master/css-preset
  -> @master/css / @master/css-tooling
  -> @master/css-compiler
  -> runtime / server / language-service / ESLint
  -> build adapters / CLI / language-server
  -> framework adapters / VS Code / examples / site
```

Rust is the single semantic source. The Rust crates own class parsing, matching,
priority, rule generation, directive lowering, extraction, validation, lint policy,
language analysis, project policy, and report shaping. TypeScript owns platform
loading, filesystem and package resolution, browser or editor adaptation, and host
capability callbacks. Do not add a TypeScript semantic fallback.

The public JavaScript architecture is intentionally concentrated into three primary
surfaces:

- `@master/css` executes Manifest v1 and exposes the stable CSS entrypoints.
- `@master/css-compiler` owns CSS authoring, project loading, stylesheet composition,
  and project inspection.
- `@master/css-tooling` owns lexer, source extraction, scanning, validation, lint, and
  editor-neutral language sessions.

`@master/css-schema`, `@master/css-preset`, and the native/Wasm delivery packages are
supporting contracts and artifacts, not alternate semantic implementations.

## Core Execution

`packages/css` is the public execution surface. Its TypeScript code binds native or
runtime-Wasm engine sessions and exposes versioned state. The Rust engine owns utility
matching, value and selector semantics, modes, variables, animations, layer placement,
priority, and CSS bytes. `packages/css` must not grow config resolution, declarers,
transformers, or duplicated parsers.

`packages/preset` owns the default preset CSS and generated default Manifest v1. The
stable layer statement remains:

```txt
@layer theme, base, defaults, components, utilities;
```

Important files:

- `crates/mastercss-engine/src/lib.rs`
- `packages/css/src/engine/bound-engine.ts`
- `packages/css/src/engine/create-engine.ts`
- `packages/css/src/node.ts`
- `packages/preset/src/default-manifest.json`

## Compiler Surface

`packages/compiler` contains four cohesive host responsibilities:

- Root compiler sessions for directive inspection, lowering, normalization, and
  Manifest v1 compilation.
- `./project` for entry discovery, project manifests, sync loading, and workspace
  package resolution.
- `./stylesheet` for managed stylesheet lifecycle, extraction policy, native CSS
  pruning, generated CSS composition, and emitted-global metadata.
- `./diagnostics` for complete project inspection reports.

The Rust compiler and project crates own parsing, graph policy, merge policy, and
report classification. TypeScript supplies files, Node package exports resolution,
host CSS support, and orchestration. Directive syntax or CSS-byte changes remain
high-risk even though these responsibilities now share one npm package.

## Tooling Surface

`packages/tooling` exposes Rust-backed feature subpaths:

- `./lexer`
- `./source`
- `./scanner`
- `./validator`
- `./lint`
- `./language`
- `./diagnostics` for the dependency-light Rust report bridge used by the compiler

The package may contain private official Vue and Svelte source adapters, but it does
not expose a third-party adapter registry. First-party integrations use the built-in
pipeline. New syntax, extraction, lint, or language semantics belong in the matching
Rust crate, then flow through the tooling session API.

Shiki transformation and the TextMate grammar are editor presentation assets and
belong to `@master/css-language-service`, not the editor-neutral tooling core.

## Runtime And Server

`packages/runtime` owns browser DOM observation, class reference counts, CSSOM
mutation, scheduling, and hydration around the runtime-Wasm engine session. It must
not gain build-time observers, global tooling event buses, or configuration loaders.

`packages/server` owns HTML parsing/serialization and `style#master-css` injection.
Rust render sessions extract classes, generate CSS, and produce hydration/resource IR.

## Integration Protocol And Adapters

`packages/internal` is named `@master/css-internal`, is private, and is
bundled into official compiler, integration, editor, and tooling artifacts. It owns
virtual ids, generated manifest/emitted-global/runtime-bootstrap modules, default
build-manifest helpers, and Node path/hash/workspace helpers.
It is not a supported third-party SPI and must never appear in a published package's
dependencies or emitted import specifiers. It is not a generic destination for
unrelated repository helpers.

Official adapter package names use one normalized hyphenated family:

```txt
@master/css-vite
@master/css-webpack
@master/css-next
@master/css-astro
@master/css-nuxt
@master/css-svelte
```

User-facing framework configuration uses each adapter's ecosystem default export,
while the same entrypoint retains its branded named export for programmatic
composition. General library entrypoints remain named-only. SvelteKit server hooks
follow the framework's named `handle` contract instead of adding a default export.
The exact default-export entrypoints are enforced by
`scripts/check-package-contracts.mjs`.

Vite coordinates runtime, static, pre-render, and progressive modes. Webpack owns its
module lifecycle. Next owns Next-specific build and instrumentation behavior. Astro,
Nuxt, and Svelte wrap the official lower adapters without reimplementing CSS semantics.

## Language And ESLint

`packages/language-service` maps tooling language IR to completion, hover, colors,
semantic tokens, edits, and Shiki output over editor documents.

`packages/language-server` owns LSP workspace lifecycle and protocol responses.
`packages/vscode` packages the extension under npm name `@master/css-vscode`; its
staged Marketplace manifest retains the historical extension id `master-css-vscode`.

`packages/eslint-plugin` owns ESLint AST visitors, settings, reports, and fixer range
adaptation over `@master/css-tooling/lint`. `@master/eslint-config-css` is deliberately
retained as the thin public ecosystem preset and delegates to the matching plugin
version without duplicating rules or configuration policy.

## Cycles And New Responsibilities

When cycle pressure appears:

1. Put versioned dependency-light contracts in `@master/css-schema`.
2. Put semantic operations in the owning Rust crate and expose them through the
   appropriate native/Wasm session.
3. Put compiler/project/stylesheet orchestration in `@master/css-compiler`.
4. Put editor-neutral analysis in `@master/css-tooling`.
5. Keep official virtual-module protocol private and bundled.

Do not create another public package merely to break a TypeScript import cycle, and do
not move host-specific behavior into schema or runtime code.

## Documentation And Examples

Public docs live under `site/` and use the `internal` submodule. The root has no public
`docs/` directory. Examples validate official adapters and must use the normalized
package names.
