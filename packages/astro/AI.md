# AI Notes For `@master/css.astro`

## Responsibility

This package wraps `@master/css.vite` as an Astro integration and injects runtime code for runtime/progressive modes.

## Main Files

- `src/core.ts`
- `src/options.ts`
- `src/index.ts`

## Risks

- Runtime script injection can duplicate Vite runtime injection.
- Progressive mode currently warns that server render setup is not fully supported.
- Tests are sparse.

## Rules

- Keep mode behavior aligned with `@master/css.vite`.
- Do not hide the progressive warning without implementing support.
- Validate with an Astro example when behavior changes.

## Validation

```sh
pnpm --filter @master/css.astro build
pnpm --filter @master/css.astro type-check
pnpm --filter @master/css.astro lint
```

