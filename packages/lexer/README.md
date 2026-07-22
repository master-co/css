# @master/css-lexer

Rust-backed lexical analysis for Master CSS tooling.

## Installation

```bash
npm install @master/css-lexer
```

## API

The root exports wire types only. Lexical work is submitted as one versioned batch
rather than one token at a time through a target-specific session.

```ts
import { createLexerSessionSync } from '@master/css-lexer/node'

const lexer = createLexerSessionSync()
const analysis = lexer.analyze({
  classLists: [{ source: 'fg:red:hover font:semibold' }],
  css: ['@import "@master/css";']
})
lexer.dispose()
```

The Node entry is native-only; browsers load only `wasm-tooling`. No TypeScript
tokenizer is shipped by the package.

For a browser session:

```ts
import { createLexerSession } from '@master/css-lexer/browser'

const lexer = await createLexerSession()
```

`@master/css-lexer/browser` accepts tooling Wasm initialization options. The root no
longer exports individual operational tokenizers or range scanners. Shiki and TextMate
presentation assets live in `@master/css-language`.

Use `@master/css-source` for source-format-aware class candidate extraction.
