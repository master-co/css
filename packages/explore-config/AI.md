# AI Notes For `@master/css-explore-config`

## Responsibility

This package locates and loads Master CSS config files using `explore-config`.

## Main File

- `src/index.ts`

## Risks

- Config loading executes or imports user config.
- CWD and file name behavior affects CLI, extractor, Vite, language server, and ESLint.

## Rules

- Keep default config name as `master.css`.
- Do not change path resolution behavior without downstream validation.

## Validation

```sh
pnpm --filter @master/css-explore-config test
pnpm --filter @master/css-explore-config build
pnpm --filter @master/css-explore-config type-check
```

