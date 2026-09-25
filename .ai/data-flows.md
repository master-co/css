# Data Flows

## Class To CSS

```txt
class string
  -> Rust EngineSession.ensure_class_rules(batch)
  -> match Manifest v1 utilities
  -> parse values, variables, selectors, modes, and conditions
  -> calculate stable priority and layer indexes
  -> insert referenced variables and animations
  -> transition / snapshot / resource IR
  -> @master/css TypeScript host applies CSS text or CSSOM mutations
```

Main files:

- `crates/mastercss-engine/src/session.rs`
- `crates/mastercss-engine/src/utility.rs`
- `crates/mastercss-engine/src/condition.rs`
- `crates/mastercss-engine/src/generation.rs`
- `packages/css/src/engine/bound-engine.ts`
- `packages/css/src/engine/create-engine.ts`

Risks:

- Matching changes alter valid/invalid class behavior.
- Priority changes alter cascade outcomes without changing declarations.
- Selector or condition changes affect runtime, server, scanning, language tooling,
  and ESLint.
- CSS bytes, layer order, and keyframe placement are behavioral contracts.

The envelope stays Manifest v1; executable manifests and hydration must carry
`languageVersion: 3`. Reject missing or unsupported language versions before
semantic execution. Native declaration output does not depend on host support
callbacks. CSS value checking belongs to compiler/tooling report or strict
failure policy, and browser support is a separate observation.

Conditions retain their ordered native wrappers and authored units. Named
conditions, variants, and modes share a collision-checked namespace. Mode
activation branches are explicit manifest data; theme variables inherit through
CSS, and the engine does not infer light/dark triggers or color-scheme.

## CSS Authoring To Manifest

```txt
project CSS containing @master entry; or @import "@master/css"
  -> Rust project policy discovers and merges entries
  -> @master/css-compiler/project supplies filesystem and package resolution
  -> Rust compiler parses directives and native CSS
  -> Rust compiler lowers Manifest v1 plus native CSS results
  -> compiler / integrations / ESLint / language-server share that manifest
  -> Rust engine executes the manifest
```

Main files:

- `packages/compiler/src/project/entries.ts`
- `packages/compiler/src/project/manifest.ts`
- `packages/compiler/src/index.ts`
- `crates/mastercss-project/src/lib.rs`
- `crates/mastercss-compiler/src/directives.rs`
- `crates/mastercss-compiler/src/manifest/`
- `crates/mastercss-compiler/src/lower/`

Risks:

- Only `@master entry;` and `@import "@master/css"` identify project entries.
- Package CSS entrypoints must not accidentally identify themselves as project roots.
- Import-graph order and manifest merge order affect every consumer.
- Static utility layers affect semantic class output and cascade behavior.
- Virtual ids and generated JavaScript module source are private official-integration
  protocol, not project semantics.

## Build-Time Scanning And Stylesheets

```txt
source files or build-tool modules
  -> @master/css-tooling/scanner
  -> Rust built-in extraction plus private official Vue/Svelte adapters
  -> owner-scoped source replacement and shared class reference counts
  -> Rust classification and engine transition
  -> @master/css-compiler/project discovers managed CSS entries
  -> @master/css-compiler/stylesheet compiles directives and native CSS
  -> combine manifest, native CSS, generated CSS, and emitted-global metadata
  -> official adapter publishes virtual CSS and manifest assets
```

Main files:

- `packages/tooling/src/scanner/core.ts`
- `packages/tooling/src/source/session.ts`
- `packages/compiler/src/stylesheet/index.ts`
- `packages/vite/src/modes/static.ts`
- `packages/webpack/src/plugin.ts`
- `packages/next/src/build-state.ts`
- `crates/mastercss-scanner/src/lib.rs`
- `crates/mastercss-source/src/lib.rs`

Risks:

- False positives increase CSS output; false negatives omit required CSS.
- Static rendering cannot infer arbitrary truncated dynamic strings.
- Source adapters are first-party implementation details, not a public registration API.
- Markdown/MDX AST extraction excludes prose, fences, inline code and frontmatter; live examples have parented virtual sources. Parse failure never becomes an empty update or raw fallback.
- `scanSource` replaces; `removeSource` withdraws virtual descendants; `reconcileSources` replaces exact owner membership. Native registrations and safelists have explicit owners.
- Node discovery shares project/workspace `.gitignore` policy. Explicit excludes and current build outputs win over includes.
- Stylesheet import order, extraction directives, and native CSS pruning affect exact bytes.

## Runtime

```txt
document or shadow root
  -> MasterCSSRuntime.start({ manifest, emittedGlobals, root, hydrationManifest })
  -> runtime.observe()
  -> register emitted variable/keyframe counts
  -> find or create style#master-css
  -> hydrate pre-rendered rules or connect current classes
  -> MutationObserver detects class and subtree changes
  -> class reference counts change
  -> runtime-Wasm engine transition
  -> add/remove native CSS rules in stable order
```

Main files:

- `packages/runtime/src/core.ts`
- `packages/runtime/src/host.ts`
- `packages/runtime/src/hydration.ts`
- `packages/runtime/src/mutation.ts`
- `packages/runtime/src/startup.ts`
- `packages/runtime/src/layer.ts`
- `packages/runtime/src/utility-layer.ts`
- `packages/runtime/src/class-tracker.ts`

Risks:

- Hydration must reconstruct the same virtual state as fresh execution.
- Native CSSRule order must match Rust priority and stable layer order.
- Reference-count errors can leak rules or remove active rules.

## Language Tooling

```txt
document text + cursor / requested range
  -> @master/css-tooling/language Rust session
  -> versioned UTF-16 analysis, completion, inspection, color, formatting, and edit IR
  -> @master/css-language-service maps IR to editor document values
  -> @master/css-language-server maps service results to LSP
  -> @master/css-vscode supplies extension lifecycle and active highlighting
```

Main files:

- `packages/tooling/src/language/rust-session.ts`
- `crates/mastercss-language/src/lib.rs`
- `packages/language-service/src/core.ts`
- `packages/language-service/src/shiki.ts`
- `packages/language-server/src/core.ts`

TextMate and Shiki presentation assets live in language-service. Framework-neutral
class policy and source ranges stay in Rust tooling sessions.

## Lint And Diagnostics

```txt
class list or project inputs
  -> Rust lint / scanner / report sessions in @master/css-tooling
  -> tooling reports CSS syntax/value knowledge without filtering emitted rules
  -> @master/eslint-plugin-css adapts diagnostics and edit plans to ESLint
  -> @master/css-compiler/diagnostics orchestrates complete project inspection
  -> CLI and MCP format or transport the report
```

Policy, sorting, classification, and report shape stay in Rust. ESLint visitors, CLI
output, and MCP transport must not reproduce those semantics.
