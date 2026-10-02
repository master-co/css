# AI Notes For `@master/css-preset`

## Responsibility

`@master/css-preset` owns the default Master CSS stylesheet source and generated default preset artifacts.

## Owns

- Default token, mixin, native keyframe, custom media, and layer-statement source.
- `src/default-manifest.json`.
- `src/default-native.css`.
- Public preset CSS entries: `index.css`, `base.css`, `theme.css`, `media.css`, and `utilities.css`.

## Does Not Own

- Rust inference of token-family capabilities from utility definitions.
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
- Token namespace changes must align with the parameter namespaces of loaded utility patterns.
- Additional recipes must justify multiple declarations or parameters; single-property token mappings use the exact direct-value body shape.

## Constraints

- Keep alias and namespace registries out of `default-manifest.json`.
- Regenerate `src/default-manifest.json` only for an intentional source change.
- Generate `src/default-native.css` from preset source; do not edit it by hand.
- Keep engine execution and build integration behavior at their owners.
- Keep all ten keyframes in native CSS outside `@theme`; their owning `theme.css` explicitly opts into `@prune native`. Generate the preset through the import graph so file policy and definition identities match project compilation.

## Validation

For behavior changes, use the focused tests below. Run lint for package changes; type-check/build when types or package output change. AI-guidance-only edits need lint and the root context check.

```sh
pnpm --filter @master/css-preset test
pnpm --filter @master/css-preset lint
pnpm --filter @master/css-preset type-check
pnpm --filter @master/css-preset build
```

## Utility And Token Ownership

Token values live in `src/theme.css`. All 119 value mappings and 7 recipes live in `src/utilities.css`. Rust reads explicit utility registrations and infers direct-value capabilities from their bodies; language/tooling `tokenFamilies()` exposes effective manifest metadata. Theme-only environments must load utilities or author their own. Do not edit generated projections.

Author recipes in the stable `src/utilities.css` entrypoint using `@utility`. Only used classes and delivered native `@apply` roots emit CSS/resources. General parameter recipes require static arguments; token patterns bind symbolic token values. Grid counts and spans must be positive integers. Each token mapping has one canonical prefix. The font-family, font-size and font-weight namespaces share `font-*`; duration and easing share `transition-*` and `animation-*`. Delays retain distinct prefixes. A key must identify one namespace; ambiguity emits no CSS and requires a native declaration or distinct key. Metadata entries use prefix plus namespace. `text-*` is the explicit `@utility text-(--text <string>)` key recipe with explicit typography companion tokens; it is never a color alias. Direct declarations use full native property names. Vendor declaration pairs belong to Rust output rules.

The runtime keeps unused IR definitions for future DOM classes. Compiler-only parsing and migration must not enter runtime bundles. No TypeScript semantic fallback is allowed.

## Refined preset contract

The preset contains 119 direct-value utilities and seven other recipes. `r-pill` uses `--radius-pill: calc(infinity * 1px)` and only sets border radius. Color families use the full `color` namespace: `bg-surface-base`, `fg-text-muted`, `b-line-divider`; the role is part of the token key. Ten native keyframes live in `theme.css` under `@prune native` and are absent from unused native output. Migration `rc-preset` resolves the saved Manifest v3 token identities and preserves custom mixins.

## Conditions and wrappers

`src/media.css` owns eleven breakpoints and six preference/orientation custom media queries. `theme.css` alone supplies no media. Use `@media(print)`/`@media(screen)`, `@motion-safe`/`@motion-reduce`, and explicit `@layer(base|defaults|components|utilities)` class suffixes. `@starting-style` is built into the engine. Use `@mixin` with `@contents` and `@apply(--name)` for custom selector or conditional wrappers; no variant registry or aliases remain. Layers belong at the call site.

## Atomic class authoring

The preset `@utility animate-(--animate)` pattern defines the direct-value family for `animation`, using the `animate` namespace. Each `--animate-name` token contains a complete native shorthand. Preset values include their duration and infinite repetition; custom values use native CSS defaults. The utility forwards the shorthand unchanged; there is no companion-setting mechanism. Use full-property declarations such as `animation-duration:var(--duration-fast)` for overrides; token longhands follow the general order and may be reset by the shorthand. Engine declarations have no shorthand priority or value inference.

Browser regression for base-style decisions is separate from unit tests:
`pnpm --filter @master/css-preset exec vitest run --config vitest.e2e.config.ts`.
It requires Playwright Chromium, Firefox and WebKit and checks both defaults and explicit opt-in classes.
