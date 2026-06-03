# AI Notes For `@master/css-configer`

## Responsibility

This package resolves Master CSS project-level CSS config entries, workspace roots, explicit CSS config resources, and Master CSS config virtual-module/query helpers. CSS configs are loaded by delegating CSS parsing, import graph resolution, and semantic config compilation to `@master/css-compiler`.

## Main Files

- `src/load.ts`
- `src/load-sync.ts`
- `src/css.ts`
- `src/module.ts`
- `src/options.ts`

## Risks

- CSS config loading affects ESLint, language tooling, Vite, Webpack, Next, Nuxt, CLI, and framework query loaders.
- `?master-css-config` module source must stay dependency-free at the `shared` boundary.
- Project config discovery should stay here, not in extractor, ESLint, language-server, or individual build integrations.
- Configer must not implement CSS import graph resolution or `@master {}` parsing.

## Rules

- The package has no root export. Use explicit subpaths: `./css`, `./load`, `./load-sync`, and `./module`.
- `loadConfig()` lives under `@master/css-configer/load` and returns both the resolved config and dependency paths; call sites that only need config should read `.config`.
- `loadProjectConfig()` / `loadProjectConfigSync()` are the canonical non-bundler APIs for project-level Master CSS config.
- `loadConfig()` and `loadConfigSync()` only accept CSS resources. JS/TS path config loading is intentionally unsupported.
- Preserve CSS config dependency reporting for Vite watch/HMR.
- Re-export `?master-css-config` query helpers and virtual module id helpers from `@master/css-configer/module`; keep their dependency-free implementation in `shared`.
- Entry discovery only checks top-level project markers: `@master;` and `@import "@master/css"`. Do not treat `@master shake;`, `@master no-shake;`, imported `@master {}` blocks, or package CSS files as independent project entries.
- Do not hardcode package CSS dependency filenames such as `base.css`, `theme.css`, or `utilities.css`; import graph dependencies come from the compiler result.

## Validation

```sh
pnpm --filter @master/css-configer test
pnpm --filter @master/css-configer build
pnpm --filter @master/css-configer type-check
pnpm --filter @master/css-configer lint
```
