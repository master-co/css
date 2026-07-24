# @master/css-compiler

Rust-backed CSS directive and manifest compilation for Master CSS.

## Installation

```bash
npm install @master/css-compiler
```

## Responsibility

The Rust compiler and project crates own parsing, directive lowering, manifest
compilation, normalization, native CSS transformation, graph policy, and project
merge policy. TypeScript is limited to platform loading, filesystem/package
resolution, file IO, host CSS capability checks, and orchestration.

## Universal session

```ts
import { createCompiler } from '@master/css-compiler'

const compiler = await createCompiler()
const result = compiler.compileCSS(source, { from: 'src/app.css' })
compiler.dispose()
```

The universal entry prefers the native binding in Node and falls back to
`binding-wasm-compiler`. It never runs a TypeScript parser, lowerer, or CSS transformer.
Session methods are synchronous after asynchronous initialization.

The session exposes batched Rust operations for CSS inspection, directive compilation,
theme compilation, dependency analysis, extraction-policy merging, manifest lowering
and normalization, default-preset compilation, and prepared import graphs.

## Native synchronous session

```ts
import { createCompilerSync } from '@master/css-compiler/node'

const compiler = createCompilerSync()
```

`createCompilerSync()` requires the native binding and throws
`NATIVE_UNAVAILABLE` when it cannot be loaded.

## Node file helpers

The root entry also provides Node convenience functions such as `compileCSSFile`,
`compileCSSManifestFile`, `compileProjectManifest`, and `resolveCSSImportGraph`.
These functions supply files and Node package `exports` resolution to the Rust
compiler; they do not contain a TypeScript semantic fallback.

## Browser entry

```ts
import { createCompiler } from '@master/css-compiler/browser'

const compiler = await createCompiler()
const result = compiler.compileCSS(source)
compiler.dispose()
```

The browser entry loads only `binding-wasm-compiler`. Browser compilation cannot resolve
filesystem `@reference` directives unless the host provides a prepared graph.

The former TypeScript `core`, `lowerCSSDirectives`, and
`createMasterCSSManifest` semantic exports are removed.

## Project, stylesheet, and inspection APIs

Project entry discovery and manifest loading are available from
`@master/css-compiler/project` and its `sync`, `entries`, and `workspace` subpaths.
Managed stylesheet composition is available from
`@master/css-compiler/stylesheet`; browser-safe compilation and directive helpers use
its explicit subpaths. Complete project inspection reports are exposed from
`@master/css-compiler/diagnostics`.

These are cohesive compiler host responsibilities. The former project, stylesheet,
and diagnostics package identities are retired.
