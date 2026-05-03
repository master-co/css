# AI Notes For `@master/eslint-config-css`

## Responsibility

This package re-exports the recommended config from `@master/eslint-plugin-css`.

## Main File

- `src/index.ts`

## Risks

- Public config compatibility.
- Dependency on plugin config shape.

## Rules

- Do not diverge from plugin recommended config without a clear reason.

## Validation

```sh
pnpm --filter @master/eslint-config-css test
pnpm --filter @master/eslint-config-css build
pnpm --filter @master/eslint-config-css type-check
```

