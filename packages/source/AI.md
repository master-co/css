# AI Notes For `@master/css-source`

## Responsibility

`@master/css-source` exposes Rust-owned source-level class candidate extraction and thin host adapters shared by static rendering and framework integrations.

## Owns

- Rust raw, HTML, JavaScript/TypeScript, and Astro extraction.
- Versioned batch request/result IR and native/tooling-Wasm sessions.
- Svelte and Vue adapters that call official parsers and submit host ranges/content to Rust.
- Custom source adapter contracts.

## Does Not Own

- Class validation, scanner state, or CSS generation.
- Engine, compiler, runtime, server, language service, build integration, framework integration, examples, or site behavior.
- Low-level lexical ranges, directive/import scanners, class tokenization, or CSS unit constants; use `@master/css-lexer`.

## Public Surface

- `SourceAdapter`
- `SourceAdapterInput`
- `matchesSourceAdapter`
- `createSourceExtractor`
- `createSourceExtractorSync` under `./node`
- Source batch request/result types
- `./adapters`
- `./adapters/astro`
- `./adapters/svelte`
- `./adapters/vue`

## Key Files

- `src/session.ts`
- `src/node.ts`
- `src/browser.ts`
- `src/adapters/*`
- `src/index.ts`

## Risk Areas

- False positives increasing generated CSS.
- False negatives omitting required CSS.
- Adapter matching by file id/source extension.
- Optional Vue/Svelte parser peers must warn once and use the Rust raw extractor when missing.
- Native/tooling-Wasm extraction parity.

## Safe Changes

- Focused adapter matching fixes.
- Rust extraction or thin Svelte/Vue adapter fixes with fixtures.
- Candidate extraction tests that do not validate or generate CSS.

## Dangerous Changes

- Depending on scanner, engine, compiler, validator, runtime, server, language service, integrations, examples, or site.
- Moving validation or generated CSS insertion here.
- Assuming dynamic string concatenation is statically knowable.
- Adding TypeScript built-in extraction or parser fallbacks.

## Validation

```sh
pnpm --filter @master/css-source test
pnpm --filter @master/css-source lint
pnpm --filter @master/css-source type-check
pnpm --filter @master/css-source build
```
