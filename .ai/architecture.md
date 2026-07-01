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

The engine package must remain independent from integrations and tooling packages. `@master/css-integration` may depend on `@master/css-schema` contracts and type surfaces from engine, but engine must not depend on it. The compiler is the CSS front-end for manifests: it parses Master CSS stylesheets, resolves CSS import graphs, and lowers CSS-first authoring into `MasterCSSManifest` values and native CSS results.

When a feature creates a package cycle or self-build cycle, extract dependency-free contracts, IR, or lexical source scanners into the lowest owning package first. Use `@master/css-schema` for public type/data contracts, `@master/css-lexer` for raw source/range/token scanning, and `@master/css-source` for source-level class candidate extraction. Keep `shared` limited to repo-internal test/build support. Keep engine independent; packages above engine may depend on engine for manifest-driven semantic interpretation.

`@master/css-schema` owns public dependency-light contracts such as MasterCSSManifest, manifest JSON normalization helpers, hydration manifest contracts, CSS directive result contracts, CSS syntax value types, utility type constants, and runtime style constants. `shared` is private and should only hold repo-internal test/build support. `@master/css-lexer` owns dependency-free source scanners and lexical helpers: generic ranges, CSS directive ranges, Master CSS manifest entrypoint statements, CSS escaping, regular-expression escaping, Master class lexical display tokens, and CSS unit constants. `@master/css-source` owns source-level class candidate extraction and source-format-aware adapters such as HTML, OXC-based JavaScript/TypeScript, Astro, Svelte, and Vue scanning, and depends on `@master/css-lexer` for lexical constants rather than duplicating low-level data. `@master/css-integration` owns adapter-neutral integration contracts such as `?master-css-manifest`, `virtual:master-css-manifest`, `virtual:master-css-emitted-globals`, `virtual:master-utilities.css`, generated JSON/emittedGlobals source helpers, and runtime injection source. `@master/css-stylesheet` composes compiler, integration protocol, validator/native CSS helpers, and structural scanner state for stylesheet entry output. None of these lower packages should own framework lifecycle behavior.

## Engine, Preset, And Facade Packages

`packages/engine` owns:

- MasterCSSManifest validation/execution
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

- `packages/engine/src/core.ts`
- `packages/engine/src/utility.ts`
- `packages/engine/src/utils/compare-rule-priority.ts`
- `packages/engine/src/utils/parse-at.ts`
- `packages/engine/src/utils/parse-selector.ts`
- `packages/engine/src/utils/generate-selector.ts`
- `packages/preset/src/default-manifest.json`
- `packages/facade/src/index.ts`

## Rendering Packages

`packages/runtime` extends the manifest-driven engine for browser DOM observation, native CSSStyleSheet insertion, and hydration.

`packages/server` parses HTML, extracts classes, generates CSS, and injects `style#master-css`.

`packages/compiler` is the canonical CSS source compiler. It parses CSS-authored Master manifest directives and native CSS, resolves CSS import graphs, detects project CSS entry markers (`@master entry;` and `@import "@master/css"`), parses standalone extraction directives, and lowers directive results into `MasterCSSManifest` values. `@master entry;` and `@import "@master/css"` are user project entry markers; package CSS files such as `@master/css/index.css` must not contain `@master entry;`.

`packages/project` resolves Master CSS project manifest entries, workspace roots, explicit CSS manifest resources, and project manifest module source. It delegates CSS parsing, CSS import graph resolution, and manifest compilation to `@master/css-compiler`. ESLint, language tooling, CLI, and build integrations should consume `@master/css-project` for project-level manifests instead of rediscovering entries locally.

`packages/integration` defines the virtual module and query protocol shared by build and framework integrations. It must stay adapter-neutral: no Vite, Next, Webpack, Runtime, Server, Scanner, Compiler, or Manifest dependencies. Browser-safe subpaths must not import `node:*` or use Node globals; Node filesystem, path, hash, and resolved-id helpers are isolated under `./node`, while build plugin helpers live under explicit build-only subpaths.

`packages/scanner` scans source files, validates latent classes, and maintains generated CSS scanner state. It consumes `@master/css-source` for source adapters and fallback class candidate extraction. Stylesheet entry detection, native CSS pruning/source directives, generated CSS composition, and emittedGlobals manifest output belong in `@master/css-stylesheet`. Project manifest discovery and manifest loading belong in `@master/css-project` or the calling integration.

`packages/stylesheet` owns the stylesheet pipeline used by Vite, Webpack, Next, and the CLI. It detects Master CSS stylesheet entries, resolves stylesheet import graphs, compiles CSS-first directives, registers stylesheet sources, scopes extraction directives, and composes native CSS with generated CSS. It accepts structural scanner state and must not depend on `@master/css-scanner`.

## Integration Packages

`packages/vite` coordinates runtime, static, pre-render, and progressive modes.

`packages/webpack` provides static rendering through Webpack virtual modules.

`packages/next` integrates pre-render and static modes without depending on Webpack-specific extraction internals.

Framework packages wrap those lower layers for Astro, Nuxt, React, and Svelte. `@master/css-sv` is a Svelte CLI add-on that edits a SvelteKit app once and installs `@master/css.svelte`; it must not own runtime, SSR, hydration manifest, Vite mode, or CSS output behavior.

## Tooling Packages

`packages/language` owns editor-neutral language primitives: class-position scanning, semantic token classification, browser helpers, Shiki helpers, and the shared TextMate grammar.

`packages/language-service` uses manifest-driven engine utilities for completion, hover, and color features, and delegates class-position scanning and semantic token classification to `@master/css-language`.

`packages/language-server` exposes the language service through LSP, manages workspace manifests, and serves active/full semantic token requests.

`packages/vscode` packages the VS Code extension, generated settings, and active semantic token provider. Master CSS no longer ships a TextMate grammar package or `.mcss` language contribution.

`packages/lint` owns framework-neutral class lint policy such as sorting, conflict detection, validation diagnostics, and canonical class suggestions.

`packages/eslint-plugin` scans class locations and adapts `@master/css-lint` helpers to ESLint rules, reports, and autofix ranges.

## Documentation And Examples

The public docs live under `site/` and depend on the `internal` submodule. The root currently has no `docs/` directory. Avoid adding one unless maintainers explicitly want human-facing docs outside the site.
