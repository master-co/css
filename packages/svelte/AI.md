# AI Notes For `@master/css.svelte`

## Responsibility

This package provides a Svelte runtime provider, a helper for accessing runtime context, a Svelte source adapter, a Vite wrapper, and a SvelteKit server hook that injects early streamed CSS through `@master/css-server`.

## Main Files

- `src/lib/CSSRuntimeProvider.svelte`
- `src/lib/get-css-runtime.ts`
- `src/lib/index.ts`
- `src/lib/server.ts`
- `src/lib/hooks.server.ts`
- `src/lib/vite.ts`

## Risks

- Context key consistency.
- Svelte package output behavior.
- Server hook streaming behavior and early CSS injection.
- Runtime cleanup on unmount.

## Rules

- Do not duplicate server/runtime logic here.
- Preserve Svelte packaging conventions.
- Add tests or example validation before behavior changes.

## Validation

```sh
pnpm --filter @master/css.svelte build
pnpm --filter @master/css.svelte check
pnpm --filter @master/css.svelte test
pnpm --filter @master/css.svelte lint
```
