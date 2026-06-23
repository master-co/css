# AI Notes For `@master/css.svelte`

## Responsibility

`@master/css.svelte` provides Svelte runtime providers, runtime context helpers, a Svelte source adapter, a Vite wrapper, and a SvelteKit server hook that injects early streamed CSS through `@master/css-server`.

## Owns

- Svelte provider and registry components.
- Svelte runtime context helper.
- Svelte source adapter and Vite wrapper.
- SvelteKit `hooks.server` integration.

## Does Not Own

- Runtime core behavior.
- Server rendering internals.
- Vite mode semantics beyond the wrapper.
- Generated CSS semantics.

## Public Surface

- Root Svelte entrypoint.
- `./runtime-provider`
- `./adapter`
- `./vite`
- `./hooks.server`

## Key Files

- `src/lib/CSSRuntimeProvider.svelte`
- `src/lib/CSSRuntimeRegistry.svelte`
- `src/lib/get-css-runtime.ts`
- `src/lib/runtime-provider.ts`
- `src/lib/server.ts`
- `src/lib/hooks.server.ts`
- `src/lib/vite.ts`

## Risk Areas

- Context key consistency.
- Svelte package output behavior.
- Server hook streaming behavior and early CSS injection.
- Runtime cleanup on unmount.
- `CSSRuntimeRegistry` depends on `virtual:master-css-manifest` and should remain the quick-start integration entry.
- `src/lib/runtime-provider.ts` must remain free of `virtual:master-css-manifest` imports for manual manifest users.

## Safe Changes

- Focused provider, adapter, or hook fixes with tests or example validation.
- Packaging fixes that preserve public subpaths.

## Dangerous Changes

- Duplicating server or runtime logic here.
- Adding a default export to the root entry.
- Importing virtual manifest modules from manual provider entrypoints.
- Changing streaming behavior without validation.

## Validation

```sh
pnpm --filter @master/css.svelte test
pnpm --filter @master/css.svelte lint
pnpm --filter @master/css.svelte check
pnpm --filter @master/css.svelte build
```
