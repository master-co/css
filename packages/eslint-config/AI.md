# AI Notes For `@master/eslint-config-css`

## Responsibility

`@master/eslint-config-css` re-exports the recommended config from `@master/eslint-plugin-css`.

## Owns

- Config wrapper package entrypoint.
- Compatibility with the plugin recommended config shape.

## Does Not Own

- ESLint rules.
- Plugin settings schema.
- Class parsing, validation, ordering, or autofix behavior.

## Public Surface

- Root config export.

## Key Files

- `src/index.ts`

## Risk Areas

- Public config compatibility.
- Drift from `@master/eslint-plugin-css` recommended config.

## Safe Changes

- Wrapper export fixes that stay aligned with the plugin.
- Tests for config re-export behavior.

## Dangerous Changes

- Diverging from the plugin recommended config without a clear reason.
- Adding rule behavior here instead of in `@master/eslint-plugin-css`.

## Validation

```sh
pnpm --filter @master/eslint-config-css test
pnpm --filter @master/eslint-config-css lint
pnpm --filter @master/eslint-config-css type-check
pnpm --filter @master/eslint-config-css build
```
