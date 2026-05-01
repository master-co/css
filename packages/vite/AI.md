# AI Notes For `@master/css.vite`

## Responsibility

`@master/css.vite` integrates Master CSS into Vite. It supports `runtime`, `extract`, `pre-render`, and `progressive` modes, handles config virtual modules, injects runtime/normal CSS/virtual CSS imports, avoids FOUC, and pre-renders HTML.

## Inputs And Outputs

- Input: Vite config, plugin options, entry modules, HTML, source transforms.
- Output: Vite plugins, transformed entry code, virtual modules, generated CSS assets, pre-rendered HTML.

## Public APIs

- default `masterCSS()` plugin factory
- `options`
- `PluginOptions`
- `PluginContext`
- common constants

## Core Files

- `src/core.ts`
- `src/options.ts`
- `src/common.ts`
- `src/modes/*`
- `src/plugins/*`
- `src/factories/with-injection-transform.ts`

## Allowed Changes

- Focused plugin-mode fixes.
- Entry injection fixes with snapshots.
- Virtual CSS/HMR fixes with tests.

## Forbidden Without Explicit Request

- Changing default mode or option defaults casually.
- Changing injected runtime code without runtime/integration validation.
- Changing virtual module IDs casually.

## Risk Areas

- Entry detection in `ENTRY_MODULE_PATTERNS`.
- Injection into `.vue`, `.svelte`, `.astro`, and JS/TS entry files.
- Static extraction HMR.
- `transformIndexHtml` pre-render behavior.
- SvelteKit pre-render skip.

## Required Tests

```sh
pnpm --filter @master/css.vite test
pnpm --filter @master/css.vite type-check
pnpm --filter @master/css.vite build
```

For integration-level changes, also run affected example builds when practical.

## Good Changes

- Add a fixture for an entry transform edge case.
- Fix FOUC HTML transform with a snapshot.

## Dangerous Changes

- Injecting duplicate imports.
- Breaking SSR builds with browser-only code.
- Replacing virtual CSS placeholder logic without asset tests.

