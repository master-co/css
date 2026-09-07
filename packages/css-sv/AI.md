# AI Notes For `@master/css-svelte-addon`

## Responsibility

`@master/css-svelte-addon` is the Svelte CLI add-on for one-time Master CSS setup in SvelteKit projects.

## Owns

- `sv add @master/css-svelte-addon` project setup.
- Installing the Master CSS Svelte integration package into the target app.
- Editing SvelteKit project files such as `vite.config`, root layout stylesheet imports, stylesheet entries, and `hooks.server`.

## Does Not Own

- Runtime or SSR rendering behavior.
- Hydration manifest generation.
- CSS output semantics.
- Svelte source extraction.
- Vite mode implementation.

## Public Surface

- Default `sv` add-on export.

## Key Files

- `src/index.ts`
- `src/transforms.ts`

## Risk Areas

- Idempotent project file edits.
- Preserving existing SvelteKit server hooks.
- Keeping Master CSS first in `sequence()` so its `transformPageChunk` runs after downstream transforms.

## Validation

```sh
pnpm --filter @master/css-svelte-addon test
pnpm --filter @master/css-svelte-addon lint
pnpm --filter @master/css-svelte-addon build
```
