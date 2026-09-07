# AI Notes For `@master/css-nuxt`

## Responsibility

`@master/css-nuxt` wires Master CSS into Nuxt, Vite, Nitro, client runtime, and server pre-render workflows.

## Owns

- Nuxt module setup.
- Nuxt runtime aliases for client and server integration.
- Nuxt fixture tests and module options.

## Does Not Own

- Vite mode semantics.
- Vue SFC extraction; `@master/css-tooling/source` handles source parsing through scanner auto adapters.
- Core runtime, server, scanner, or CSS generation behavior.

## Public Surface

- Default Nuxt module export.

## Key Files

- `src/module.ts`
- `src/options.ts`
- `src/runtime/css-runtime.ts`
- `src/runtime/css-server.ts`
- `tests/fixtures/*`

## Risk Areas

- SSR and Nitro virtual manifest aliases.
- Nuxt inline styles behavior in static mode.
- Client/server mode differences.
- Generated `.output` fixture content.

## Safe Changes

- Focused module option or runtime alias fixes.
- Fixture-backed mode behavior fixes.

## Dangerous Changes

- Adding browser-only code to server runtime.
- Altering Nuxt build options unless mode behavior requires it.
- Changing generated `.output` fixtures casually.
- Diverging from Vite package semantics.

## Validation

```sh
pnpm --filter @master/css-nuxt test
pnpm --filter @master/css-nuxt lint
pnpm --filter @master/css-nuxt build
```
