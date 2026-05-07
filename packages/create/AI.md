# AI Notes For `@master/create-css`

## Responsibility

This package scaffolds Master CSS config files or downloads example projects.

## Main Files

- `src/bin/index.ts`
- `src/detect-app-tech.ts`
- `src/detect-app-ext.ts`
- `src/master-css-template.ts`
- `tests/*`

## Risks

- Downloads templates from GitHub.
- Runs package manager install commands.
- Writes config files.
- Detects app tech from config files and dependencies.

## Rules

- Do not change package manager commands casually.
- Do not overwrite files unless `--override` behavior requires it.
- Keep example branch/version assumptions explicit.

## Validation

```sh
pnpm --filter @master/create-css test
pnpm --filter @master/create-css build
pnpm --filter @master/create-css type-check
```
