# Package Boundaries Pack

Use this for dependency direction, package ownership, public exports, config shapes, virtual module protocols, or cycle pressure.

## Dependency Direction

```txt
shared / external data
  -> @master/css-schema / @master/css-lexer
  -> @master/css-source
  -> @master/css-engine / @master/css-preset / @master/css-integration
  -> @master/css-compiler / @master/css-project
  -> validator / server / scanner / runtime / language / language-service / stylesheet
  -> build plugins / CLI / ESLint / language-server
  -> framework integrations / VS Code / examples / site
```

## Ownership Rules

- `@master/css-engine` owns manifest execution, class semantics, generated rules, priority, layers, variables, animations, and CSS text generation.
- `@master/css-preset` owns default preset CSS source and generated default manifest.
- `@master/css` is a facade; do not move behavior there casually.
- `@master/css-compiler` owns CSS-first authoring and manifest lowering.
- `@master/css-project` owns project entry and manifest resource resolution.
- `@master/css-integration` owns adapter-neutral virtual module and integration protocol.
- `@master/css-source` owns source-level class candidate extraction.
- `@master/css-stylesheet` owns stylesheet entry output and generated CSS composition.
- Class pipeline ownership: `@master/css-lexer` owns raw class-list token/range parsing, whitespace splitting, and dependency-free lexical helpers; `@master/css-engine/inspect` owns manifest-driven class semantic inspection for tooling; `@master/css-lint` owns framework-neutral lint policy and class-list edit plans; `@master/eslint-plugin-css` owns ESLint AST visitors, reports, and fixer adaptation; `@master/css-language` owns editor source-position scanning and semantic tokenization.
- Runtime-covered value surface: `@master/css-runtime` directly extends `MasterCSS` and bundles runtime source, selected engine value exports, schema runtime constants, and default manifest loading. Classify additions as runtime core, build-time-only configuration, or tooling-only logic before adding them to any runtime-imported value module.
- Runtime observation: runtime must not grow global event buses or tooling observer APIs. Third-party class observation should use DOM `MutationObserver` or explicit public runtime state.

## Escalate When

- A dependency edge seems necessary across layers: read `.ai/architecture.md`, `.ai/package-map.md`, and `.ai/boundaries.md`.
- Public exports, config shapes, or virtual ids change: inspect downstream packages and add validation.
- A cycle appears: extract dependency-light contracts into `@master/css-schema`, lexical scanners into `@master/css-lexer`, source extraction into `@master/css-source`, or adapter-neutral protocol into `@master/css-integration`.
- A proposed helper is not required by runtime execution but would live under runtime source, `MasterCSS`, engine root value exports, schema value constants, or another runtime-imported value module: split it into an explicit tooling subpath or owning package and measure runtime bundle impact when feasible.

## Do Not

- Do not make engine depend on compiler, integration contracts, runtime, server, scanner, language service, ESLint, examples, or site.
- Do not solve package pressure with hidden runtime imports or package-specific loaders in the wrong layer.
