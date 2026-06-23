# AI Notes For `@master/css.vue`

## Responsibility

`@master/css.vue` provides Vue runtime providers, Vue SFC extraction adapter support, and Vite integration helpers around `@master/css-runtime`.

## Owns

- Vue provider and registry components.
- Vue runtime provider entrypoint.
- Vue adapter and Vite helper subpaths.
- Vue browser lifecycle e2e coverage.

## Does Not Own

- Runtime core behavior.
- Vite mode semantics.
- Generated CSS semantics.
- Manual provider virtual manifest generation.

## Public Surface

- Root Vue entrypoint.
- `./runtime-provider`
- `./adapter`
- `./vite`

## Key Files

- `src/CSSRuntimeProvider.vue`
- `src/CSSRuntimeRegistry.vue`
- `src/runtime-provider.ts`
- `src/adapter.ts`
- `src/vite.ts`
- `src/use-css-runtime.ts`
- `e2e/*`

## Risk Areas

- Provider/injection timing.
- Runtime cleanup.
- Manifest and root watchers.
- `CSSRuntimeRegistry` depends on `virtual:master-css-manifest` and should remain the quick-start integration entry.
- `src/runtime-provider.ts` must remain free of `virtual:master-css-manifest` imports for manual manifest users.

## Safe Changes

- Focused provider, adapter, or Vite helper fixes with e2e coverage.
- Browser lifecycle fixes that keep runtime core behavior in runtime.

## Dangerous Changes

- Modifying runtime core behavior here.
- Adding a default export to the root entry.
- Importing virtual manifest modules from manual provider entrypoints.

## Validation

```sh
pnpm --filter @master/css.vue e2e
pnpm --filter @master/css.vue lint
pnpm --filter @master/css.vue type-check
pnpm --filter @master/css.vue build
```
