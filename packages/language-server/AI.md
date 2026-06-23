# AI Notes For `@master/css-language-server`

## Responsibility

`@master/css-language-server` wraps the language service in LSP. It initializes workspace folders, loads manifest entry files, manages language service lifecycles, and handles completion, hover, document color, color presentation, and semantic token requests. CSS directive lexical highlighting is provided by the `@master/css-language` TextMate grammar; server semantic tokens cover Master CSS class-list spans and manifest-aware classifications.

## Inputs And Outputs

- Input: LSP connection, workspace folders, settings, text documents.
- Output: LSP capabilities assembled from service trigger constants and the `@master/css-language` semantic token legend, request responses, and active/full semantic token responses.

## Public APIs

- `CSSLanguageServer`
- `settings`
- `Workspace` type

## Core Files

- `src/core.ts`
- `src/settings.ts`
- `src/utils/create-document.ts`

## Allowed Changes

- Workspace detection fixes.
- Manifest reload/restart fixes.
- Request handler and semantic token mode fixes with tests.

## Forbidden Without Explicit Request

- Advertising new LSP capabilities without implementing and testing them.
- Changing manifest-loading semantics casually.
- Creating server-side dependencies on editor-specific extension code.

## Risk Areas

- `workspaces: 'auto'` discovery from manifest entry files and package dependencies.
- Closest workspace selection.
- Manifest loading with `@master/css-project`.
- Restart behavior after manifest/settings saves.

## Required Tests

```sh
pnpm --filter @master/css-language-server test
pnpm --filter @master/css-language-server type-check
pnpm --filter @master/css-language-server build
```

Use or extend:

- `tests/custom-workspace.test.ts`
- `tests/monorepo.test.ts`
- `tests/fixtures`

## Good Changes

- Add a monorepo fixture for manifest-entry or package-dependency workspace resolution.
- Fix manifest reload and test restart behavior.

## Dangerous Changes

- Treating external documents as belonging to the wrong workspace.
- Loading a manifest from an unintended directory.
- Adding diagnostics without client/server capability updates.
