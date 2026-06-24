# AI Notes For `@master/css-project`

## Responsibility

`@master/css-project` resolves project-level Master CSS manifest entries, workspace roots, explicit CSS manifest resources, and project manifest module source.

## Owns

- Project entry discovery for top-level project markers.
- `loadProjectManifest()` and `loadProjectManifestSync()`.
- CSS resource manifest loading delegation to compiler.
- Dependency reporting for Vite watch/HMR consumers.

## Does Not Own

- CSS import graph resolution or directive parsing; delegate to `@master/css-compiler`.
- Virtual module and query id helpers; use `@master/css-integration`.
- Public schema and wire-format contracts; use `@master/css-schema`.
- Engine matching, runtime hydration, extraction state, or framework adapter behavior.

## Public Surface

- No root export.
- Explicit subpaths: `./entries`, `./manifest`, and `./manifest-sync`.
- `loadManifest()` returns both resolved manifest and dependency paths; call sites that only need the manifest should read `.manifest`.

## Key Files

- `src/entries.ts`
- `src/manifest.ts`
- `src/manifest-sync.ts`
- `src/options.ts`

## Risk Areas

- Manifest loading affects ESLint, language tooling, Vite, Webpack, Next, Nuxt, CLI, and framework query loaders.
- Entry discovery must only check top-level `@master entry;` and `@import "@master/css"` markers.
- CSS dependencies must come from compiler results, not hardcoded package CSS filenames.
- JavaScript/TypeScript manifest loading is intentionally unsupported.

## Safe Changes

- Focused project entry or manifest loading fixes with tests.
- Dependency reporting fixes for watch/HMR.
- Subpath API fixes that preserve package boundaries.

## Dangerous Changes

- Discovering entries in scanner, ESLint, language-server, or individual integrations instead.
- Treating imported directives or package CSS files as independent project entries.
- Implementing compiler, schema, engine, extraction, or framework behavior here.

## Validation

```sh
pnpm --filter @master/css-project test
pnpm --filter @master/css-project lint
pnpm --filter @master/css-project type-check
pnpm --filter @master/css-project build
```
