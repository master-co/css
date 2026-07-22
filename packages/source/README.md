# @master/css-source

Rust-backed source class extraction for Master CSS tooling.

## Installation

```bash
npm install @master/css-source
```

## API

```ts
import { createSourceExtractor } from '@master/css-source'

const extractor = await createSourceExtractor()
const result = extractor.extract({
  files: [
    { source: 'src/app.tsx', content: source, kind: 'oxc' },
    { source: 'index.html', content: html, kind: 'html' }
  ]
})
extractor.dispose()
```

The versioned batch API owns raw, JavaScript/TypeScript, HTML, and Astro extraction in
Rust. The universal entry prefers native in Node and falls back to `wasm-tooling`;
`@master/css-source/browser` loads only tooling Wasm.

Use the native-only synchronous entry when startup cannot be asynchronous:

```ts
import { createSourceExtractorSync } from '@master/css-source/node'
```

Svelte and Vue adapters remain platform shells: they invoke the official framework
parser, then send the resulting source regions to the Rust extractor. Custom adapters
may do the same. Candidates are intentionally unvalidated; scanner state and
classification belong to `@master/css-scanner`.

The former root extraction functions and TypeScript OXC/HTML parser implementations are
removed.
