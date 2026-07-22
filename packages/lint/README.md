# @master/css-lint

Rust-backed, framework-neutral Master CSS lint policy.

## Installation

```bash
npm install @master/css-lint
```

## API

```ts
import { createLintSession } from '@master/css-lint'

const lint = await createLintSession(manifest)
const result = lint.analyzeClassList('fg:red bg:blue', options)
lint.dispose()
```

Rust owns ordering, conflicts, partial conflicts, raw-value policy, canonical class and
group suggestions, diagnostics, and edit plans. Callers submit class lists in batches;
ESLint remains responsible only for AST traversal, source-range mapping, reports, and
fix application.

The universal factory prefers native in Node and falls back to `wasm-tooling`. For a
native-only synchronous session:

```ts
import { createLintSessionSync } from '@master/css-lint/node'
```

Backend absence is an explicit error. There is no TypeScript lint-policy or engine
fallback.
