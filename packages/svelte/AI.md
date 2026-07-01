# AI Notes For `@master/css.svelte`

## Responsibility

`@master/css.svelte` provides a SvelteKit Vite wrapper, a compatibility Svelte source adapter re-export, and a SvelteKit server hook that injects early streamed CSS through `@master/css-server`.

## Owns

- Svelte adapter compatibility re-export and Vite wrapper.
- SvelteKit `hooks.server` integration.

## Does Not Own

- Runtime core behavior.
- Server rendering internals.
- Vite mode semantics beyond the wrapper.
- Generated CSS semantics.
- Svelte source extraction implementation; `@master/css-source` owns it.

## Public Surface

- `./adapter`
- `./vite`
- `./hooks.server`

## Key Files

- `src/lib/adapter.ts`
- `src/lib/server.ts`
- `src/lib/hooks.server.ts`
- `src/lib/vite.ts`

## Risk Areas

- Svelte package output behavior.
- Server hook streaming behavior and early CSS injection.
- `./adapter` must stay a re-export/wrapper over `@master/css-source`; do not duplicate extraction logic.

## Safe Changes

- Focused adapter, Vite wrapper, or hook fixes with tests or example validation.
- Packaging fixes that preserve public subpaths.

## Dangerous Changes

- Duplicating server or runtime logic here.
- Adding a default export to the root entry.
- Changing streaming behavior without validation.

## Validation

```sh
pnpm --filter @master/css.svelte test
pnpm --filter @master/css.svelte lint
pnpm --filter @master/css.svelte check
pnpm --filter @master/css.svelte build
```
