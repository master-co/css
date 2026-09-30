# AI Notes For `@master/css-preset`

## Responsibility

`@master/css-preset` owns the default Master CSS stylesheet source and generated default preset artifacts.

## Owns

- Default token, mixin, native keyframe, custom media, and layer-statement source.
- `src/default-manifest.json`.
- `src/default-native.css`.
- Public preset CSS entries: `index.css`, `base.css`, `theme.css`, `media.css`, and `utilities.css`.

## Does Not Own

- Engine built-in token aliases, namespaces, named-token namespaces, or namespace refs.
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
- `src/colors.css` (internal color source imported by `theme.css`)
- `src/base.css`
- `src/utilities.css`
- `src/media.css`
- `src/index.css`
- `src/default-manifest.json`
- `src/default-native.css`

## Risk Areas

- Default manifest or native CSS artifact output changes.
- Layer statement must stay `@layer theme, base, defaults, components, utilities;`.
- Token namespace changes must align with engine built-ins.
- Recipe additions must justify multiple declarations or parameters; single declarations use native properties or engine token families.

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

## Mixin And Token Ownership

Token values live in `src/theme.css`. Ordered token mappings belong to `crates/mastercss-engine/src/manifest.rs` and `src/token_registry.rs`; `@master/css-tooling/builtins` exposes generated read-only `builtinTokenFamilies` and `builtinTokenNamespaces`. Do not edit generated projections or add registry fields to the preset manifest.

Author recipes in the stable `src/utilities.css` entrypoint using `@mixin`. Only used classes and delivered native `@apply` roots emit CSS/resources. Parameter recipes require static arguments; grid counts and spans must be positive integers. Each built-in token property has one canonical prefix and namespace. Use `font-size-*`, `font-family-*`, and `font-weight-*`; `font-*` is removed. `text-*` is the generic single-string named-mixin rule with explicit typography companion tokens; it is never a color alias. Raw property abbreviations and single-declaration fixed aliases are removed. Vendor declaration pairs belong to Rust output rules.

The runtime keeps unused IR definitions for future DOM classes. Compiler-only parsing and migration must not enter runtime bundles. No TypeScript semantic fallback is allowed.

## Refined preset contract

The preset contains ten mixins. `fit`, `full`, `center`, `middle`, and `round` are removed; projects may author these names themselves. `r-pill` uses `--radius-pill: calc(infinity * 1px)` and only sets border radius. Color families use the full `color` namespace: `bg-surface-base`, `fg-text-muted`, `b-line-divider`; do not restore implicit role lookups or a `surface` prefix. Ten animations are direct children of `@theme` and absent from unused native output. Migration `rc-preset` resolves the saved Manifest v3 token identities and preserves custom mixins.

## Conditions and wrappers

`src/media.css` owns eleven breakpoints and six preference/orientation custom media queries. `theme.css` alone supplies no media. Use `@media(print)`/`@media(screen)`, `@motion-safe`/`@motion-reduce`, and explicit `@layer(base|defaults|components|utilities)` class suffixes. `@starting-style` is built into the engine. Use `@mixin` with `@contents` and `@apply(--name)` for custom selector or conditional wrappers; no variant registry or aliases remain. Layers belong at the call site.

## Atomic class authoring

`animate-*` is the built-in token family for `animation`, using the `animate` namespace. Each `--animate-name` token contains a complete native shorthand. Preset values include their duration and infinite repetition; custom values use native CSS defaults. There is no preset animation mixin or companion-setting mechanism. Use full-property declarations such as `animation-duration:var(--duration-fast)` for overrides; token longhands follow the general order and may be reset by the shorthand. Engine declarations have no shorthand priority or value inference.
