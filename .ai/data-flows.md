# Data Flows

## Class To CSS

```txt
class string
  -> Rust EngineSession.ensure_class_rules(batch)
  -> match compiled utilities, including components-layer project styles
  -> parse values, functions, variables, selectors, modes, conditions
  -> declaration/value opcodes
  -> calculate stable rule priority and layer indexes
  -> insert referenced variables and animations
  -> transition/snapshot/resource IR
  -> TypeScript host applies CSS text or CSSOM mutations
```

Main files:

- `crates/mastercss-engine/src/lib.rs`
- `packages/engine/src/bound-engine.ts`

Risks:

- Class matching order changes can alter valid/invalid class behavior.
- Value parsing changes can alter many properties.
- Priority changes can alter cascade outcomes without changing declarations.
- Selector/condition parsing changes affect runtime, server, scanner, language service, and ESLint.

## CSS Authoring To Manifest

```txt
project CSS files containing @master entry; or @import "@master/css"
  -> Rust project core discovers project entries and owns load/merge policy
  -> TypeScript Node provider supplies package exports and file contents
  -> Rust compiler parses directives/native CSS and consumes the prepared graph
  -> Rust compiler lowers the result into MasterCSSManifest
  -> build tools / ESLint / language-server receive the same semantic project manifest
  -> Rust engine executes manifest variables, animations, selectors, conditions, utilities
```

Main files:

- `packages/project/src/entries.ts`
- `packages/project/src/manifest.ts`
- `packages/integration/src/manifest-module.ts`
- `packages/compiler/src/index.ts`
- `crates/mastercss-project/src/lib.rs`
- `crates/mastercss-compiler/src/lib.rs`
- `crates/mastercss-compiler/src/lower.rs`
- `crates/mastercss-engine/src/lib.rs`

Risks:

- Entry detection must only use project-level markers: `@master entry;` and `@import "@master/css"`.
- Package CSS such as `@master/css/index.css` must not contain or imply a project entry marker.
- `@master/css-project` must not implement CSS import graph, CSS manifest directive parsing, or manifest ABI schema.
- Manifest lowering order affects all manifest consumers.
- Variable aliases and modes affect inlining vs CSS custom property output.
- Static utility layer assignment affects semantic class output and cascade behavior.
- `?master-css-manifest` query ids, virtual module ids, and generated JavaScript module source helpers are integration protocol and belong in `@master/css-integration`, not `@master/css-project`.

## Build-Time Scanning

```txt
source globs / Vite modules / Webpack modules
  -> Rust ScannerSession
  -> Rust built-in extractor or custom host adapter candidates
  -> batched host CSS support oracle
  -> Rust classification and engine transition
  -> build tool / CLI registers managed CSS entries discovered by @master/css-project with @master/css-stylesheet
  -> @master/css-stylesheet compiles stylesheet CSS through @master/css-compiler
  -> combine stylesheet manifest returned by compiler with explicit manifest options
  -> export css.text / virtual CSS module through @master/css-stylesheet
  -> export emittedGlobals counts for generated variables and keyframes
```

Main files:

- `packages/scanner/src/core.ts`
- `crates/mastercss-scanner/src/lib.rs`
- `crates/mastercss-source/src/lib.rs`
- `packages/stylesheet/src/index.ts`
- `packages/vite/src/modes/static.ts`
- `packages/vite/src/plugins/virtual-css-module.ts`
- `packages/webpack/src/index.ts`

Risks:

- False positives increase CSS output.
- False negatives omit required CSS.
- Static rendering cannot infer truncated dynamic strings.

## Runtime

```txt
document or shadow root
  -> initCSSRuntime({ manifest, emittedGlobals, root, autoObserve })
  -> CSSRuntime.observe()
  -> register emittedGlobals variable/keyframe counts
  -> find or create style#master-css
  -> hydrate pre-rendered layers or add connected classes
  -> MutationObserver detects class and child changes
  -> classCounts increments/decrements
  -> add/remove rules in native stylesheet
```

Main files:

- `packages/runtime/src/core.ts`
- `packages/runtime/src/layer.ts`
- `packages/runtime/src/utility-layer.ts`
- `packages/runtime/src/init.ts`

Risks:

- Hydration must reconstruct virtual rules from native CSS rules.
- Native CSSRule order must match engine layer priority.
- Class count bugs can leak or remove active rules.

## Language Tooling

```txt
TextDocument + cursor
  -> Rust LanguageSession analyze/complete/inspect/format/color request
  -> versioned UTF-16 ranges, semantic-token data, completion/inspection/color/edit IR
  -> CSSLanguageService maps IR to TextDocument/LSP values
  -> language-server returns the LSP response
```

Main files:

- `packages/language/src/utils/get-class-positions.ts`
- `crates/mastercss-language/src/lib.rs`
- `packages/language/src/rust-session.ts`
- `packages/language-service/src/core.ts`
- `packages/language-service/src/features/*`
- `packages/language-server/src/core.ts`

Note: syntax diagnostics are currently handled mainly by `@master/eslint-plugin-css`, not by LSP diagnostics.
