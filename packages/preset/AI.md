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

## Risk Areas

- Default manifest or native CSS artifact output changes.
- Layer statement must stay `@layer theme, base, defaults, components, utilities;`.
- Token namespace changes must align with engine built-ins.
- Utility additions can accidentally belong in engine aliases or CSS directives instead.

## Constraints

- Keep alias and namespace registries out of `default-manifest.json`.
- Regenerate `src/default-manifest.json` only for an intentional source change.
- Generate `src/default-native.css` from preset source; do not edit it by hand.
- Keep engine execution and build integration behavior at their owners.

## Validation

For behavior changes, use the focused tests below. Run lint for package changes; type-check/build when types or package output change. AI-guidance-only edits need lint and the root context check.

```sh
pnpm --filter @master/css-preset test
pnpm --filter @master/css-preset lint
pnpm --filter @master/css-preset type-check
pnpm --filter @master/css-preset build
```

## Utility Definition Notes

Apply the utility definition ladder in `AGENTS.md`. Default token namespaces and property aliases belong to the Rust engine registries in `crates/mastercss-engine/src/manifest.rs`; `@master/css-tooling/builtins` exposes generated read-only projections (`builtinKeyAliases`, `builtinNativeValueNamespaces`). Do not edit those generated projections or add registry fields to the preset manifest.

Author preset utilities in `src/utilities.css`. The former `src/utilities.ts` implementation no longer exists; compiler-inexpressible behavior must be handled by the owning Rust semantic layer, not a new TypeScript fallback. Explain why simpler manifest mechanisms cannot express an added utility.
