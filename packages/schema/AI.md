# AI Notes For `@master/css-schema`

## Responsibility

`@master/css-schema` owns public, dependency-light Master CSS schema and wire-format contracts.

## Owns

- Stable public contracts and serializable constants.
- Manifest JSON codec helpers.
- Hydration manifest contracts.
- CSS directive schema contracts.
- CSS syntax, utility type, runtime style and CSS common contracts.

## Does Not Own

- Compiler, engine, runtime, integration, filesystem, or framework behavior.
- Project discovery.
- CSS import graph resolution.
- Stylesheet compilation.
- Class matching.
- DOM hydration.
- Build adapter logic.

## Public Surface

- `.`
- `./manifest`
- `./hydration-manifest`
- `./css-directives`
- `./css-syntax`
- `./utility-type`
- `./runtime-style`
- `./emitted-globals`
- `./css-common`
- `./diagnostics`
- `./integration`

Manifest JSON codec helpers are exported from `.` and `./manifest`;
`src/manifest-json.ts` is an implementation module, not a public subpath.

## Key Files

- `src/manifest.ts`
- `src/manifest-json.ts`
- `src/hydration-manifest.ts`
- `src/css-directives.ts`
- `src/css-syntax.ts`
- `src/utility-type.ts`
- `src/runtime-style.ts`
- `src/css-common.ts`
- `crates/mastercss-schema/AI.md`

## Risk Areas

- Manifest ABI changes.
- Hydration manifest wire-shape changes.
- CSS directive schema changes.
- Syntax IR type changes.
- Keeping the package dependency-light.

## Safe Changes

- Pure type or codec helper fixes with tests.
- Serializable constant updates that preserve ownership boundaries.

## Dangerous Changes

- Adding engine, compiler, runtime, integration, filesystem, or framework dependencies.
- Moving behavior into schema instead of stable contracts.
- Changing wire formats without downstream validation.

## Validation

```sh
pnpm --filter @master/css-schema test
pnpm --filter @master/css-schema lint
pnpm --filter @master/css-schema type-check
pnpm --filter @master/css-schema build
```
