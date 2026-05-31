# AI Notes For `@master/css-language-server`

## Responsibility

`@master/css-language-server` wraps the language service in LSP. It initializes workspace folders, loads config files, manages language service lifecycles, and handles completion, hover, document color, and color presentation requests.

## Inputs And Outputs

- Input: LSP connection, workspace folders, settings, text documents.
- Output: LSP capabilities and request responses.

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
- Config reload/restart fixes.
- Request handler fixes with tests.

## Forbidden Without Explicit Request

- Advertising new LSP capabilities without implementing and testing them.
- Changing config-loading semantics casually.
- Creating server-side dependencies on editor-specific extension code.

## Risk Areas

- `workspaces: 'auto'` discovery from config files and package dependencies.
- Closest workspace selection.
- Config loading with `@master/css-explore-config`.
- Restart behavior after config/settings saves.

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

- Add a monorepo fixture for config-file or package-dependency workspace resolution.
- Fix config reload and test restart behavior.

## Dangerous Changes

- Treating external documents as belonging to the wrong workspace.
- Loading config from an unintended directory.
- Adding diagnostics without client/server capability updates.
