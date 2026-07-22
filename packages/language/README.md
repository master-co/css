# @master/css-language

Rust-backed document intelligence for Master CSS editors and language servers.

## Installation

```bash
npm install @master/css-language
```

## Language session

```ts
import { createLanguageSession, defaultManifest } from '@master/css-language'

const language = await createLanguageSession(defaultManifest)
const document = language.analyzeDocument({
  source,
  languageId: 'typescriptreact'
})
const completions = language.completionIndex()
language.dispose()
```

Rust owns UTF-16 class contexts, class tokenization, semantic-token data, completion
metadata, inspection, colors, directive formatting, diagnostics, and edit IR. Hosts map
that IR to LSP, VS Code, Markdown, cancellation, or other platform objects.

The universal entry prefers native in Node and falls back to `wasm-tooling`. Use the
native-only synchronous entry when required:

```ts
import { createLanguageSessionSync } from '@master/css-language/node'

const language = createLanguageSessionSync(defaultManifest)
```

The browser subpath loads only tooling Wasm and can receive custom Wasm initialization
options:

```ts
import { createLanguageSession } from '@master/css-language/browser'

const language = await createLanguageSession({ manifest })
```

Vue, Svelte, and custom-language hosts may supply ranges from their official parser;
JavaScript, TypeScript, HTML, CSS, Astro, and plain-text discovery is handled by Rust.

## Host adapters and assets

LSP `TextDocument` conversion belongs to `@master/css-language-service`.
`@master/css-language/shiki` and the TextMate grammar remain asset-oriented TypeScript
integrations; the Shiki transformer consumes Rust semantic-token IR and is not an
alternative semantic backend.

```ts
import { masterCSSShikiLanguage, transformerMasterCSS } from '@master/css-language/shiki'
```

If the native or Wasm backend cannot initialize, the API reports a typed backend error.
It never constructs a TypeScript engine.
