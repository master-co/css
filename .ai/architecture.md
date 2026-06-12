# Architecture

## Package Layers

```txt
shared / external data
  ↓
@master/css-lexer
  ↓
@master/css-engine
@master/css-preset
@master/css-integration
  ↓
@master/css-compiler
@master/css-plan
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

The engine package must remain independent from integrations and tooling packages. `@master/css-integration` may depend on shared plan types, but engine must not depend on it. The compiler is the CSS front-end for plans: it parses Master CSS stylesheets, resolves CSS import graphs, and lowers CSS-first authoring into `MasterCSSPlan` values and native CSS results.

When a feature creates a package cycle or self-build cycle, extract dependency-free contracts, IR, or lexical source scanners into the lowest owning package first. Use `shared` for type/data contracts and `@master/css-lexer` for raw source/range/token scanning. Keep engine independent; packages above engine may depend on engine for plan-driven semantic interpretation.

`shared` owns MasterCSSPlan contracts and CSS directive result contracts. `@master/css-lexer` owns dependency-free source scanners: generic ranges, CSS directive ranges, Master CSS plan entrypoint statements, Master class lexical display tokens, and latent class candidates. `@master/css-integration` owns adapter-neutral integration contracts such as `?master-css-plan`, `virtual:master-css-plan`, `virtual:master-css-preloaded`, `virtual:master-utilities.css`, generated module source helpers, and dependency-light loader/plugin contracts. None of these packages should own CSS semantic parsing, import graph expansion, or Master CSS package resolution.

## Engine, Preset, And Facade Packages

`packages/engine` owns:

- MasterCSSPlan validation/execution
- Utility opcode matching
- Value parsing
- Selector parsing and generation
- At-rule parsing and generation
- Variable and mode execution
- Cascade layer insertion
- Rule priority sorting
- CSS text generation

`packages/preset` owns default preset CSS source files and the generated default plan.

`packages/core` keeps the public package name `@master/css`, but it is a facade over engine and preset exports. It must not own config resolution, matcher construction, declarers, transformers, or runtime authoring adapters.

Important files:

- `packages/engine/src/core.ts`
- `packages/engine/src/utility.ts`
- `packages/engine/src/utils/compare-rule-priority.ts`
- `packages/engine/src/utils/parse-at.ts`
- `packages/engine/src/utils/parse-selector.ts`
- `packages/engine/src/utils/generate-selector.ts`
- `packages/preset/src/default-plan.ts`
- `packages/core/src/index.ts`

## Rendering Packages

`packages/runtime` extends the plan-driven engine for browser DOM observation, native CSSStyleSheet insertion, and hydration.

`packages/server` parses HTML, extracts classes, generates CSS, and injects `style#master`.

`packages/compiler` is the canonical CSS source compiler. It parses CSS-authored Master plan directives and native CSS, resolves CSS import graphs, detects project CSS entry markers (`@master;` and `@import "@master/css"`), parses standalone extraction directives, and lowers directive results into `MasterCSSPlan` values. `@master;` and `@import "@master/css"` are user project entry markers; package CSS files such as `@master/css/index.css` must not contain `@master;`.

`packages/plan` resolves Master CSS project plan entries, workspace roots, explicit CSS plan resources, and project plan module source. It delegates CSS parsing, CSS import graph resolution, and plan compilation to `@master/css-compiler`. ESLint, language tooling, CLI, and build integrations should consume `@master/css-plan` for project-level plans instead of rediscovering entries locally.

`packages/integration` defines the virtual module and query protocol shared by build and framework integrations. It must stay adapter-neutral: no Vite, Next, Webpack, Runtime, Server, Extractor, Compiler, or Plan dependencies. Node filesystem helpers are isolated under its `./node` subpath.

`packages/extractor` scans source files, validates latent classes, and emits CSS for static output. It consumes `@master/css-lexer` for source-level class candidates and owns extraction-specific stylesheet helpers such as native CSS merging, native CSS pruning/source directives, and generated CSS composition. Project plan discovery and plan loading belong in `@master/css-plan` or the calling integration.

## Integration Packages

`packages/vite` coordinates runtime, static, pre-render, and progressive modes.

`packages/webpack` provides static rendering through Webpack virtual modules.

`packages/next` integrates pre-render and static modes without depending on Webpack-specific extraction internals.

Framework packages wrap those lower layers for Astro, Nuxt, React, Vue, and Svelte.

## Tooling Packages

`packages/language-service` uses plan-driven engine utilities for completion, hover, color features, and semantic token classification. It consumes `@master/css-lexer` for CSS directive ranges and Master class lexical display tokens, then layers engine-backed semantic meaning on top.

`packages/language-server` exposes the language service through LSP, manages workspace plans, and serves active/full semantic token requests.

`packages/vscode` packages the VS Code extension, generated settings, and active semantic token provider. Master CSS no longer ships a TextMate grammar package or `.mcss` language contribution.

`packages/eslint-plugin` scans class locations and uses validator/engine for class validation, ordering, and collision detection.

## Documentation And Examples

The public docs live under `site/` and depend on the `internal` submodule. The root currently has no `docs/` directory. Avoid adding one unless maintainers explicitly want human-facing docs outside the site.
