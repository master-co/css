# AI Notes For `@master/css-language`

## Responsibility

`@master/css-language` owns editor-neutral Master CSS language primitives: class-position scanning, semantic token classification, semantic token encoding, browser editor helpers, Shiki/TextMate integration, and language-specific Master CSS helpers.

## Inputs And Outputs

- Input: source text, `TextDocument`, language ids, class-position settings, optional `MasterCSSPlan`, optional `MasterCSS` instance.
- Output: class positions, highlight token items, semantic token items, encoded semantic tokens, Shiki decorations, TextMate grammar registration data.

## Public APIs

- Semantic token legend, token types, token modifiers, and scope map.
- Class-position scanning and `ClassPositionCache`.
- Class-list and CSS directive tokenizers.
- Browser semantic token helpers.
- Shiki helpers and `syntaxes/master-css.tmLanguage.json`.
- Master CSS language helpers such as `createLanguageCSS`, `defaultPlan`, and `matchesLanguageServiceNativeDeclaration`.

## Rules

- Do not import `@master/css-language-service`, `@master/css-language-server`, VS Code extension code, runtime, server, extractor, or ESLint packages.
- Keep APIs editor-neutral. Stateful service behavior belongs in `@master/css-language-service`; LSP capabilities and workspace lifecycle belong in `@master/css-language-server`.
- CSS directive lexical highlighting remains TextMate-first. Semantic tokens classify only Master CSS class-list spans and directive class-list spans.
- Do not change engine syntax or CSS output here.

## Required Tests

```sh
pnpm --filter @master/css-language test
pnpm --filter @master/css-language type-check
pnpm --filter @master/css-language build
```

Use or extend:

- `tests/browser.test.ts`
- `tests/shiki.test.ts`
- class-position scanner tests
- semantic token tests
