# AI Notes For `@master/css-language-service`

## Responsibility

`@master/css-language-service` provides the stateful editor intelligence wrapper around manifest-driven Master CSS knowledge.

## Owns

- Language service settings and feature gating.
- Completion, hover/generated CSS previews, colors, and color presentations.
- `TextDocument` methods that delegate class-position and semantic token primitives to `@master/css-language`.
- Thin wrappers around editor-neutral language primitives.

## Does Not Own

- Engine syntax behavior.
- LSP capabilities and workspace lifecycle.
- Browser helpers, Shiki helpers, TextMate grammar ownership, semantic tokenizer ownership, or class-position scanner ownership.
- Diagnostics without language-server coordination.

## Public Surface

- `CSSLanguageService`
- `settings`
- Feature functions and common constants
- `./common`

## Key Files

- `src/core.ts`
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

## Safe Changes

- Focused completion, hover, color, or wrapper-level semantic token fixes.
- Framework-specific class-position fixtures.
- Tests for new syntax support.

## Dangerous Changes

- Assuming all class strings are HTML attributes.
- Returning completions outside accepted documents.
- Reintroducing browser, Shiki, grammar, semantic tokenizer, or class-position scanner ownership.
- Broad regex rewrites without framework-specific tests.

## Validation

```sh
pnpm --filter @master/css-language-service test
pnpm --filter @master/css-language-service lint
pnpm --filter @master/css-language-service type-check
pnpm --filter @master/css-language-service build
```

Use or extend `tests/get-class-position`, `tests/suggest-syntax`, `tests/inspect-syntax.test.ts`, `tests/render-syntax-colors.test.ts`, and `tests/edit-syntax-colors.test.ts`.
