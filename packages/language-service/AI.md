# AI Notes For `@master/css-language-service`

## Responsibility

`@master/css-language-service` provides the stateful editor intelligence wrapper around manifest-driven Master CSS knowledge.

## Owns

- Language service settings and feature gating.
- Completion, hover/generated CSS previews, colors, and color presentations.
- `TextDocument` methods that delegate class-position and semantic token primitives to `@master/css-tooling/language`.
- Thin wrappers around editor-neutral language primitives.
- Shiki adaptation and the shipped TextMate grammar asset.

## Does Not Own

- Engine syntax behavior.
- LSP capabilities and workspace lifecycle.
- Editor-neutral semantic tokenizer and class-position scanner implementation; use `@master/css-tooling/language`.
- Raw class-list parsing and unescape behavior; that flows through `@master/css-tooling/language` from `@master/css-tooling/lexer`.
- Diagnostics without language-server coordination.

## Public Surface

- `MasterCSSLanguageService`
- `defaultLanguageServiceSettings`
- Feature functions and common constants
- `./common`
- `./shiki` and the TextMate grammar asset

## Key Files

- `src/core.ts`
- `src/shiki.ts`
- `src/shiki/hast.ts`
- `src/shiki/languages.ts`
- `src/settings.ts`
- `src/features/*`
- `src/utils/query-syntax-completions.ts`
- `src/utils/get-class-completion-items.ts`
- `src/utils/get-value-completion-items.ts`
- `src/utils/get-query-completion-items.ts`
- `src/utils/regex.ts`

## Risk Areas

- `getClassPosition()` delegation across supported document syntaxes.
- Completion trigger behavior and feature gating.
- Variable and color completion sorting.
- Generated CSS in hover docs.
- Consistency with engine rule matching.

## Constraints

- Handle class strings in each supported document syntax, not only HTML attributes.
- Return completions only inside accepted documents.
- Delegate semantic token and class-position scanning logic to tooling.
- Cover regex changes with affected framework fixtures.

## Validation

For behavior changes, use the focused tests below. Run lint for package changes; type-check/build when types or package output change. AI-guidance-only edits need lint and the root context check.

```sh
pnpm --filter @master/css-language-service test
pnpm --filter @master/css-language-service lint
pnpm --filter @master/css-language-service type-check
pnpm --filter @master/css-language-service build
```

For Shiki or grammar changes, use `tests/shiki.test.ts`, `tests/shiki-session.test.ts`, and `tests/rc87-shiki.test.ts`.

Use or extend `tests/get-class-position`, `tests/suggest-syntax`, `tests/inspect-syntax.test.ts`, `tests/render-semantic-tokens.test.ts`, `tests/render-css-semantic-tokens.test.ts`, `tests/render-syntax-colors.test.ts`, and `tests/edit-syntax-colors.test.ts`.
