# AI Notes For `@master/css-manifest`

## Responsibility

This package resolves Master CSS project-level CSS manifest entries, workspace roots, explicit CSS manifest resources, and project manifest module source. Manifests are loaded by delegating CSS parsing, import graph resolution, and semantic lowering to `@master/css-compiler`. Virtual module and query id helpers live in `@master/css-integration`.

## Main Files

- `src/load.ts`
- `src/load-sync.ts`
- `src/css.ts`
- `src/options.ts`

## Risks

- CSS manifest loading affects ESLint, language tooling, Vite, Webpack, Next, Nuxt, CLI, and framework query loaders.
- `?master-css-manifest` module protocol must stay dependency-light in `@master/css-integration`.
- Project manifest discovery should stay here, not in extractor, ESLint, language-server, or individual build integrations.
- The manifest package must not implement CSS import graph resolution or CSS directive parsing.

## Rules

- The package has no root export. Use explicit subpaths: `./css`, `./load`, and `./load-sync`.
- `loadManifest()` lives under `@master/css-manifest/load` and returns both the resolved manifest and dependency paths; call sites that only need the manifest should read `.manifest`.
- `loadProjectManifest()` / `loadProjectManifestSync()` are the canonical non-bundler APIs for project-level Master CSS manifests.
- `loadManifest()` and `loadManifestSync()` only accept CSS resources. JavaScript/TypeScript manifest loading is intentionally unsupported.
- Preserve CSS dependency reporting for Vite watch/HMR.
- Use `@master/css-integration/manifest-module` for `?master-css-manifest` query helpers and virtual module id helpers.
- Entry discovery only checks top-level project markers: `@master;` and `@import "@master/css"`. Do not treat imported `@settings`/`@theme` blocks, top-level `@custom-variant` directives, or package CSS files as independent project entries.
- Do not hardcode package CSS dependency filenames such as `base.css` or `theme.css`; import graph dependencies come from the compiler result.

## Validation

```sh
pnpm --filter @master/css-manifest test
pnpm --filter @master/css-manifest build
pnpm --filter @master/css-manifest type-check
pnpm --filter @master/css-manifest lint
```
