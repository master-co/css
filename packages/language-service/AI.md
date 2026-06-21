# AI Notes For `@master/css-language-service`

## Responsibility

`@master/css-language-service` provides the stateful service wrapper for editor intelligence using manifest-driven Master CSS knowledge. It owns service settings, feature gating, completion, hover/generated CSS previews, color information, color presentations, and `TextDocument` methods that delegate class-position scanning and semantic token classification to `@master/css-language`.

## Inputs And Outputs

- Input: `TextDocument`, cursor positions, LSP request context, language service settings, optional MasterCSSManifest.
- Output: completion items, hover docs, color info, color presentations, semantic token responses.

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

CSS directive lexical highlighting is TextMate-first and is implemented in `@master/css-language`. Language-service semantic token methods should remain thin wrappers around `@master/css-language` primitives. Do not route CSS directive highlighting through the full compiler pipeline.

The canonical Master CSS TextMate grammar asset lives in `@master/css-language/syntaxes/master-css.tmLanguage.json`. Do not reintroduce a language-service-local or VS Code-local grammar copy.

## Allowed Changes

- Focused completion, hover, color, or wrapper-level semantic token fixes.
- Adding tests for new syntax support.

## Forbidden Without Explicit Request

- Changing engine syntax behavior here.
- Adding diagnostics here without coordinating language-server capabilities.
- Reintroducing browser, Shiki, grammar, semantic tokenizer, or class-position scanner ownership here.
- Broad regex rewrites without framework-specific tests.

## Risk Areas

- `getClassPosition()` delegation across JSX, Vue, Svelte, Astro, strings, and function calls.
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
