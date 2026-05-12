# AI Notes For `@master/css-devtools-hook`

## Responsibility

This package installs a global event hook used by runtime and devtools-related code.

## Main Files

- `src/core.ts`
- `src/install.ts`
- `src/global.min.ts`
- `src/types/*`
- `e2e/*`

## Risks

- Global singleton behavior.
- Event name/type compatibility.
- Runtime depends on this package for devtools emissions.

## Rules

- Do not rename global `__MASTER_CSS_DEVTOOLS_HOOK__` casually.
- Keep event types and callbacks compatible.

## Validation

```sh
pnpm --filter @master/css-devtools-hook e2e
pnpm --filter @master/css-devtools-hook build
pnpm --filter @master/css-devtools-hook type-check
```
