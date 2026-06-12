# AI Notes For `@master/css-language-server`

## Responsibility

`@master/css-language-server` wraps the language service in LSP. It initializes workspace folders, loads plan entry files, manages language service lifecycles, and handles completion, hover, document color, color presentation, and semantic token requests.

## Inputs And Outputs

- Input: LSP connection, workspace folders, settings, text documents.
- Output: LSP capabilities, request responses, and active/full semantic token responses.

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
- Plan reload/restart fixes.
- Request handler and semantic token mode fixes with tests.

## Forbidden Without Explicit Request

- Advertising new LSP capabilities without implementing and testing them.
- Changing plan-loading semantics casually.
- Creating server-side dependencies on editor-specific extension code.

## Risk Areas

- `workspaces: 'auto'` discovery from plan entry files and package dependencies.
- Closest workspace selection.
- Plan loading with `@master/css-plan`.
- Restart behavior after plan/settings saves.

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

- Add a monorepo fixture for plan-entry or package-dependency workspace resolution.
- Fix plan reload and test restart behavior.

## Dangerous Changes

- Treating external documents as belonging to the wrong workspace.
- Loading a plan from an unintended directory.
- Adding diagnostics without client/server capability updates.
