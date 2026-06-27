# AI Notes For `@master/css-preset`

## Responsibility

`@master/css-preset` owns the default Master CSS stylesheet source and generated default preset artifacts.

## Owns

- Default token, utility, managed keyframe, variant, and layer-statement source.
- `src/default-manifest.json`.
- `src/default-native.css`.
- Public preset CSS entries: `index.css`, `base.css`, `theme.css`, `variants.css`, and `utilities.css`.

## Does Not Own

- Engine built-in key aliases, namespaces, native value namespaces, or namespace refs.
- Engine execution behavior.
- Project manifest discovery.
- Build integration behavior.
- Public facade behavior in `@master/css`.

## Public Surface

- Root preset package export.
- `./default-manifest.json`.
- CSS subpaths listed above.

## Key Files

- `src/theme.css`
- `src/base.css`
- `src/utilities.css`
- `src/variants.css`
- `src/index.css`
- `src/default-manifest.json`
- `src/default-native.css`
- `src/index.ts`

## Risk Areas

- Default manifest or native CSS artifact output changes.
- Layer statement must stay `@layer theme, base, defaults, components, utilities;`.
- Token namespace changes must align with engine built-ins.
- Utility additions can accidentally belong in engine aliases or CSS directives instead.

## Safe Changes

- Focused preset source fixes with tests.
- Intentional generated preset artifact updates.
- Token or utility additions that follow the utility definition ladder.

## Dangerous Changes

- Adding `keyAliases`, `nativeValueNamespaces`, or namespace registry data to `default-manifest.json`.
- Regenerating `src/default-manifest.json` without an intentional source change.
- Editing `src/default-native.css` by hand instead of updating preset source and regenerating artifacts.
- Putting engine execution behavior or build integration behavior here.

## Validation

```sh
pnpm --filter @master/css-preset test
pnpm --filter @master/css-preset lint
pnpm --filter @master/css-preset type-check
pnpm --filter @master/css-preset build
```

## Utility Definition Notes

Default token namespaces must be declared in engine built-ins. Prefer engine `builtinNativeValueNamespaces` for full native or vendor property classes, engine `builtinKeyAliases` for short direct aliases, `@utilities` for semantic subproperty aliases, and `src/utilities.ts` only for multi-declaration behavior, special transforms, raw ambiguous matching, or compiler-inexpressible behavior. Document why simpler mechanisms are insufficient when adding a utility.
