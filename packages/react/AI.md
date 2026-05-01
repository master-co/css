# AI Notes For `@master/css.react`

## Responsibility

This package provides a React runtime provider and hook around `@master/css-runtime`.

## Main Files

- `src/CSSRuntimeProvider.tsx`
- `src/index.tsx`
- `src/types/provider-props.ts`
- `src/uses/*`
- `e2e/*`

## Risks

- Client-only runtime initialization.
- Cleanup on unmount.
- Refreshing runtime when config changes.
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

