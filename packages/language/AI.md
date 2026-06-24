# AI Notes For `@master/css-language`

## Responsibility

`@master/css-language` owns editor-neutral Master CSS language primitives.

## Owns

- Class-position scanning and `ClassPositionCache`.
- Semantic token classification and encoding.
- CSS directive scanning and editor source-position/provider scanning.
- Semantic token classification over class-list and directive ranges.
- Browser editor helpers.
- Shiki/TextMate integration and the canonical TextMate grammar asset.
- Language helpers such as `createLanguageCSS`, `defaultManifest`, and native declaration matching helpers.

## Does Not Own

- Stateful language service behavior.
- LSP capabilities or workspace lifecycle.
- VS Code extension code.
- Runtime, server, scanner, or ESLint behavior.
- Engine syntax or CSS output semantics.
- Raw class-list splitting/unescape semantics owned by `@master/css-lexer`.

## Public Surface

- Root language primitives.
- `./browser`
- `./shiki`
- `./syntaxes/master-css.tmLanguage.json`

## Key Files

- `src/index.ts`
- `src/browser.ts`
- `src/shiki.ts`
- `src/render-semantic-tokens.ts`
- `src/master-css.ts`
- `syntaxes/master-css.tmLanguage.json`

## Risk Areas

- Class-position scanning across JSX, Vue, Svelte, Astro, strings, and function calls.
- Semantic token classification for Master CSS class-list spans and directive class-list spans.
- Preserve raw editor ranges while using lexer class-list token/raw parsing.
- TextMate grammar compatibility for CSS-family documents.
- Browser and Shiki helper compatibility.

## Safe Changes

- Focused scanner or tokenizer fixes with fixtures.
- TextMate grammar fixes that preserve language-service ownership boundaries.
- Browser/Shiki helper fixes with tests.

## Dangerous Changes

- Importing language-service, language-server, VS Code, runtime, server, scanner, or ESLint packages.
- Routing CSS directive highlighting through the compiler pipeline.
- Changing engine syntax or generated CSS behavior here.

## Validation

```sh
pnpm --filter @master/css-language test
pnpm --filter @master/css-language lint
pnpm --filter @master/css-language type-check
pnpm --filter @master/css-language build
```

Use or extend browser, Shiki, class-position scanner, and semantic token tests.
