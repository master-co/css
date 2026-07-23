# Package Map

## Primary Public Surfaces

| Package | Entry points | Responsibility |
|---|---|---|
| `@master/css` | `.`, `./node`, CSS subpaths | Manifest v1 execution, engine sessions, public schema types, and stable preset CSS proxies |
| `@master/css-compiler` | `.`, `./node`, `./browser`, `./project*`, `./stylesheet*`, `./diagnostics` | CSS directive compilation, project loading, stylesheet composition, and inspection orchestration |
| `@master/css-tooling` | `.`, `./node`, `./browser`, `./lexer*`, `./source*`, `./scanner*`, `./validator*`, `./lint*`, `./language*`, `./diagnostics` | Rust-backed extraction and developer-tooling sessions with platform adapters |

## Contracts And Artifact Delivery

| Package | Entry points | Responsibility |
|---|---|---|
| `@master/css-schema` | `.`, Manifest, directive, hydration, emitted-global, syntax, and runtime contract subpaths | Dependency-light versioned TypeScript/Rust wire contracts and pure codecs |
| `@master/css-preset` | `.`, `./default-manifest.json`, CSS subpaths | Default preset source and generated Manifest v1 |
| `@master/css-backend` | `.`, `./engine*`, `./compiler*`, `./tooling*` | Conditional native/Wasm broker, typed feature sessions, and ABI validation |
| `@master/css-native-<target>` | `.` | Platform-specific native artifacts; any bundled `mcss` executable is broker-internal and is not a package binary |
| `@master/css-wasm-engine` | `.`, `./wasm` | Runtime Wasm artifact loader |
| `@master/css-wasm-compiler` | `.`, `./wasm` | Compiler Wasm artifact loader |
| `@master/css-wasm-tooling` | `.`, `./wasm` | Tooling Wasm artifact loader |

Native, Wasm, schema, preset, and their consumers publish in exact lockstep. They are
not alternative implementations of the language.

## Runtime, Tooling Consumers, And Adapters

| Package | Entry points | Responsibility |
|---|---|---|
| `@master/css-runtime` | `.` | Browser DOM observation, CSSOM updates, hydration, and runtime lifecycle |
| `@master/css-server` | `.` | Server HTML rendering and CSS injection |
| `@master/css-language-service` | `.`, `./shiki`, TextMate grammar | Editor-document mapping plus presentation/highlighting assets |
| `@master/css-language-server` | `.`, `./server` | LSP transport and workspace lifecycle |
| `@master/eslint-plugin-css` | `.` | ESLint visitors, reports, fixer adaptation, and config implementation |
| `@master/eslint-config-css` | `.` | Deliberate thin official flat-config preset over the matching plugin version |
| `@master/css-vite` | `.` | Vite rendering modes and plugin orchestration; runtime bootstrap is private |
| `@master/css-webpack` | `.` | Webpack static/runtime integration |
| `@master/css-next` | `.`, `./adapter` | Next.js build and client instrumentation integration |
| `@master/css-astro` | `.`, `./middleware` | Astro integration |
| `@master/css-nuxt` | `.` | Nuxt module |
| `@master/css-svelte` | `./vite`, `./hooks.server` | Svelte and SvelteKit integration |
| `@master/css-cli` | `master-css` binary only | CLI frontend and native executable dispatch |
| `@master/create-css` | `.`, `create-css` binary | Project setup and dependency transforms |
| `@master/css-mcp` | `.` | Model Context Protocol server factories |
| `@master/css-svelte-addon` | `.` | Svelte CLI add-on |
| `@master/css-figma` | host artifact | Figma variable import/export plugin |
| `@master/css-vscode` | extension artifact, `./server` | VS Code extension; staged Marketplace id remains `master-css-vscode` |

## Repository-Private Package

| Package | Responsibility |
|---|---|
| `@master/css-internal` | Official virtual-module protocols, generated host modules, build defaults, and Node/workspace helpers bundled into published consumers |

The private internal package is an official integration kernel, not a public extension
point or generic utility package. Published manifests and built
JavaScript/declarations must not reference it.

## Retired Public Packages

The following responsibilities were consolidated and these package identities must not
be restored:

```txt
@master/css-engine          -> @master/css
@master/css-project         -> @master/css-compiler/project
@master/css-stylesheet      -> @master/css-compiler/stylesheet
@master/css-diagnostics     -> @master/css-compiler/diagnostics and @master/css-tooling/diagnostics
@master/css-lexer           -> @master/css-tooling/lexer
@master/css-source          -> @master/css-tooling/source
@master/css-scanner         -> @master/css-tooling/scanner
@master/css-validator       -> @master/css-tooling/validator
@master/css-lint            -> @master/css-tooling/lint
@master/css-language        -> @master/css-tooling/language and @master/css-language-service
@master/css-integration     -> private bundled module
```

The old dotted adapter names and unscoped npm VS Code name are also retired.

## Dependency Rules

- Rust owns semantics; TypeScript owns hosts and adapters.
- `@master/css-schema` stays dependency-light.
- `@master/css` does not depend on compiler or tooling.
- `@master/css-tooling` does not depend on compiler, language-service, adapters, or UI hosts.
- `@master/css-compiler` may consume dependency-light tooling sessions for source,
  validation, scanner, and report orchestration; tooling must not depend back on it.
- Runtime and server do not own compiler or editor behavior.
- Official adapters consume public compiler/tooling/runtime/server surfaces and bundle
  the private integration protocol.
- No public third-party adapter registry is supported.

## Tests

Most packages use package-local Vitest configuration. Runtime and framework behavior
uses Playwright where browser lifecycle matters. Changes to runtime injection,
manifest preload, rendering modes, or layer initialization must audit Vite, Webpack,
Next, Nuxt, Astro, and Svelte together.
