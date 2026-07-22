# Architecture

## Package Layers

```txt
shared / external data
  ↓
@master/css-schema
@master/css-lexer
  ↓
@master/css-source
  ↓
@master/css-engine
@master/css-preset
@master/css-integration
  ↓
@master/css-compiler
@master/css-project
  ↓
@master/css-validator
@master/css-lint
@master/css-server
@master/css-scanner
@master/css-runtime
@master/css-language
@master/css-language-service
@master/css-stylesheet
  ↓
@master/css.vite
@master/css.webpack
@master/css-cli
@master/create-css
@master/eslint-plugin-css
@master/css-language-server
  ↓
@master/css.astro
@master/css.nuxt
@master/css.svelte
@master/css-sv
master-css-vscode
examples
site
```

The Rust engine crate must remain independent from integrations and tooling packages. `@master/css-integration` depends on `@master/css-schema` contracts, not engine implementation. The Rust compiler is the CSS front-end for manifests: it parses Master CSS stylesheets, consumes provider-neutral import graphs, and lowers CSS-first authoring into `MasterCSSManifest` values and native CSS results.

When a feature creates a package cycle or self-build cycle, extract dependency-free contracts, IR, or lexical source scanners into the lowest owning package first. Use `@master/css-schema` for public type/data contracts, `@master/css-lexer` for raw source/range/token scanning, and `@master/css-source` for source-level class candidate extraction. Keep `shared` limited to repo-internal test/build support. Keep engine independent; packages above engine may depend on engine for manifest-driven semantic interpretation.

`@master/css-schema` owns public dependency-light contracts, generated native/Wasm ABI declarations, version constants, and pure codecs. Rust lexer/source/compiler crates own lexical analysis, built-in source extraction, directives, and manifest lowering. TypeScript lexer/source/compiler packages are session and platform-provider shells; Svelte/Vue official-parser adapters are explicit host exceptions. `@master/css-integration` owns adapter-neutral virtual-module contracts and code generation. `@master/css-stylesheet` is a host lifecycle around Rust compiler/project/render operations. None of these lower packages owns framework lifecycle behavior.

## Engine, Preset, And Facade Packages

`packages/engine` owns:

- Manifest v1 validation/execution through native and runtime Wasm sessions
- Utility opcode matching
- Value parsing
- Selector parsing and generation
- At-rule parsing and generation
- Variable and mode execution
- Cascade layer insertion
- Rule priority sorting
- CSS text generation

`packages/preset` owns default preset CSS source files and the generated default manifest.

`packages/facade` keeps the public package name `@master/css`, but it is a facade over engine and preset exports. It must not own config resolution, matcher construction, declarers, transformers, or runtime authoring adapters.

Important files:

- `crates/mastercss-engine/src/lib.rs`
- `packages/engine/src/create-engine.ts`
- `packages/engine/src/bound-engine.ts`
- `packages/engine/src/node.ts`
- `packages/preset/src/default-manifest.json`
- `packages/facade/src/index.ts`

## Rendering Packages

`packages/runtime` hosts the Rust runtime engine for browser DOM observation, native CSSStyleSheet insertion, scheduling, and hydration.

`packages/server` parses/serializes HTML and injects `style#master-css`; Rust render sessions extract classes, generate CSS, and produce hydration/resource IR.

`crates/mastercss-compiler` is the canonical CSS source compiler. The TypeScript package supplies files, Node package exports resolution, and callbacks, then invokes Rust for inspection, dependency/directive analysis, lowering, normalization, and CSS composition. Browser compilation loads only `wasm-compiler`.

The Rust project crate owns project entries, manifest merge/load policy, and source plans. The TypeScript project package supplies filesystem and Node package-resolution providers. ESLint, language tooling, CLI, and build integrations consume this package instead of rediscovering entries.

`packages/integration` defines the virtual module and query protocol shared by build and framework integrations. It must stay adapter-neutral: no Vite, Next, Webpack, Runtime, Server, Scanner, Compiler, or Manifest dependencies. Browser-safe subpaths must not import `node:*` or use Node globals; Node filesystem, path, hash, and resolved-id helpers are isolated under `./node`, while build plugin helpers live under explicit build-only subpaths.

The Rust scanner owns canonical candidates, caches, classifications, validation coordination, engine transitions, delta updates, and snapshots. TypeScript supplies files, custom adapter candidates, and host CSS capability results. Stylesheet entry lifecycle belongs to `@master/css-stylesheet`; project discovery belongs to `@master/css-project`.

`packages/stylesheet` owns the stylesheet pipeline used by Vite, Webpack, Next, and the CLI. It detects Master CSS stylesheet entries, resolves stylesheet import graphs, compiles CSS-first directives, registers stylesheet sources, scopes extraction directives, and composes native CSS with generated CSS. It accepts structural scanner state and must not depend on `@master/css-scanner`.

## Integration Packages

`packages/vite` coordinates runtime, static, pre-render, and progressive modes.

`packages/webpack` provides static rendering through Webpack virtual modules.

`packages/next` integrates pre-render and static modes without depending on Webpack-specific extraction internals.

Framework packages wrap those lower layers for Astro, Nuxt, React, and Svelte. `@master/css-sv` is a Svelte CLI add-on that edits a SvelteKit app once and installs `@master/css.svelte`; it must not own runtime, SSR, hydration manifest, Vite mode, or CSS output behavior.

## Tooling Packages

The Rust language crate owns editor-neutral document contexts, UTF-16 ranges, class tokenization/classification, completions, inspection, colors, formatting, diagnostics, and edit IR. The TypeScript package maps host parser ranges and editor/LSP objects. Shiki helpers and the TextMate grammar remain assets.

`packages/language-service` maps Rust language IR to completion, hover, colors, semantic tokens, and edits over `TextDocument` objects.

`packages/language-server` exposes the language service through LSP, manages workspace manifests, and serves active/full semantic token requests.

`packages/vscode` packages the VS Code extension, generated settings, and active semantic token provider. Master CSS no longer ships a TextMate grammar package or `.mcss` language contribution.

The Rust lint crate owns framework-neutral sorting, conflicts, raw-value policy, canonicalization, diagnostics, and edit plans. The TypeScript lint package is a session/source-range adapter.

`packages/eslint-plugin` scans class locations and adapts `@master/css-lint` helpers to ESLint rules, reports, and autofix ranges.

## Documentation And Examples

The public docs live under `site/` and depend on the `internal` submodule. The root currently has no `docs/` directory. Avoid adding one unless maintainers explicitly want human-facing docs outside the site.
