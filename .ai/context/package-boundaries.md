# Package Boundaries Pack

Use this for dependency direction, public exports, config shapes, virtual-module
protocol, package consolidation, or cycle pressure.

## Dependency Direction

```txt
external data / shared build support
  -> schema + native/Wasm artifact loaders + preset
  -> @master/css + @master/css-tooling
  -> @master/css-compiler
  -> runtime / server / language-service / ESLint
  -> build adapters / CLI / language-server
  -> framework adapters / VS Code / examples / site
```

## Ownership Rules

- Rust crates are the only semantic implementation.
- `@master/css-schema` owns versioned dependency-light contracts and codecs.
- `@master/css` owns the public Manifest v1 execution surface and CSS entry proxies.
- `@master/css-preset` owns default CSS source and the generated default manifest.
- `@master/css-compiler` owns compiler, project, stylesheet, and project-diagnostics
  orchestration.
- `@master/css-tooling` owns public lexer, source, scanner, validator, lint, language,
  and dependency-light diagnostics sessions.
- `@master/css-runtime` owns DOM/CSSOM behavior around runtime Wasm.
- `@master/css-language-service` owns editor-document mapping and Shiki/TextMate assets.
- `@master/eslint-plugin-css` owns only ESLint AST and fixer adaptation.
- `@master/eslint-config-css` remains the deliberate thin public flat-config preset.
- `@master/css-build-internal` is private, official-only, and bundled into its
  published consumers.
- Official Vue/Svelte extraction adapters are private implementation details. Do not
  restore a public third-party adapter registry.

## Retired Boundaries

Do not restore public engine, project, stylesheet, lexer, source, scanner, validator,
diagnostics, lint, language, or integration packages. Use the consolidated subpaths
documented in `.ai/package-map.md`.

## Escalate When

- A dependency edge seems necessary across layers: read `.ai/architecture.md`,
  `.ai/package-map.md`, and `.ai/boundaries.md`.
- Public exports, config shapes, virtual ids, or package names change: inspect all
  downstream packages and add validation.
- A cycle appears: move contracts to schema, semantics to the owning Rust crate,
  compiler orchestration to compiler, or editor-neutral behavior to tooling.
- A proposed helper would enter runtime-imported modules but is not runtime behavior:
  move it to compiler/tooling and measure bundle impact when feasible.

## Do Not

- Do not implement TypeScript semantic fallbacks.
- Do not make `@master/css` depend on compiler, tooling, integrations, or editors.
- Do not make tooling depend on compiler, language-service, build adapters, or UI hosts.
- Do not publish or emit imports to the private integration package.
- Do not solve package pressure by creating another public wrapper package.
