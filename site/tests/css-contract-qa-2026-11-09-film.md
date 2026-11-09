# Master CSS 2.0 film CSS baseline review

The reviewed build is local `main` after `f3267ac77`–`ec31134a3` (the Master CSS
2.0 film in the hero and the Introduction) and the promo dialog animation change
that keeps its timing function out of the `animation` shorthand. It approves the
CSS those commits add.

## Exact contract and intentional change

The previous snapshot SHA256 is
`bac8e8c4f04a284da493b91bd3fe9d7226f8f9aa695fb78c8c627e9f50f8151f`
(approved by `css-contract-qa-2026-11-09.md`): 389 routes, 53 contracts and
2,172 segments. The new snapshot records 389 routes, 54 contracts and 2,185
segments. No route was added or removed; the project manifest, semantic and
public baselines are equal.

Ten routes change: `/` and `/guide/introduction` in each of the five locales.
Each gains the same 3,096-byte `@layer components{…}` block from
`site/styles/promo-video.css`, imported by `HeroVideo.svelte` and
`PromoVideo.svelte`: the poster, play disc, dialog, close button, hero film disc,
reduced-motion overrides and `@keyframes promo-dialog-in`.

## Attribution

For every route, removing the added segments (and the `@layer components{`
wrapper they leave empty) from the new contract CSS gives the old contract CSS
byte for byte. The other 379 routes are unchanged. No existing selector,
declaration or value changes.

## Keyframes and inline budget

The dialog animation is written as `animation: promo-dialog-in 260ms both` plus
`animation-timing-function: var(--ui-ease-out, ease)`. With the `var()` inside
the shorthand, the compiler treated the animation name as possibly dynamic and
retained every managed keyframe, which raised the inline CSS of
`/guide/introduction` from 1,940 to 3,397 bytes. With the longhand, only
`promo-dialog-in` is added and `bun run --filter site build` passes the
style-delivery budget (389 routes, 46 CSS assets audited) and public asset
verification.
