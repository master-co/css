# 2.0.4 site CSS baseline review

The reviewed build is `main` at `99de92761` (Release run 42500294184 failed only
this contract). It approves the CSS baseline for the 2.0.4 patch release. Public
package delivery and Cloudflare verification remain separate release gates.

## Exact contract and intentional change

The previous snapshot SHA256 is
`90df65ca56e5f27041c1ae96b151f6f3f7b52d0c414d55ba0d262a048a386807`
(approved by `migration-shadcn-ui-qa-2026-11-08.md`): 389 routes, 53 contracts
and 2,260 exact segments. The new snapshot records 389 routes, 53 contracts and
2,172 segments. No route or contract was added or removed; the project
manifest, semantic and public baselines are equal. The local build reproduces
the CI delivered bytes for `/` exactly
(`dfc0b66b…` → `0646a3f4dc4b60a7ceca97145137b27062b37d4860832e3ca5e991beb3fdd702`).

Every route changes, all from one commit:

- `e9c42d738` Fix(Vite): the CSS that Master CSS splices into a production
  stylesheet now receives Vite's `build.cssMinify` step and `build.cssTarget`
  lowering, like the rest of the site's CSS. Before, it shipped as compiled,
  unminified text (for example `@layer theme;` followed by a separate
  `@layer theme{…}`).

The summed contract CSS falls from 6,794,862 to 5,486,076 bytes (−19.3%); `/`
falls from 333,496 to 255,037 bytes.

## Attribution

For each of the 389 routes, the old and new contract CSS (segments joined in
order) were normalized with the same lightningcss transform (`minify: true`,
Vite's default targets `chrome111, edge111, firefox114, safari16.4`). 388 routes
normalize to identical bytes. The remaining route, `/`, becomes identical after a
second normalization pass: the old CSS had two adjacent rules
`.home-palette-scene{height:24rem}` and `.home-palette-scene{height:clamp(24rem,32vw,30rem)}`
inside `@media (width>=64rem)`; minification merges them and drops the
`24rem` fallback, which every target supports `clamp()` without. No selector,
declaration or value changes meaning on any route.

The other commits in this release do not change site CSS: the engine selector
check, Svelte/Vue script extraction, repository ignore roots, package
stylesheet imports and `@theme` token removal leave every route's normalized
CSS equal.

## Dark mode and lowering

The site keeps 303 native `light-dark()` values in its built CSS and no
`--lightningcss-*` variables, the same as its Svelte component styles, which
pass through Vite's own pipeline. Theme switching (`html.dark`/`html.light` plus
inline `color-scheme`) is therefore unaffected.

`bun run --filter site build` passed with the style-delivery budget
(389 routes, 45 CSS assets audited) and public asset verification.
