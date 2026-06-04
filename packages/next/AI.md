# AI Notes For `@master/css.next`

## Responsibility

`@master/css.next` integrates Master CSS with Next.js. It supports build-time HTML pre-rendering through the Next.js Adapter API and static extraction through a generated CSS file plus Turbopack scanner loader.

## Scope

- This package supports `pre-render` and `extract` modes.
- It does not transform dynamic SSR responses.
- It does not implement App Router request-time class collection.
- Extract mode must not rely on `nextConfig.webpack` or `@master/css.webpack`.
- Extract mode uses `CSSExtractor` as the source of static extraction behavior.
- The adapter aliases `@master/css.react` to a generated App Router client entry so `CSSRuntimeRegistry` can be imported from server layouts while still resolving `virtual:master-css-config`.

## Public APIs

- default `withMasterCSS()`
- named `withMasterCSS`
- `createAdapter`
- `renderNextBuildOutputs`

## Core Files

- `src/index.ts`
- `src/adapter.ts`
- `src/extract.ts`
- `src/extract-css-loader.ts`
- `src/extract-loader.ts`
- `src/options.ts`

## Risks

- Next Adapter API type changes across Next major versions.
- Accidentally processing non-HTML assets.
- Duplicate writes when the same fallback HTML is listed through multiple output groups.
- Hiding request-time limitations behind a build-time adapter.
- Turbopack loader behavior is an incremental scanner; source-glob extraction remains the correctness baseline.
- Moving the generated React entry outside the App Router graph can break Next/Turbopack client component classification.

## Validation

```sh
pnpm --filter @master/css.next test
pnpm --filter @master/css.next type-check
pnpm --filter @master/css.next build
```

For integration changes, build `packages/next/playground` when practical.
