# @master/css-source

Source class extraction helpers for Master CSS tooling.

## Installation

```bash
npm install @master/css-source
```

## Responsibility

`@master/css-source` extracts unvalidated Master CSS class candidates from source text and provides source-format-aware adapters for HTML and JavaScript/TypeScript syntax.

It does not validate classes, generate CSS, maintain scanner state, observe file changes, or resolve manifests. Scanner state belongs to `@master/css-scanner`; file-change invalidation belongs to CLI/build/framework integrations; manifest resolution belongs to `@master/css-project`.

## API

```ts
import {
    extractClassCandidates,
    extractHTMLClasses,
    extractOxcClasses,
    htmlAdapter,
    oxcAdapter,
} from '@master/css-source'
```

### `extractClassCandidates()`

Extract raw class-like candidates from source content.

```ts
import { extractClassCandidates } from '@master/css-source'

const candidates = extractClassCandidates(`
    element.classList.add('transition:transform|.3s', dynamicClass)
`)
```

Candidates are intentionally unvalidated. Pass them through `@master/css-validator` or the scanner before generating CSS.

### Adapters

Use `./adapters` when a caller needs source adapter contracts without the full root API.

```ts
import { htmlAdapter, oxcAdapter } from '@master/css-source/adapters'
```

| Adapter | Purpose |
| --- | --- |
| `htmlAdapter` | Extracts class candidates from HTML-like sources. |
| `oxcAdapter` | Extracts class candidates from JavaScript and TypeScript sources through OXC parsing. |
