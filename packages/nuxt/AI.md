# AI Notes For `@master/css.nuxt`

## Responsibility

This package provides a Nuxt module that wires Master CSS into Vite, Nitro, client runtime, and server pre-render workflows.

## Main Files

- `src/module.ts`
- `src/options.ts`
- `src/runtime/css-runtime.ts`
- `src/runtime/css-server.ts`
- `tests/fixtures/*`

## Risks

- SSR and Nitro virtual config aliases.
- Nuxt inline styles behavior in static mode.
- Client/server mode differences.
- Generated `.output` fixture content should not be changed casually.

## Rules

- Keep mode behavior aligned with Vite package semantics.
- Use `@master/css.vue/vite` for the Vite plugin so Vue SFC extraction is owned by the Vue integration.
- Do not add browser-only code to server runtime.
- Do not alter Nuxt build options unless mode behavior requires it.

## Validation

```sh
pnpm --filter @master/css.nuxt test
pnpm --filter @master/css.nuxt build
pnpm --filter @master/css.nuxt lint
```
