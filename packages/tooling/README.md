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
`createToolingSession({ manifest })` to share one binding/cache across validator,
lint, and language operations. Feature subpaths provide async one-shot APIs; their
`./node` entries provide native synchronous counterparts with a `Sync` suffix.
`MasterCSSScanner` is available only from `./scanner/node` and owns filesystem/watch
graph lifecycle.

`scanner.scanSource(source, content)` uses the same built-in adapters and Rust
scanner as `scan`, returning a `MasterCSSScannerSourceResult` with `changed` and
all `candidates` extracted from that input. Candidates include repeated classes,
cache hits and blocklisted candidates; they are source occurrences, not a list of
newly generated rules. Use the scanner state for final classification. `scan` and
`scanModule` continue to return a boolean indicating a scanner change.

For host parsers that decode enclosing HTML before parsing expressions,
`session.decodeHTMLAttribute(source)` decodes attribute contents without their
delimiters and returns `{ value, spans }`. Each span maps a decoded UTF-16 `range`
to its original UTF-16 `sourceRange`; an entire character reference stays one
indivisible source span. The decoder follows HTML attribute reference rules and
input newline normalization. `MasterCSSDecodedHTMLAttribute` is available from
`@master/css-tooling/source`. Both native and tooling-Wasm bindings support this
operation; older bindings without the mapping response fail explicitly.

Scanner source adapters are first-party implementation details. The package does not
provide a public third-party adapter registry.

Shiki helpers and the shared TextMate grammar live in
`@master/css-language-service`.
