# Architecture

## Package Layers

```txt
shared / external data
  ↓
@master/css
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

The core package must remain independent from integrations and tooling packages. The compiler is the CSS front-end for core: it parses Master CSS stylesheets, resolves CSS import graphs, and uses core adapters to produce semantic `Config` objects and native CSS results.

When a feature creates a package cycle or self-build cycle, extract shared, dependency-free contracts or IR into `shared` first. Keep core independent; packages above core may depend on core for semantic interpretation.

`shared` owns pure Master CSS config contracts, CSS directive result contracts, `?master-css-config` / `virtual:master-css-config` module id helpers, and dependency-free loader/plugin contracts. It must not own CSS parsing, import graph expansion, or Master CSS package resolution.

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

`packages/configer` resolves Master CSS project config entries, workspace roots, `?master-css-config` modules, and `virtual:master-css-config` project config modules. It delegates CSS parsing, CSS import graph resolution, and config compilation to `@master/css-compiler`. ESLint, language tooling, CLI, and build integrations should consume configer for project-level config instead of rediscovering entries locally.

`packages/extractor` scans source files, extracts latent classes, validates them, and emits CSS for static output. It owns extraction-specific stylesheet helpers such as native CSS merging, shake/source directives, and generated CSS composition, but consumes compiler-provided CSS parsing/config results. Project config discovery and config loading belong in configer or the calling integration.

## Integration Packages

`packages/vite` coordinates runtime, extract, pre-render, and progressive modes.

`packages/webpack` provides static extraction through Webpack virtual modules.

`packages/next` integrates pre-render and extract modes without depending on Webpack-specific extraction internals.

Framework packages wrap those lower layers for Astro, Nuxt, React, Vue, and Svelte.

## Tooling Packages

`packages/language-service` uses core config and utilities for completion, hover, and color features.

`packages/language-server` exposes the language service through LSP and manages workspace configs.

`packages/language` owns TextMate/Shiki grammars.

`packages/vscode` packages the VS Code extension and generated grammar/config contributions.

`packages/eslint-plugin` scans class locations and uses validator/core for class validation, ordering, and collision detection.

## Documentation And Examples

The public docs live under `site/` and depend on the `internal` submodule. The root currently has no `docs/` directory. Avoid adding one unless maintainers explicitly want human-facing docs outside the site.
