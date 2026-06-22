# @master/css-lexer

Dependency-free lexical source scanners for Master CSS tooling.

## Installation

```bash
npm install @master/css-lexer
```

## Responsibility

`@master/css-lexer` identifies source ranges, directive boundaries, quoted strings, class lexical tokens, CSS manifest entry statements, and unit constants shared by Master CSS packages.

It does not validate classes, generate CSS, resolve manifests, compile directives, or extract source-level class candidates.

## API

```ts
import {
    collectCSSDirectiveRanges,
    findCSSManifestEntryStatements,
    tokenizeMasterCSSClass,
} from '@master/css-lexer'
```

Common uses:

| API area | Purpose |
| --- | --- |
| Source primitives | Stable offsets and source locations. |
| Directive ranges | Locate CSS directives and quoted arguments without compiling them. |
| Manifest entry scanners | Detect `@master;` and `@import '@master/css'` entry markers. |
| Class tokenizers | Split Master CSS class strings into lexical token ranges. |
| Unit constants | Shared lexical constants for CSS units. |

Use `@master/css-source` for source-format-aware class candidate extraction.
