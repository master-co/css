# AI Notes For `@master/css.astro`

## Responsibility

`@master/css.astro` adapts Master CSS to Astro. It wraps `@master/css.vite`, injects runtime code for runtime and progressive modes, and registers Astro middleware for pre-render and progressive server rendering.

## Owns

- Astro integration entrypoints and options.
- Astro middleware for server-rendered HTML CSS injection.
- Astro-specific runtime manifest preload and hydration wiring.

## Does Not Own

- Vite mode semantics; keep behavior aligned with `@master/css.vite`.
- Core runtime behavior, CSS generation, scanning, or server rendering.
- Astro source extraction implementation; `@master/css-source` owns it.
- Duplicate Vite HTML pre-render behavior unless duplicate style injection is handled.

## Public Surface

- Default Astro integration export.
- `./adapter` and `./middleware` subpaths.

## Key Files

- `src/core.ts`
- `src/adapter.ts`
- `src/options.ts`
- `src/middleware.ts`
- `src/server.ts`
- `src/runtime-manifest-preload.ts`
- `src/index.ts`

## Risk Areas

- Runtime script injection can duplicate Vite runtime injection.
- Progressive and pre-render modes depend on Astro middleware seeing HTML before it is sent or written.
- `./adapter` should remain a re-export/wrapper over `@master/css-source`.
- Tests are sparse, so integration behavior needs focused coverage or example validation.

## Safe Changes

- Focused Astro option or middleware fixes.
- Runtime/preload wiring fixes that stay aligned with Vite mode semantics.
- Tests or example validation for Astro integration behavior.

## Dangerous Changes

- Re-enabling Vite HTML pre-render plugin for Astro progressive/pre-render without duplicate-style handling.
- Changing runtime, scanner, server, or CSS generation behavior in this package.
- Diverging mode defaults from `@master/css.vite`.

## Validation

```sh
pnpm --filter @master/css.astro test
pnpm --filter @master/css.astro lint
pnpm --filter @master/css.astro type-check
pnpm --filter @master/css.astro build
```

Validate with an Astro example when Astro rendering behavior changes.
