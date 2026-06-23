# AI Notes For `@master/css-source`

## Responsibility

`@master/css-source` owns source-level class candidate extraction and source adapters shared by static rendering and framework integrations.

## Owns

- Unvalidated class-like candidate extraction from raw source text.
- Source-format-aware HTML helpers.
- OXC-based JavaScript/TypeScript helpers.
- Source adapter matching and registration primitives.

## Does Not Own

- Class validation, scanner state, or CSS generation.
- Engine, compiler, runtime, server, language service, build integration, framework integration, examples, or site behavior.
- Low-level lexical ranges, directive/import scanners, class tokenization, or CSS unit constants; use `@master/css-lexer`.

## Public Surface

- `SourceAdapter`
- `SourceAdapterInput`
- `matchesSourceAdapter`
- `addClassString`
- `extractClassCandidates`
- HTML and OXC source constants and helpers
- `./adapters`

## Key Files

- `src/extract-class-candidates.ts`
- `src/adapters/*`
- `src/index.ts`

## Risk Areas

- False positives increasing generated CSS.
- False negatives omitting required CSS.
- Adapter matching by file id/source extension.
- OXC parsing differences across JS/TS syntax.

## Safe Changes

- Focused adapter matching fixes.
- HTML or OXC extraction fixes with fixtures.
- Candidate extraction tests that do not validate or generate CSS.

## Dangerous Changes

- Depending on scanner, engine, compiler, validator, runtime, server, language service, integrations, examples, or site.
- Moving validation or generated CSS insertion here.
- Assuming dynamic string concatenation is statically knowable.

## Validation

```sh
pnpm --filter @master/css-source test
pnpm --filter @master/css-source lint
pnpm --filter @master/css-source type-check
pnpm --filter @master/css-source build
```
