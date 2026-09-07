# AI Notes For `@master/css-language-server`

## Responsibility

`@master/css-language-server` wraps the language service in LSP.

## Owns

- LSP server lifecycle.
- Workspace folder initialization and closest-workspace selection.
- Manifest entry loading and restart behavior.
- Completion, hover, document color, color presentation, and semantic token request handlers.

## Does Not Own

- Editor-neutral class scanning or semantic token primitives; use `@master/css-tooling/language`.
- Stateful feature implementation; use `@master/css-language-service`.
- VS Code extension activation or packaging.
- CSS directive lexical highlighting, which is TextMate-first.

## Public Surface

- `MasterCSSLanguageServer`
- `defaultLanguageServerSettings`
- `MasterCSSWorkspace` type

## Key Files

- `src/core.ts`
- `src/diagnostics.ts`
- `src/settings.ts`
- `src/utils/create-document.ts`
- `tests/fixtures/**`

## Risk Areas

- `workspaces: 'auto'` discovery from manifest entry files and package dependencies.
- Closest workspace selection for monorepos.
- Manifest loading through `@master/css-compiler/project`.
- Restart behavior after manifest or settings saves.
- Advertising LSP capabilities that are not implemented and tested.

## Safe Changes

- Workspace detection fixes with monorepo fixtures.
- Manifest reload/restart fixes.
- Request handler and semantic token mode fixes with tests.

## Dangerous Changes

- Treating external documents as belonging to the wrong workspace.
- Loading a manifest from an unintended directory.
- Adding diagnostics without client/server capability updates.
- Depending on editor-specific extension code.

## Validation

```sh
pnpm --filter @master/css-language-server test
pnpm --filter @master/css-language-server lint
pnpm --filter @master/css-language-server type-check
pnpm --filter @master/css-language-server build
```

Use or extend `tests/custom-workspace.test.ts`, `tests/monorepo.test.ts`, and `tests/fixtures`.
