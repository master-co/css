# AI Notes For `@master/css.vue`

## Responsibility

This package provides a Vue runtime provider around `@master/css-runtime`.

## Main Files

- `src/CSSRuntimeProvider.vue`
- `src/CSSRuntimeRegistry.vue`
- `src/index.ts`
- `src/runtime-provider.ts`
- `e2e/*`

## Risks

- Provider/injection timing.
- Runtime cleanup.
- Plan and root watchers.
- `CSSRuntimeRegistry` depends on `virtual:master-css-plan` and should remain the quick-start integration entry.
- `src/runtime-provider.ts` must remain free of `virtual:master-css-plan` imports for users that provide a plan manually.

## Rules

- Do not modify runtime core behavior here.
- Keep browser lifecycle changes covered by e2e tests.
- Do not add a default export to the root entry.

## Validation

```sh
pnpm --filter @master/css.vue e2e
pnpm --filter @master/css.vue build
pnpm --filter @master/css.vue type-check
```
