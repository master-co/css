# AI Notes For `@master/css.svelte`

## Responsibility

This package provides a Svelte runtime provider, a helper for accessing runtime context, and a SvelteKit server hook that renders CSS through `@master/css-server`.

## Main Files

- `src/lib/CSSRuntimeProvider.svelte`
- `src/lib/get-css-runtime.ts`
- `src/lib/index.ts`
- `src/hooks.server.ts`

## Risks

- Context key consistency.
- Svelte package output behavior.
- Server hook rendering all page chunks.
- Runtime cleanup on unmount.

## Rules

- Do not duplicate server/runtime logic here.
- Preserve Svelte packaging conventions.
- Add tests or example validation before behavior changes.

## Validation

```sh
pnpm --filter @master/css.svelte build
pnpm --filter @master/css.svelte check
pnpm --filter @master/css.svelte lint
```

