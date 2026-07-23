# @master/css-tooling

Rust-backed extraction and developer tooling for Master CSS.

## Installation

```bash
npm install @master/css-tooling
```

The package groups related tooling responsibilities behind explicit subpaths:

```ts
import { createLexerSessionSync } from '@master/css-tooling/lexer/node'
import { createSourceExtractor } from '@master/css-tooling/source'
import CSSScanner from '@master/css-tooling/scanner'
import { createValidator } from '@master/css-tooling/validator'
import { createLintSession } from '@master/css-tooling/lint'
import { createLanguageSession } from '@master/css-tooling/language'
import { builtinKeyAliases } from '@master/css-tooling/builtins'
```

Use each feature's `./node` entry for synchronous native-only sessions and its
`./browser` entry when a tooling-Wasm browser loader is provided. Rust owns parsing,
classification, extraction, validation, lint policy, and language analysis; the
TypeScript modules only load bindings and adapt host capabilities.

Scanner source adapters are first-party implementation details. The package does not
provide a public third-party adapter registry.

Shiki helpers and the shared TextMate grammar live in
`@master/css-language-service`.
