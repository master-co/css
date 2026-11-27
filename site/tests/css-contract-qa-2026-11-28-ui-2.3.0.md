# Master UI 2.3.0 and shared site 0.3.7 site CSS review

The reviewed build is `main` with `@master/ui` raised from 2.2.1 to 2.3.0 and
`@master/internal-site` from 0.3.6 to 0.3.7. The previous build output of the
same checkout verified the previous snapshot's segments, contracts and routes
exactly, so every change below comes from the two releases.

## Exact contract and changes

The previous snapshot SHA256 is
`03a35a49048a32f6806953fc86954782c7c826f9bd91b17e2ed2a474ab440cd4`
(approved by `css-contract-qa-2026-11-27-apply-selector-lists.md`): 389 routes,
58 contracts and 520 exact segments. The new snapshot records the same 389
routes in the same 58 groups with 520 segments. No route was added or removed,
and the semantic and public baselines are equal. Twenty-four segments were
replaced by a new version of the same stylesheet; no segment was added or
dropped.

The project manifest grows from 568611 to 570525 bytes: Master UI 2.3.0's
`theme.css` declares eight font-size roles, `--font-size-micro` (.6875rem)
through `--font-size-title` (.9375rem). Nothing was removed, and no utility
segment changed.

Master UI 2.3.0 stylesheets:

| Previous | New | Bytes | Routes | Change |
| --- | --- | --- | --- | --- |
| `9b8bb8fa33601ae1` | `d0f1a568b1da1916` | 9786 → 9981 | 389 | theme: the seven font-size roles the delivered components read, label to title |
| `9fb076a851d81bb0` | `07089776ee70e496` | 11284 → 11554 | 386 | `.btn` sizes read the roles, the margin reset moves to `:where(.btn)`, and `btn-xs` is added |
| `f43953c5387ac9d1` | `2e440c6362606158` | 229 → 305 | 386 | `.icon` is `inline-block`, and `hidden` hides it except `until-found` |
| `c92414fb646a13db` | `ece8817e99ddc926` | 24719 → 26330 | 385 | inputs, selects and fields read the roles; typed text keeps `text-wrap: stable`; a `list` input draws its datalist indicator; forced-colors invalid fields draw a 2px dashed outline instead of `mark`; a large input group sizes its buttons, and a chip leaves .5rem before the group's field; legends and labels balance; a field with a disabled control takes disabled ink; a raised select lifts on hover except with reduced motion |
| `933d7b297d7ce9b1` | `f2ba2598e3ce251b` | 6355 → 6636 | 385 | badges read the roles, set their words on the baseline with the line height of the badge and center dots and icons; a toned `badge-outline` draws only its contour |
| `c71f07c183216878` | `81e296f0c545c41a` | 3816 → 3882 | 385 | a tooltip keeps .5rem from the viewport edge where `position-area` is supported |
| `930d538f25aa085d` | `9b510b9d4bd0f943` | 2493 → 2651 | 375 | the last visible accordion item draws no closing divider; the trigger reads the body role |
| `0dac76efde249bfd` | `abe65291830281d9` | 2160 → 2186 | 375 | pager label and title read the roles |
| `1a9e4a473f5370a5` | `608b6f0477ecca10` | 4122 → 4115 | 370 | code lines are `direction: ltr` instead of flipping the line rule in RTL; the copy button reads the meta role |
| `b2a6ed349b5d3b97` | `3ada6a183a180797` | 1835 → 2140 | 320 | alert text reads the control role and its description balances instead of `pretty`; a trailing `.btn` after `.alert-body` takes its radius and end margin from the alert's inset |
| `b4e31e3c3656eb61` | `0d72f2c4ca266dc7` | 1836 → 2141 | 55 | the same alert change in its second import order |
| `926ce1714102d588` | `cdb59550195e0bfb` | 4314 → 4395 | 211 | segmented sizes read the roles; the current item's ink reads `--segmented-current-color` |
| `6c8650617606973f` | `0872d1add4a3e3d8` | 5497 → 6970 | 205 | tables read the roles, cells use the figures family, a sort button sets its label on the baseline with its indicator centered, and a selected row is outlined with hairlines instead of a raised shadow |
| `b0549ed0a4f7f4db` | `b20380f21a1ccb2d` | 5498 → 6971 | 90 | the same table change in its second import order |
| `e64fb84d247a3286` | `e63022697e368dbb` | 7820 → 7822 | 195 | a window's address is one centered line as tall as its field, in the caption role |
| `46e7b812ab8cbcb5` | `e528feedd05c1881` | 3460 → 3821 | 75 | tabs draw the divider and the active indicator as backgrounds inset by the item padding, and the list is pulled out by that padding |

Shared site 0.3.7 stylesheets, each a `text-wrap` change only:

| Previous | New | Bytes | Routes | Change |
| --- | --- | --- | --- | --- |
| `4a82fa52cb2ac02e` | `6fd8b41d273d491d` | 4911 → 4947 | 375 | prose `h3` and `h4` balance |
| `c2d0fb79edd5a12f` | `b60d88f1bca845f7` | 2256 → 2274 | 355 | the page head's lead balances; a following plain paragraph stays `pretty` |
| `6d174563f9790e51` | `818ec51c3009cd6f` | 2255 → 2273 | 25 | the same page head change in its second import order |
| `768f935377965306` | `efe6f33c36ba5e06` | 6436 → 6437 | 270 | contents entries balance instead of `pretty` |
| `e83e71c129b9ed4d` | `759d8fd687885488` | 6437 → 6438 | 105 | the same contents change in its second import order |
| `f784a36a50573cbe` | `bc28d916a180bb83` | 1674 → 1710 | 360 | tray titles and descriptions balance |
| `dd2e3a53a3396a06` | `7d4ecf22ec04e612` | 8139 → 8141 | 10 | documentation index descriptions balance instead of `pretty` |
| `92d2257a5922faba` | `d32d07da24bcc057` | 185367 → 185368 | 5 | the home page's section text balances instead of `pretty` |

## Verification

The production build, the translation audit (0 problems), the 389-route style
delivery audit with the raised budgets, lint, type-check and the site's unit
suites pass. In the built output, the code example tabs of
`/guide/reusing-styles` and the dot badge of `/guide/compatibility` were
captured in light and dark at 1280px: the active indicator sits under its
label, the divider starts at the first label, and the badge's dot and words
are centered. Other pages were not read by hand. Selected table rows, the
trailing alert button, `btn-xs` and datalist inputs are not used in this
site's markup.

## Delivery

All 81 budgeted routes rise, by 52 to 701 gzip and 48 to 627 Brotli bytes over
the previous build; the shared site's balanced text accounts for at most 4
gzip and 14 Brotli bytes of a route, within the previous ceilings. The
budgeted total rises from 2942725 to 2985294 gzip bytes and from 2512199 to
2550240 Brotli bytes. File counts, import depth and inline CSS are unchanged.
