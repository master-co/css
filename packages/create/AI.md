# AI Notes For `@master/create-css`

## Responsibility

`@master/create-css` is the add-first installer for adding Master CSS to existing projects.

## Owns

- CLI setup planning and command-line option handling.
- Framework detection for setup routing.
- Safe project file edits for generated setup files and config snippets.
- Package dependency planning for Master CSS, ESLint config, MCP, and optional AI helper files.

## Does Not Own

- Runtime, server, scanner, engine, compiler, or CSS output behavior.
- Framework integration internals owned by `@master/css.vite`, `@master/css.next`, `@master/css.nuxt`, `@master/css.astro`, `@master/css.svelte`, or `@master/css.webpack`.
- SvelteKit file mutation internals owned by `@master/css-sv`.
- ESLint rule behavior owned by `@master/css-lint` and `@master/eslint-plugin-css`.

## Public Surface

- Binary: `create-css`.
- Root export for setup planning and application helpers.
- `npm create @master/css` and equivalent package-manager create/dlx flows resolve to this package.

## Key Files

- `src/index.ts`
- `src/core.ts`
- `src/transforms.ts`
- `src/bin/index.ts`

## Risk Areas

- Overwriting existing project config files.
- Running package manager installs unexpectedly.
- Producing stale ESLint flat config examples.
- Treating SvelteKit setup as generic Vite setup instead of delegating to `@master/css-sv`.

## Validation

```sh
pnpm --filter @master/create-css test
pnpm --filter @master/create-css lint
pnpm --filter @master/create-css build
```
