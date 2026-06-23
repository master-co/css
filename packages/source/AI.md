# AI Notes For `@master/css-source`

## Responsibility

`@master/css-source` owns source-level class candidate extraction and source adapters shared by static rendering and framework integrations. It extracts unvalidated class-like candidates from raw source text and provides source-format-aware helpers for HTML and JavaScript/TypeScript syntax.

## Inputs And Outputs

- Input: source file id and source text.
- Output: unvalidated Master CSS class candidates from source adapters.

## Public APIs

- `SourceAdapter`
- `SourceAdapterInput`
- `matchesSourceAdapter`
- `addClassString`
- `extractClassCandidates`
- `HTML_SOURCE_EXT`
- `extractHTMLClasses`
- `htmlAdapter`
- `OXC_SOURCE_EXT`
- `extractOxcClasses`
- `oxcAdapter`
- `./adapters`

## Boundaries

- Do not depend on engine, compiler, scanner, validator, runtime, server, language service, build integrations, framework integrations, examples, or site.
- Keep this package limited to source text extraction. Static scanner state, filesystem watching, class validation, CSS generation, and stylesheet CSS composition belong in `@master/css-scanner`.
- Low-level lexical ranges, class tokenization, directive/import scanners, and CSS unit constants remain in `@master/css-lexer`.

## Required Tests

```sh
pnpm --filter @master/css-source test
pnpm --filter @master/css-source type-check
pnpm --filter @master/css-source build
pnpm --filter @master/css-source lint
```

Add focused tests for adapter matching, HTML extraction, OXC extraction, and class candidate extraction.
