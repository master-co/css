# AI Notes For `@master/css.react`

## Responsibility

`@master/css.react` provides React runtime registry, provider, and hooks around `@master/css-runtime`.

## Owns

- React provider and registry components.
- React hooks for runtime access.
- React browser lifecycle integration.

## Does Not Own

- Runtime core behavior.
- Integration virtual manifest generation.
- CSS generation, scanning, or server rendering.

## Public Surface

- Root React entrypoint.
- `./runtime-provider` for manual manifest provider usage.
- `CSSRuntimeRegistry` as the quick-start integration entry.

## Key Files

- `src/CSSRuntimeProvider.tsx`
- `src/CSSRuntimeRegistry.tsx`
- `src/runtime-provider.tsx`
- `src/index.tsx`
- `src/uses/*`
- `e2e/*`

## Risk Areas

- Client-only runtime initialization.
- Cleanup on unmount.
- Refreshing runtime when manifest changes.
- Destroy/recreate behavior when root changes.
- `CSSRuntimeRegistry` depends on `virtual:master-css-manifest` and must only be exposed through integration-aware entry points.
- `src/runtime-provider.tsx` must remain free of `virtual:master-css-manifest` imports for manual manifest users.

## Safe Changes

- Focused provider or hook fixes with e2e coverage.
- Lifecycle fixes that do not alter runtime core behavior.

## Dangerous Changes

- Moving runtime core behavior into React.
- Importing virtual manifest modules from manual provider entrypoints.
- Changing lifecycle behavior without browser coverage.

## Validation

```sh
pnpm --filter @master/css.react e2e
pnpm --filter @master/css.react lint
pnpm --filter @master/css.react type-check
pnpm --filter @master/css.react build
```
