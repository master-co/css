# AI Notes For `@master/css.astro`

## Responsibility

This package wraps `@master/css.vite` as an Astro integration, injects runtime code for runtime/progressive modes, and registers Astro middleware for pre-render/progressive server rendering.

## Main Files

- `src/core.ts`
- `src/options.ts`
- `src/server.ts`
- `src/middleware.ts`
- `src/index.ts`

## Risks

- Runtime script injection can duplicate Vite runtime injection.
- Progressive/pre-render mode depends on Astro middleware receiving HTML responses before they are sent or written.
- Tests are sparse.

## Rules

- Keep mode behavior aligned with `@master/css.vite`.
- Do not re-enable Vite's HTML pre-render plugin for Astro progressive/pre-render unless duplicate style injection is handled.
- Validate with an Astro example when behavior changes.

## Validation

```sh
pnpm --filter @master/css.astro build
pnpm --filter @master/css.astro test --run
pnpm --filter @master/css.astro type-check
pnpm --filter @master/css.astro lint
```
