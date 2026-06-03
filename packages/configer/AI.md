# AI Notes For `@master/css-configer`

## Responsibility

This package resolves Master CSS project-level CSS config entries, workspace roots, CSS import graphs, explicit CSS config resources, and Master CSS config virtual-module/query helpers. CSS configs are loaded by wiring `@master/css-compiler` and the core CSS directive adapter into the dependency-free loader factory from `shared`; local relative CSS imports and `@master/css` package CSS entry imports are resolved without making the compiler depend on `@master/css`.

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

## Rules

- The package has no root export. Use explicit subpaths: `./css`, `./load`, `./load-sync`, and `./module`.
- `loadConfig()` lives under `@master/css-configer/load` and returns both the resolved config and dependency paths; call sites that only need config should read `.config`.
- `loadProjectConfig()` / `loadProjectConfigSync()` are the canonical non-bundler APIs for project-level Master CSS config.
- `loadConfig()` and `loadConfigSync()` only accept CSS resources. JS/TS path config loading is intentionally unsupported.
- Preserve CSS config dependency reporting for Vite watch/HMR.
- Re-export `?master-css-config` query helpers and virtual module id helpers from `@master/css-configer/module`; keep their dependency-free implementation in `shared`.
- Do not hardcode package CSS dependency filenames such as `base.css`, `theme.css`, or `utilities.css`; resolve the `@master/css` CSS entry and derive dependencies from the CSS import graph.

## Validation

```sh
pnpm --filter @master/css-configer test
pnpm --filter @master/css-configer build
pnpm --filter @master/css-configer type-check
pnpm --filter @master/css-configer lint
```
