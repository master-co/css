# AI Notes For `@master/css-language`

## Responsibility

`@master/css-language` exposes Rust-owned editor-neutral Master CSS document intelligence through thin TypeScript sessions and host adapters.

## Owns

- Rust-backed UTF-16 class contexts, tokenization/classification, completions, inspection, colors, formatting, diagnostics, and edit IR.
- Native/Tooling-Wasm session lifecycle and version checks.
- LSP `TextDocument` and optional host-parser range adaptation.
- Shiki/TextMate integration and the canonical TextMate grammar asset.
- Default manifest and host CSS capability matching.

## Does Not Own

- Stateful language service behavior.
- LSP capabilities or workspace lifecycle.
- VS Code extension code.
- Runtime, server, scanner, or ESLint behavior.
- Engine syntax or CSS output semantics.
- Rust lexical semantics owned by `mastercss-lexer`.
- Manifest-driven class inspection semantics owned by Rust engine/language IR.

## Public Surface

- `createLanguageSession` and Rust-owned IR types.
- `createLanguageSessionSync` under `./node`.
- `./browser`
- `./shiki`
- `./syntaxes/master-css.tmLanguage.json`

## Key Files

- `src/index.ts`
- `src/browser.ts`
- `src/node.ts`
- `src/rust-session.ts`
- `src/shiki.ts`
- `src/master-css.ts`
- `syntaxes/master-css.tmLanguage.json`

## Risk Areas

- UTF-16 ranges across JSX, Vue, Svelte, Astro, CSS, strings, and function calls.
- Native and tooling-Wasm contract parity.
- Preserve raw editor ranges while mapping Rust IR.
- TextMate grammar compatibility for CSS-family documents.
- Browser and Shiki helper compatibility.

## Safe Changes

- Focused Rust analyzer/session adapter fixes with fixtures.
- TextMate grammar fixes that preserve language-service ownership boundaries.
- Browser/Shiki presentation adapter fixes with tests; token boundaries and classifications stay in Rust.

## Dangerous Changes

- Importing language-service, language-server, VS Code, runtime, server, scanner, or ESLint packages.
- Routing CSS directive highlighting through the compiler pipeline.
- Adding a TypeScript semantic fallback when native/Wasm initialization fails.
- Changing engine syntax or generated CSS behavior here.

## Validation

```sh
pnpm --filter @master/css-language test
pnpm --filter @master/css-language lint
pnpm --filter @master/css-language type-check
pnpm --filter @master/css-language build
```

Use or extend browser, Shiki, class-position scanner, and semantic token tests.
