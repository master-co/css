# AI Notes For `@master/css-configer`

## Responsibility

This package locates Master CSS config files directly. Script configs are loaded as native ESM through Node module hooks, transformed with Oxc when TypeScript/JSX syntax needs stripping, and scanned with Oxc parser/resolver so local script imports are reported as dependencies. CSS configs are loaded by wiring `@master/css-compiler` and the core CSS directive adapter into the dependency-free loader factory from `shared`; local relative CSS imports are resolved without making the compiler depend on `@master/css`.

## Main Files

- `src/explore.ts`
- `src/explore-sync.ts`
- `src/load.ts`
- `src/load-sync.ts`
- `src/path.ts`
- `src/module.ts`
- `src/options.ts`
- `src/script.ts`

## Risks

- Config loading executes or imports user config.
- CWD and file name behavior affects CLI, extractor, Vite, language server, and ESLint.
- VS Code bundles this package; Oxc native/wasm transformer assets must remain available from the extension `dist` directory.

## Rules

- Keep default config name as `master.css`.
- Do not change path resolution behavior without downstream validation.
- Keep script config loading native ESM; do not reintroduce CJS config transforms.
- The package has no root export. Use explicit subpaths: `./explore`, `./explore-sync`, `./load`, `./load-sync`, `./path`, and `./module`.
- `loadConfig()` lives under `@master/css-configer/load` and returns both the resolved config and dependency paths; call sites that only need config should read `.config`.
- Preserve CSS and script config dependency reporting for Vite watch/HMR.
- Re-export `?master-css-config` query helpers and virtual module id helpers from `@master/css-configer/module`; keep their dependency-free implementation in `shared`.

## Validation

```sh
pnpm --filter @master/css-configer test
pnpm --filter @master/css-configer build
pnpm --filter @master/css-configer type-check
pnpm --filter @master/css-configer lint
```
