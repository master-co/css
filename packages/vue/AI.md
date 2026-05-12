# AI Notes For `@master/css.vue`

## Responsibility

This package provides a Vue runtime provider around `@master/css-runtime`.

## Main Files

- `src/CSSRuntimeProvider.vue`
- `src/index.ts`
- `e2e/*`

## Risks

- Provider/injection timing.
- Runtime cleanup.
- Config and root watchers.

## Rules

- Do not modify runtime core behavior here.
- Keep browser lifecycle changes covered by e2e tests.

## Validation

```sh
pnpm --filter @master/css.vue e2e
pnpm --filter @master/css.vue build
pnpm --filter @master/css.vue type-check
```
