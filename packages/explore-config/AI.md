# AI Notes For `@master/css-explore-config`

## Responsibility

This package locates Master CSS config files directly. Script configs are loaded as native ESM through Node module hooks, transformed with Oxc when TypeScript/JSX syntax needs stripping, and scanned with Oxc parser/resolver so local script imports are reported as dependencies. CSS configs are loaded through `@master/css-compiler` file compilation so local relative CSS imports are resolved.

## Main File

- `src/index.ts`
- `src/script.ts`

## Risks

- Config loading executes or imports user config.
- CWD and file name behavior affects CLI, extractor, Vite, language server, and ESLint.
- VS Code bundles this package; Oxc native/wasm transformer assets must remain available from the extension `dist` directory.

## Rules

- Keep default config name as `master.css`.
- Do not change path resolution behavior without downstream validation.
- Keep script config loading native ESM; do not reintroduce CJS config transforms.
- `loadConfig()` returns both the resolved config and dependency paths; call sites that only need config should read `.config`.
- Preserve CSS and script config dependency reporting for Vite watch/HMR.

## Validation

```sh
pnpm --filter @master/css-explore-config test
pnpm --filter @master/css-explore-config build
pnpm --filter @master/css-explore-config type-check
pnpm --filter @master/css-explore-config lint
```
