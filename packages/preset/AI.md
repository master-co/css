# AI Notes For `@master/css-preset`

## Responsibility

`@master/css-preset` owns the default Master CSS stylesheet source and generated default preset artifacts.

## Owns

- Default token, mixin, native keyframe, custom media, and layer-statement source.
- `src/default-manifest.json`.
- `src/default-native.css`.
- Public preset CSS entries: `index.css`, `base.css`, `theme.css`, `media.css`, and `mixins.css`.

## Does Not Own

- Rust inference of token-family capabilities from mixin definitions.
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
- `src/mixins.css`
- `src/media.css`
- `src/index.css`
- `src/default-manifest.json`
- `src/default-native.css`

## Risk Areas

- Default manifest or native CSS artifact output changes.
- Layer statement must stay `@layer theme, base, defaults, components, utilities;`.
- Token namespace changes must align with the parameter namespaces of loaded value mixins.
- Additional recipes must justify multiple declarations or parameters; single-property token mappings use the exact direct-value mixin shape.

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

Token values live in `src/theme.css`. All 124 value mappings and 8 recipes live in `src/mixins.css`. Rust infers family capabilities from mixin IR; language/tooling `tokenFamilies()` exposes effective manifest metadata. Theme-only environments must load mixins or author their own. Do not edit generated projections or add registry fields to the preset manifest.

Author recipes in the stable `src/mixins.css` entrypoint using `@mixin`. Only used classes and delivered native `@apply` roots emit CSS/resources. General parameter recipes require static arguments; exact direct-value mixins also accept symbolic `var()` arguments. Grid counts and spans must be positive integers. Each preset token property has one canonical prefix and namespace. Use `font-size-*`, `font-family-*`, and `font-weight-*`. `text-*` is the generic single-string named-mixin rule with explicit typography companion tokens; it is never a color alias. Direct declarations use full native property names. Vendor declaration pairs belong to Rust output rules.

The runtime keeps unused IR definitions for future DOM classes. Compiler-only parsing and migration must not enter runtime bundles. No TypeScript semantic fallback is allowed.

## Refined preset contract

The preset contains 124 direct-value mixins and eight other recipes. `r-pill` uses `--radius-pill: calc(infinity * 1px)` and only sets border radius. Color families use the full `color` namespace: `bg-surface-base`, `fg-text-muted`, `b-line-divider`; the role is part of the token key. Ten animations are direct children of `@theme` and absent from unused native output. Migration `rc-preset` resolves the saved Manifest v3 token identities and preserves custom mixins.

## Conditions and wrappers

`src/media.css` owns eleven breakpoints and six preference/orientation custom media queries. `theme.css` alone supplies no media. Use `@media(print)`/`@media(screen)`, `@motion-safe`/`@motion-reduce`, and explicit `@layer(base|defaults|components|utilities)` class suffixes. `@starting-style` is built into the engine. Use `@mixin` with `@contents` and `@apply(--name)` for custom selector or conditional wrappers; no variant registry or aliases remain. Layers belong at the call site.

## Atomic class authoring

The preset `--animate(--animate)` mixin defines the direct-value family for `animation`, using the `animate` namespace. Each `--animate-name` token contains a complete native shorthand. Preset values include their duration and infinite repetition; custom values use native CSS defaults. The mixin forwards the shorthand unchanged; there is no companion-setting mechanism. Use full-property declarations such as `animation-duration:var(--duration-fast)` for overrides; token longhands follow the general order and may be reset by the shorthand. Engine declarations have no shorthand priority or value inference.

Browser regression for base-style decisions is separate from unit tests:
`pnpm --filter @master/css-preset exec vitest run --config vitest.e2e.config.ts`.
It requires Playwright Chromium, Firefox and WebKit and checks both defaults and explicit opt-in classes.
