# @master/css-tooling

Rust-backed extraction and developer tooling for Master CSS.

## Installation

```bash
npm install @master/css-tooling
```

The package groups related tooling responsibilities behind explicit subpaths:

```ts
import { createToolingSession } from '@master/css-tooling'
import { analyzeClassList } from '@master/css-tooling/lexer'
import { extractSource } from '@master/css-tooling/source'
import { validateClassNames } from '@master/css-tooling/validator'
import { lintClassNames } from '@master/css-tooling/lint'
import { analyzeDocument } from '@master/css-tooling/language'
import { MasterCSSScanner } from '@master/css-tooling/scanner/node'
import { builtinKeyAliases } from '@master/css-tooling/builtins'
```

Every semantic operation requires an explicit manifest. Use
`createToolingSession({ manifest })` to share one backend/cache across validator,
lint, and language operations. Feature subpaths provide async one-shot APIs; their
`./node` entries provide native synchronous counterparts with a `Sync` suffix.
`MasterCSSScanner` is available only from `./scanner/node` and owns filesystem/watch
graph lifecycle.

Scanner source adapters are first-party implementation details. The package does not
provide a public third-party adapter registry.

Shiki helpers and the shared TextMate grammar live in
`@master/css-language-service`.
