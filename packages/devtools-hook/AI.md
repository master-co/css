# AI Notes For `@master/css-devtools-hook`

## Responsibility

`@master/css-devtools-hook` installs the global event hook used by runtime and devtools-related code.

## Owns

- Global hook installation.
- Devtools event type contracts.
- Browser hook bundle output.

## Does Not Own

- Runtime lifecycle behavior.
- Devtools UI.
- CSS generation or inspection logic.

## Public Surface

- Root hook API.
- Global `__MASTER_CSS_DEVTOOLS_HOOK__` contract.

## Key Files

- `src/core.ts`
- `src/install.ts`
- `src/global.min.ts`
- `src/types/*`
- `e2e/*`

## Risk Areas

- Global singleton behavior.
- Event name and type compatibility.
- Runtime depends on this package for devtools emissions.

## Safe Changes

- Focused hook installation fixes.
- Event type additions that preserve compatibility.
- Browser e2e coverage for emitted events.

## Dangerous Changes

- Renaming `__MASTER_CSS_DEVTOOLS_HOOK__` casually.
- Breaking callback/event payload compatibility.
- Moving runtime behavior into the hook package.

## Validation

```sh
pnpm --filter @master/css-devtools-hook e2e
pnpm --filter @master/css-devtools-hook lint
pnpm --filter @master/css-devtools-hook type-check
pnpm --filter @master/css-devtools-hook build
```
