# AI Notes For `@master/css-configer`

## Responsibility

This package resolves Master CSS project-level CSS config entries, workspace roots, explicit CSS config resources, and project config module source. CSS configs are loaded by delegating CSS parsing, import graph resolution, and semantic config compilation to `@master/css-compiler`. Virtual module and query id helpers live in `@master/css-integration`.

## Main Files

- `src/load.ts`
- `src/load-sync.ts`
- `src/css.ts`
- `src/options.ts`

## Risks

- CSS config loading affects ESLint, language tooling, Vite, Webpack, Next, Nuxt, CLI, and framework query loaders.
- `?master-css-config` module protocol must stay dependency-light in `@master/css-integration`.
- Project config discovery should stay here, not in extractor, ESLint, language-server, or individual build integrations.
- Configer must not implement CSS import graph resolution or CSS config directive parsing.

## Rules

- The package has no root export. Use explicit subpaths: `./css`, `./load`, and `./load-sync`.
- `loadConfig()` lives under `@master/css-configer/load` and returns both the resolved config and dependency paths; call sites that only need config should read `.config`.
- `loadProjectConfig()` / `loadProjectConfigSync()` are the canonical non-bundler APIs for project-level Master CSS config.
- `loadConfig()` and `loadConfigSync()` only accept CSS resources. JS/TS path config loading is intentionally unsupported.
- Preserve CSS config dependency reporting for Vite watch/HMR.
- Use `@master/css-integration/config-module` for `?master-css-config` query helpers and virtual module id helpers.
- Entry discovery only checks top-level project markers: `@master;` and `@import "@master/css"`. Do not treat imported `@settings`/`@theme` blocks, top-level `@custom-at`/`@custom-selector` directives, or package CSS files as independent project entries.
- Do not hardcode package CSS dependency filenames such as `base.css` or `theme.css`; import graph dependencies come from the compiler result.

## Validation

```sh
pnpm --filter @master/css-configer test
pnpm --filter @master/css-configer build
pnpm --filter @master/css-configer type-check
pnpm --filter @master/css-configer lint
```
