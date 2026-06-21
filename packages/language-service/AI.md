# AI Notes For `@master/css-language-service`

## Responsibility

`@master/css-language-service` provides editor intelligence using plan-driven Master CSS knowledge. It finds class positions, returns completions, hover/generated CSS previews, color information, color presentations, and semantic token classifications.

## Inputs And Outputs

- Input: `TextDocument`, cursor positions, LSP request context, language service settings, optional MasterCSSPlan.
- Output: completion items, hover docs, color info, color presentations, semantic tokens.

## Public APIs

- `CSSLanguageService`
- `settings`
- feature functions
- common constants

## Core Files

- `src/core.ts`
- `src/features/*`
- `src/utils/query-syntax-completions.ts`
- `src/utils/get-class-completion-items.ts`
- `src/utils/get-value-completion-items.ts`
- `src/utils/get-query-completion-items.ts`
- `src/utils/regex.ts`

CSS directive lexical highlighting is TextMate-first. Language-service semantic tokens should only classify Master CSS class-list spans, including host class attributes/functions and CSS directive class-list spans such as bare `@compose` preludes or quoted `@safelist` strings. Master class strings consume lexer lexical tokens first, then language-service adds engine-backed semantic meaning through `css.generate()`. Do not route CSS directive highlighting through the full compiler pipeline.

The canonical Master CSS TextMate grammar asset lives at `syntaxes/master-css.tmLanguage.json` in this package. Shiki imports this JSON directly, and VS Code contributes/copies the same package asset; do not reintroduce a generated VS Code-local grammar copy.

## Allowed Changes

- Focused completion, hover, color, semantic token, or class-position fixes.
- Adding tests for new syntax support.

## Forbidden Without Explicit Request

- Changing engine syntax behavior here.
- Adding diagnostics here without coordinating language-server capabilities.
- Broad regex rewrites without framework-specific tests.

## Risk Areas

- `getClassPosition()` across JSX, Vue, Svelte, Astro, strings, and function calls.
- Completion trigger behavior.
- Variable and color completion sorting.
- Generated CSS in hover docs.

## Required Tests

```sh
pnpm --filter @master/css-language-service test
pnpm --filter @master/css-language-service type-check
pnpm --filter @master/css-language-service build
```

Use or extend:

- `tests/get-class-position`
- `tests/suggest-syntax`
- `tests/inspect-syntax.test.ts`
- `tests/render-syntax-colors.test.ts`
- `tests/edit-syntax-colors.test.ts`

## Good Changes

- Add a framework-specific class-position fixture.
- Fix a completion item and add a focused completion test.

## Dangerous Changes

- Assuming all class strings are HTML attributes.
- Returning completions outside accepted documents.
- Making completions inconsistent with engine rule matching.
