# AI Notes For `@master/css-language`

## Responsibility

This package owns the Master CSS language declaration and TextMate/Shiki grammar registrations.

## Main Files

- `src/grammars.ts`
- `src/declaration.ts`
- `syntaxes/*.json`

## Public APIs

- `grammars`
- `declaration`
- exports for `./grammars` and `./declaration`

## Risks

- Grammar changes affect VS Code, Shiki, docs highlighting, and package generation.
- `packages/vscode/generate.ts` reads this package to update VS Code grammar contributions.

## Rules

- Do not change grammar scope names casually.
- Keep `vscodeEmbeddedLanguages` separate from Shiki language registration.
- Test generated VS Code metadata if grammar registration changes.

## Validation

```sh
pnpm --filter @master/css-language build
pnpm --filter @master/css-language type-check
pnpm --filter master-css-vscode build
```

