# AI Notes For `@master/css`

## Responsibility

`@master/css` is the public facade over the manifest-driven engine API and default preset CSS entrypoints.

## Owns

- Public facade exports.
- CSS entrypoint re-exports: `index.css`, `base.css`, `theme.css`, `variants.css`, and `utilities.css`.
- Facade wiring tests.

## Does Not Own

- Config resolution.
- Utility matcher construction, declarers, or transformers.
- Preset manifest data.
- Runtime authoring adapters.
- CSS output parity tests; those belong in engine, compiler, or preset.

## Public Surface

- `MasterCSS`
- `MasterCSS.create({ manifest, emittedGlobals })`
- Engine inspection-related type re-exports such as `MasterCSSClassInspection` and `MasterCSSNormalizedNumericValue`; inspection value helpers stay in `@master/css-engine/inspect`
- `MasterCSSManifest` and runtime-safe engine types
- CSS subpaths listed above

Do not re-export `Config`, `UtilityDefinition`, `extendConfig`, old utility classes, or `@master/css/config` / `@master/css/utils` subpaths.

## Key Files

- `src/index.ts`
- `src/index.css`
- `src/base.css`
- `src/theme.css`
- `src/variants.css`
- `src/utilities.css`

## Risk Areas

- Accidentally widening the public API.
- Moving behavior from owning lower packages into the facade.
- Treating facade smoke tests as semantic CSS output coverage.

## Safe Changes

- Narrow facade export fixes.
- CSS subpath wiring fixes.
- Smoke tests proving facade entrypoints resolve.

## Dangerous Changes

- Reintroducing legacy Config APIs.
- Adding utility or runtime implementation logic here.
- Changing CSS output through facade-only changes.

## Validation

```sh
pnpm --filter @master/css test
pnpm --filter @master/css lint
pnpm --filter @master/css type-check
pnpm --filter @master/css build
```

Run downstream package checks when facade exports change.
