# AI Notes For `@master/css.next`

## Responsibility

`@master/css.next` integrates Master CSS with Next.js Adapter API. It post-processes build-time HTML outputs, renders page-required CSS with `@master/css-server`, and writes the injected HTML back to the Next build output.

## Scope

- This package supports build-time pre-rendering only.
- It does not transform dynamic SSR responses.
- It does not implement App Router request-time class collection.

## Public APIs

- default `withMasterCSS()`
- named `withMasterCSS`
- `createAdapter`
- `renderNextBuildOutputs`

## Core Files

- `src/index.ts`
- `src/adapter.ts`
- `src/options.ts`

## Risks

- Next Adapter API type changes across Next major versions.
- Accidentally processing non-HTML assets.
- Duplicate writes when the same fallback HTML is listed through multiple output groups.
- Hiding request-time limitations behind a build-time adapter.

## Validation

```sh
pnpm --filter @master/css.next test
pnpm --filter @master/css.next type-check
pnpm --filter @master/css.next build
```

For integration changes, build `packages/next/playground` when practical.
