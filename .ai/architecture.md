# Architecture

## Package Layers

```txt
shared / external data
  ↓
@master/css-lexer
  ↓
@master/css-source
  ↓
@master/css-engine
@master/css-preset
@master/css-integration
  ↓
@master/css-compiler
@master/css-manifest
  ↓
@master/css-validator
@master/css-server
@master/css-extractor
@master/css-runtime
@master/css-language
@master/css-language-service
@master/css-stylesheet
  ↓
@master/css.vite
@master/css.webpack
@master/css-cli
@master/eslint-plugin-css
@master/css-language-server
  ↓
@master/css.astro
@master/css.nuxt
@master/css.react
@master/css.vue
@master/css.svelte
master-css-vscode
examples
site
```

The engine package must remain independent from integrations and tooling packages. `@master/css-integration` may depend on shared manifest helpers and type surfaces from engine, but engine must not depend on it. The compiler is the CSS front-end for manifests: it parses Master CSS stylesheets, resolves CSS import graphs, and lowers CSS-first authoring into `MasterCSSManifest` values and native CSS results.

When a feature creates a package cycle or self-build cycle, extract dependency-free contracts, IR, or lexical source scanners into the lowest owning package first. Use `shared` for type/data contracts, `@master/css-lexer` for raw source/range/token scanning, and `@master/css-source` for source-level class candidate extraction. Keep engine independent; packages above engine may depend on engine for manifest-driven semantic interpretation.

`shared` owns MasterCSSManifest contracts, manifest JSON normalization helpers, and CSS directive result contracts. `@master/css-lexer` owns dependency-free source scanners: generic ranges, CSS directive ranges, Master CSS manifest entrypoint statements, Master class lexical display tokens, and CSS unit constants. `@master/css-source` owns source-level class candidate extraction and source-format-aware adapters such as HTML and OXC-based JavaScript/TypeScript scanning, and depends on `@master/css-lexer` for lexical constants rather than duplicating low-level data. `@master/css-integration` owns adapter-neutral integration contracts such as `?master-css-manifest`, `virtual:master-css-manifest`, `virtual:master-css-emitted-globals`, `virtual:master-utilities.css`, generated JSON/emittedGlobals source helpers, runtime injection source, and dependency-light loader/plugin contracts. `@master/css-stylesheet` composes compiler, integration protocol, validator/native CSS helpers, and structural extraction state for stylesheet entry output. None of these lower packages should own framework lifecycle behavior.

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

`packages/core` keeps the public package name `@master/css`, but it is a facade over engine and preset exports. It must not own config resolution, matcher construction, declarers, transformers, or runtime authoring adapters.

Important files:

- `packages/engine/src/core.ts`
- `packages/engine/src/utility.ts`
- `packages/engine/src/utils/compare-rule-priority.ts`
- `packages/engine/src/utils/parse-at.ts`
- `packages/engine/src/utils/parse-selector.ts`
- `packages/engine/src/utils/generate-selector.ts`
- `packages/preset/src/default-manifest.json`
- `packages/core/src/index.ts`

## Rendering Packages

`packages/runtime` extends the manifest-driven engine for browser DOM observation, native CSSStyleSheet insertion, and hydration.

`packages/server` parses HTML, extracts classes, generates CSS, and injects `style#master-css`.

`packages/compiler` is the canonical CSS source compiler. It parses CSS-authored Master manifest directives and native CSS, resolves CSS import graphs, detects project CSS entry markers (`@master;` and `@import "@master/css"`), parses standalone extraction directives, and lowers directive results into `MasterCSSManifest` values. `@master;` and `@import "@master/css"` are user project entry markers; package CSS files such as `@master/css/index.css` must not contain `@master;`.

`packages/manifest` resolves Master CSS project manifest entries, workspace roots, explicit CSS manifest resources, and project manifest module source. It delegates CSS parsing, CSS import graph resolution, and manifest compilation to `@master/css-compiler`. ESLint, language tooling, CLI, and build integrations should consume `@master/css-manifest` for project-level manifests instead of rediscovering entries locally.

`packages/integration` defines the virtual module and query protocol shared by build and framework integrations. It must stay adapter-neutral: no Vite, Next, Webpack, Runtime, Server, Extractor, Compiler, or Manifest dependencies. Browser-safe subpaths must not import `node:*` or use Node globals; Node filesystem, path, hash, and resolved-id helpers are isolated under `./node`, while build plugin helpers live under explicit build-only subpaths.

`packages/extractor` scans source files, validates latent classes, and maintains generated CSS extraction state. It consumes `@master/css-source` for source adapters and fallback class candidate extraction. Stylesheet entry detection, native CSS pruning/source directives, generated CSS composition, and emittedGlobals manifest output belong in `@master/css-stylesheet`. Project manifest discovery and manifest loading belong in `@master/css-manifest` or the calling integration.

`packages/stylesheet` owns the stylesheet pipeline used by Vite, Webpack, Next, and the CLI. It detects Master CSS stylesheet entries, resolves stylesheet import graphs, compiles CSS-first directives, registers stylesheet sources, scopes extraction directives, and composes native CSS with generated CSS. It accepts structural extractor state and must not depend on `@master/css-extractor`.

## Integration Packages

`packages/vite` coordinates runtime, static, pre-render, and progressive modes.

`packages/webpack` provides static rendering through Webpack virtual modules.

`packages/next` integrates pre-render and static modes without depending on Webpack-specific extraction internals.

Framework packages wrap those lower layers for Astro, Nuxt, React, Vue, and Svelte.

## Tooling Packages

`packages/language` owns editor-neutral language primitives: class-position scanning, semantic token classification, browser helpers, Shiki helpers, and the shared TextMate grammar.

`packages/language-service` uses manifest-driven engine utilities for completion, hover, and color features, and delegates class-position scanning and semantic token classification to `@master/css-language`.

`packages/language-server` exposes the language service through LSP, manages workspace manifests, and serves active/full semantic token requests.

`packages/vscode` packages the VS Code extension, generated settings, and active semantic token provider. Master CSS no longer ships a TextMate grammar package or `.mcss` language contribution.

`packages/eslint-plugin` scans class locations and uses validator/engine for class validation, ordering, and collision detection.

## Documentation And Examples

The public docs live under `site/` and depend on the `internal` submodule. The root currently has no `docs/` directory. Avoid adding one unless maintainers explicitly want human-facing docs outside the site.
