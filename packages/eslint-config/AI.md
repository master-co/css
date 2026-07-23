# AI Notes For `@master/eslint-config-css`

## Responsibility

`@master/eslint-config-css` is the thin official flat-config entrypoint for the
complete `@master/eslint-plugin-css` recommended configuration.

It owns no rules or duplicated config data. The plugin remains the single source of
truth; this package only provides the ecosystem config-package import.

## Public Surface

- Default root export: the complete flat config array.
- Named `recommended` export: the same frozen config array.

## Validation

```sh
pnpm --filter @master/eslint-config-css test
pnpm --filter @master/eslint-config-css lint
pnpm --filter @master/eslint-config-css type-check
pnpm --filter @master/eslint-config-css build
```
