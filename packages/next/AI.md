# AI Notes For `@master/css.next`

## Responsibility

`@master/css.next` integrates Master CSS with Next.js. It supports build-time HTML pre-rendering through the Next.js Adapter API and static rendering through a generated CSS file plus Turbopack scanner loader.

## Scope

- This package supports `pre-render` and `static` modes.
- It does not transform dynamic SSR responses.
- It does not implement App Router request-time class collection.
- Static mode must not rely on `nextConfig.webpack` or `@master/css.webpack`.
- Static mode uses `CSSScanner` as the source of static rendering behavior; dev updates are driven by Turbopack rerunning the static loaders for graph modules and registered loader dependencies.
- `CSSRuntimeRegistry` is imported from `@master/css.react`; do not alias it to generated App Router files.
- Turbopack JS manifest-import rules must stay guarded by `content: /master-css-manifest/` so unrelated client modules keep their native Next client boundary handling.

## Public APIs

- default `withMasterCSS()`
- named `withMasterCSS`
- `createAdapter`
- `renderNextBuildOutputs`

## Core Files

- `src/index.ts`
- `src/adapter.ts`
- `src/static.ts`
- `src/static-css-loader.ts`
- `src/static-loader.ts`
- `src/options.ts`

## Risks

- Next Adapter API type changes across Next major versions.
- Accidentally processing non-HTML assets.
- Duplicate writes when the same fallback HTML is listed through multiple output groups.
- Hiding request-time limitations behind a build-time adapter.
- Turbopack loader behavior is an incremental scanner; source-glob extraction remains the correctness baseline.
- Over-broad Turbopack JS loader rules can break Next/Turbopack client component classification for linked workspace packages.

## Validation

```sh
pnpm --filter @master/css.next test
pnpm --filter @master/css.next type-check
pnpm --filter @master/css.next build
```

For integration changes, build `packages/next/playground` when practical.
