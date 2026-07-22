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
- Class pipeline ownership: Rust `@master/css-lexer` sessions own raw class-list token/range parsing and lexical operations; Rust engine inspection IR owns manifest-driven class semantics; Rust `@master/css-lint` sessions own framework-neutral lint policy and edit plans; `@master/eslint-plugin-css` owns only ESLint AST visitors, reports, and fixer adaptation; Rust `@master/css-language` sessions own document contexts, tokenization, completions, colors, diagnostics, and edit IR.
- Runtime-covered surface: `@master/css-runtime` hosts DOM/CSSOM behavior around the split `wasm-runtime` engine session. Classify additions as runtime core, build-time-only configuration, or tooling-only logic before adding them to runtime-imported modules or the runtime Wasm feature set.
- Runtime observation: runtime must not grow global event buses or tooling observer APIs. Third-party class observation should use DOM `MutationObserver` or explicit public runtime state.

## Escalate When

- A dependency edge seems necessary across layers: read `.ai/architecture.md`, `.ai/package-map.md`, and `.ai/boundaries.md`.
- Public exports, config shapes, or virtual ids change: inspect downstream packages and add validation.
- A cycle appears: extract dependency-light contracts into `@master/css-schema`, lexical scanners into `@master/css-lexer`, source extraction into `@master/css-source`, or adapter-neutral protocol into `@master/css-integration`.
- A proposed helper is not required by runtime execution but would live under runtime source, the engine session, schema value constants, or another runtime-imported value module: move it to the compiler/tooling Wasm surface or the owning package and measure runtime bundle impact when feasible.

## Do Not

- Do not make engine depend on compiler, integration contracts, runtime, server, scanner, language service, ESLint, examples, or site.
- Do not solve package pressure with hidden runtime imports or package-specific loaders in the wrong layer.
