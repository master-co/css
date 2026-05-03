# AI Notes For `@master/css.nuxt`

## Responsibility

This package provides a Nuxt module that wires Master CSS into Vite, Nitro, client runtime, and server pre-render workflows.

## Main Files

- `src/module.ts`
- `src/options.ts`
- `src/runtime/css-runtime.ts`
- `src/runtime/css-server.ts`
- `test/fixtures/*`

## Risks

- SSR and Nitro virtual config aliases.
- Nuxt inline styles behavior in extract mode.
- Client/server mode differences.
- Generated `.output` fixture content should not be changed casually.

## Rules

- Keep mode behavior aligned with Vite package semantics.
- Do not add browser-only code to server runtime.
- Do not alter Nuxt build options unless mode behavior requires it.

## Validation

```sh
pnpm --filter @master/css.nuxt test
pnpm --filter @master/css.nuxt build
pnpm --filter @master/css.nuxt lint
```

