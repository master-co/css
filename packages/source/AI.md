# AI Notes For `@master/css-source`

## Responsibility

`@master/css-source` owns source-level class extraction adapters shared by static rendering and framework integrations. It wraps dependency-free latent class scanning from `@master/css-lexer` with source-format-aware helpers for HTML and JavaScript/TypeScript syntax.

## Inputs And Outputs

- Input: source file id and source text.
- Output: latent Master CSS class candidates from source adapters.

## Public APIs

- `SourceAdapter`
- `SourceAdapterInput`
- `matchesSourceAdapter`
- `addClassString`
- `extractLatentClasses`
- `HTML_SOURCE_EXT`
- `extractHTMLClasses`
- `htmlAdapter`
- `OXC_SOURCE_EXT`
- `extractOxcClasses`
- `oxcAdapter`
- `./adapters`

## Boundaries

- Do not depend on engine, compiler, extractor, validator, runtime, server, language service, build integrations, framework integrations, examples, or site.
- Keep this package limited to source text extraction. Static extraction state, filesystem watching, class validation, CSS generation, and stylesheet CSS composition belong in `@master/css-extractor`.
- Raw tokenization and latent class candidate scanning remain in `@master/css-lexer`.

## Required Tests

```sh
pnpm --filter @master/css-source test
pnpm --filter @master/css-source type-check
pnpm --filter @master/css-source build
pnpm --filter @master/css-source lint
```

Add focused tests for adapter matching, HTML extraction, OXC extraction, and latent scanner re-exports.
