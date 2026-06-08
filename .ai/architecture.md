# Architecture

## Package Layers

```txt
shared / external data
  ↓
@master/css-lexer
  ↓
@master/css
  ↓
@master/css-integration
  ↓
@master/css-compiler
@master/css-configer
  ↓
@master/css-validator
@master/css-server
@master/css-extractor
@master/css-runtime
@master/css-language-service
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

The core package must remain independent from integrations and tooling packages. `@master/css-integration` may depend on core public types, but core must not depend on it. The compiler is the CSS front-end for core: it parses Master CSS stylesheets, resolves CSS import graphs, and uses core adapters to produce semantic `Config` objects and native CSS results.

When a feature creates a package cycle or self-build cycle, extract dependency-free contracts, IR, or lexical source scanners into the lowest owning package first. Use `shared` for type/data contracts and `@master/css-lexer` for raw source/range/token scanning. Keep core independent; packages above core may depend on core for semantic interpretation.

`shared` owns pure Master CSS config contracts and CSS directive result contracts. `@master/css-lexer` owns dependency-free source scanners: generic ranges, CSS directive ranges, Master CSS config entrypoint statements, Master class lexical display tokens, and latent class candidates. `@master/css-integration` owns adapter-neutral integration contracts such as `?master-css-config`, `virtual:master-css-config`, `virtual:master-css-preloaded`, `virtual:master-utilities.css`, generated module source helpers, and dependency-light loader/plugin contracts. None of these packages should own CSS semantic parsing, import graph expansion, or Master CSS package resolution.

## Core Package

`packages/core` owns:

- Default config
- Config extension and flattening
- Utility matching
- Value parsing
- Selector parsing and generation
- At-rule parsing and generation
- Variable and mode resolution
- Cascade layer insertion
- Rule priority sorting
- CSS text generation

Important files:

- `src/core.ts`
- `src/utility.ts`
- `src/factories/with-utility-layer.ts`
- `src/utilities.ts`
- `src/functions.ts`
- `theme.css`
- `src/utils/compare-rule-priority.ts`
- `src/utils/parse-at.ts`
- `src/utils/parse-selector.ts`
- `src/utils/generate-selector.ts`
- `src/utils/extend-config.ts`

## Rendering Packages

`packages/runtime` extends core for browser DOM observation, native CSSStyleSheet insertion, and hydration.

`packages/server` parses HTML, extracts classes, generates CSS, and injects `style#master`.

`packages/compiler` is the canonical CSS source compiler. It parses CSS-authored Master config blocks and native CSS, resolves CSS import graphs, detects project CSS entry markers (`@master;` and `@import "@master/css"`), parses standalone extraction directives, and converts directive results through core into semantic `Config` values. `@master;` and `@import "@master/css"` are user project entry markers; package CSS files such as `@master/css/index.css` must not contain `@master;`.

`packages/configer` resolves Master CSS project config entries, workspace roots, explicit CSS config resources, and project config module source. It delegates CSS parsing, CSS import graph resolution, and config compilation to `@master/css-compiler`. ESLint, language tooling, CLI, and build integrations should consume configer for project-level config instead of rediscovering entries locally.

`packages/integration` defines the virtual module and query protocol shared by build and framework integrations. It must stay adapter-neutral: no Vite, Next, Webpack, Runtime, Server, Extractor, Compiler, or Configer dependencies. Node filesystem helpers are isolated under its `./node` subpath.

`packages/extractor` scans source files, validates latent classes, and emits CSS for static output. It consumes `@master/css-lexer` for source-level class candidates and owns extraction-specific stylesheet helpers such as native CSS merging, native CSS pruning/source directives, and generated CSS composition. Project config discovery and config loading belong in configer or the calling integration.

## Integration Packages

`packages/vite` coordinates runtime, static, pre-render, and progressive modes.

`packages/webpack` provides static rendering through Webpack virtual modules.

`packages/next` integrates pre-render and static modes without depending on Webpack-specific extraction internals.

Framework packages wrap those lower layers for Astro, Nuxt, React, Vue, and Svelte.

## Tooling Packages

`packages/language-service` uses core config and utilities for completion, hover, color features, and semantic token classification. It consumes `@master/css-lexer` for CSS directive ranges and Master class lexical display tokens, then layers core-backed semantic meaning on top.

`packages/language-server` exposes the language service through LSP, manages workspace configs, and serves active/full semantic token requests.

`packages/vscode` packages the VS Code extension, generated settings, and active semantic token provider. Master CSS no longer ships a TextMate grammar package or `.mcss` language contribution.

`packages/eslint-plugin` scans class locations and uses validator/core for class validation, ordering, and collision detection.

## Documentation And Examples

The public docs live under `site/` and depend on the `internal` submodule. The root currently has no `docs/` directory. Avoid adding one unless maintainers explicitly want human-facing docs outside the site.
