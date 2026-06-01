# Architecture

## Package Layers

```txt
shared / external data
  ↓
@master/css
@master/css-compiler
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

The core package must remain independent from integrations and tooling packages. The compiler is a sibling lower-layer parser: it emits dependency-free CSS directive results and must not import `@master/css` runtime behavior.

When a feature creates a package cycle or self-build cycle, extract shared, dependency-free contracts or IR into `shared` first. Put runtime interpretation in the owning package adapter, such as core converting CSS directive results into `Config`, and re-export public contracts from the main package entry where appropriate.

`shared` owns pure Master CSS config contracts, CSS directive result contracts, `?master-css-config` module id helpers, and generic CSS config loader/plugin factories. Package code should inject compiler and adapter implementations into those shared factories instead of importing a higher-level package to break cycles.

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
- `src/config/utilities.ts`
- `src/utils/compare-rule-priority.ts`
- `src/utils/parse-at.ts`
- `src/utils/parse-selector.ts`
- `src/utils/generate-selector.ts`
- `src/utils/extend-config.ts`

## Rendering Packages

`packages/runtime` extends core for browser DOM observation, native CSSStyleSheet insertion, and hydration.

`packages/server` parses HTML, extracts classes, generates CSS, and injects `style#master`.

`packages/compiler` parses CSS-authored Master config blocks and native CSS into shared directive results. Core-owned adapters convert those results into `Config` when downstream packages need core semantics such as utility composition, selector tokens, variable namespaces, and at-rule resolution.

`packages/extractor` scans source files, extracts latent classes, validates them, and emits CSS for static output. It also owns shared stylesheet extraction helpers for integrations that need to compile `@master` CSS sources, normalize virtual CSS imports, and merge native CSS with extracted Master CSS.

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
