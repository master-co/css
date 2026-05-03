# AI Notes For `@master/css-explore-config`

## Responsibility

This package locates Master CSS config files directly and loads them with `jiti` using the local SWC wasm transformer.

## Main File

- `src/index.ts`

## Risks

- Config loading executes or imports user config.
- CWD and file name behavior affects CLI, extractor, Vite, language server, and ESLint.
- VS Code bundles this package; runtime transformer assets must remain available from the extension `dist` directory.

## Rules

- Keep default config name as `master.css`.
- Do not change path resolution behavior without downstream validation.
- Keep the `jiti` transformer explicit so config loading does not fall back to jiti's default Babel transformer.

## Validation

```sh
pnpm --filter @master/css-explore-config test
pnpm --filter @master/css-explore-config build
pnpm --filter @master/css-explore-config type-check
```
