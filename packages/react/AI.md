# AI Notes For `@master/css.react`

## Responsibility

This package provides a React runtime registry, provider, and hook around `@master/css-runtime`.

## Main Files

- `src/CSSRuntimeProvider.tsx`
- `src/CSSRuntimeRegistry.tsx`
- `src/index.tsx`
- `src/runtime-provider.tsx`
- `src/types/provider-props.ts`
- `src/uses/*`
- `e2e/*`

## Risks

- Client-only runtime initialization.
- `CSSRuntimeRegistry` depends on `virtual:master-css-manifest` and must only be exposed through integration-aware entry points.
- `src/runtime-provider.tsx` must remain free of `virtual:master-css-manifest` imports for users that provide a manifest manually.
- Cleanup on unmount.
- Refreshing runtime when manifest changes.
- Destroy/recreate behavior when root changes.

## Rules

- Do not change runtime core behavior here.
- Keep provider behavior small and predictable.
- Use e2e tests for browser lifecycle changes.

## Validation

```sh
pnpm --filter @master/css.react e2e
pnpm --filter @master/css.react build
pnpm --filter @master/css.react type-check
```
