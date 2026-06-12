# AI Notes For `@master/css-plan`

## Responsibility

This package resolves Master CSS project-level CSS plan entries, workspace roots, explicit CSS plan resources, and project plan module source. Plans are loaded by delegating CSS parsing, import graph resolution, and semantic lowering to `@master/css-compiler`. Virtual module and query id helpers live in `@master/css-integration`.

## Main Files

- `src/load.ts`
- `src/load-sync.ts`
- `src/css.ts`
- `src/options.ts`

## Risks

- CSS plan loading affects ESLint, language tooling, Vite, Webpack, Next, Nuxt, CLI, and framework query loaders.
- `?master-css-plan` module protocol must stay dependency-light in `@master/css-integration`.
- Project plan discovery should stay here, not in extractor, ESLint, language-server, or individual build integrations.
- The plan package must not implement CSS import graph resolution or CSS directive parsing.

## Rules

- The package has no root export. Use explicit subpaths: `./css`, `./load`, and `./load-sync`.
- `loadPlan()` lives under `@master/css-plan/load` and returns both the resolved plan and dependency paths; call sites that only need the plan should read `.plan`.
- `loadProjectPlan()` / `loadProjectPlanSync()` are the canonical non-bundler APIs for project-level Master CSS plans.
- `loadPlan()` and `loadPlanSync()` only accept CSS resources. JavaScript/TypeScript plan loading is intentionally unsupported.
- Preserve CSS dependency reporting for Vite watch/HMR.
- Use `@master/css-integration/plan-module` for `?master-css-plan` query helpers and virtual module id helpers.
- Entry discovery only checks top-level project markers: `@master;` and `@import "@master/css"`. Do not treat imported `@settings`/`@theme` blocks, top-level `@custom-variant` directives, or package CSS files as independent project entries.
- Do not hardcode package CSS dependency filenames such as `base.css` or `theme.css`; import graph dependencies come from the compiler result.

## Validation

```sh
pnpm --filter @master/css-plan test
pnpm --filter @master/css-plan build
pnpm --filter @master/css-plan type-check
pnpm --filter @master/css-plan lint
```
