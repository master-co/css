# @master/css-engine

Rust-backed manifest execution for Master CSS.

## Installation

```bash
npm install @master/css-engine
```

## Responsibility

`@master/css-engine` owns class matching, parsing, rule generation, priority ordering,
layers, variables, animations, resource identity, hydration state, and emitted CSS.
TypeScript exposes only a session wrapper around the native or runtime Wasm backend.

The package does not discover project files, resolve CSS imports, compile CSS
directives, inspect the DOM, or integrate with frameworks.

## Universal API

The universal entry creates a session asynchronously. Node prefers the native binding
and falls back to `wasm-runtime`; browsers load `wasm-runtime` directly. It never falls
back to a TypeScript engine.

```ts
import { createEngine } from '@master/css-engine'

const engine = await createEngine({ manifest })
engine.ensureClassRules(['text:center', 'font:semibold'])
console.log(engine.text)

const snapshot = engine.snapshot()
engine.dispose()
```

Session operations are synchronous after initialization and accept batches to avoid
fine-grained native/Wasm calls.

| API | Description |
| --- | --- |
| `createEngine({ manifest, emittedGlobals, backend? })` | Creates a native or runtime Wasm session. |
| `engine.ensureClassRules(classNames)` | Applies a batch of class additions and returns transition IR. |
| `engine.deleteClassRules(classNames)` | Applies a batch of class removals and returns transition IR. |
| `engine.refresh(manifest)` | Rebuilds the session against a complete Manifest v1 value. |
| `engine.inspect(className)` | Returns versioned Rust inspection IR. |
| `engine.snapshot()` | Returns generated CSS, rules, layers, and resource IR. |
| `engine.dispose()` | Releases backend state. |

## Native synchronous API

```ts
import { createEngineSync } from '@master/css-engine/node'

const engine = createEngineSync({ manifest })
```

`createEngineSync()` supports only the native binding. If the artifact is missing or
incompatible it throws a stable backend error; it does not load Wasm or a TypeScript
implementation.

The former `MasterCSS`, rule/layer object model, priority helper, compiler helper, and
inspection subpaths are no longer public. Use session IR from this package and schema
types from `@master/css-schema`.

## Related packages

- `@master/css` is the default-preset facade.
- `@master/css-compiler` compiles CSS directives and import graphs.
- `@master/css-runtime` applies engine transitions to DOM and CSSOM hosts.
