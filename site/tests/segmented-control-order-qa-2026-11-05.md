# Homepage segmented-control order independence — 2026-11-05

The route tabs and delivery switch now combine their page-specific class with
`.home-segmented-control`. The two classes outrank the shared control in the
same CSS layer even when that stylesheet loads last. This keeps the route tabs
in three equal columns and preserves the delivery switch's container layouts.
The source change comes from `247cb4f44`; this record reapplies only the
attribution in `0e7bffadb` to the release-readiness baseline.

## Exact contract delta

Only these five segments change, and only their selectors change:

| Old segment | New segment | Selector or context |
| --- | --- | --- |
| `ff8b54a1c5020911` | `6411577d8ccb6ae5` | `.home-wf-routes-tabs` |
| `25734679b7211506` | `79943bbc1cd2f0d6` | Route tabs' thumb in reduced motion |
| `38aaea5b2ab4b3dd` | `50f898a9b5ec1569` | `.home-delivery-switch` |
| `e097a92fd341d1c0` | `853de94c256cd3db` | Delivery switch at container widths of at least 52rem |
| `d616703946a81521` | `2dddc8d82ffdacee` | Delivery switch below a 14rem container width |

The shared homepage contract for `/`, `/cn`, `/ja`, `/ko`, and `/tw` moves
from `959317e191d6b58b` (340,036 bytes) to `1598f77c4e803832` (340,151 bytes).
All other route contracts, the project manifest, hydration and resource order
match the baseline exactly.

## Budget attribution

Reverting only the five selectors in the built homepage `page.*.css` asset
reproduces the dependency-only asset byte for byte. The asset grows by 115 raw,
20 gzip and 22 Brotli bytes using the style audit's compression settings.

| Canonical route | gzip before → after | Brotli before → after | Files / depth | Inline CSS |
| --- | ---: | ---: | ---: | ---: |
| `/` | 63,147 → 63,167 | 49,554 → 49,576 | 10 / 1 | 13,266 |

No other budget changes. In a separate comparison of freshly built outputs, upgrading
`@master/internal-site` from `0.2.1` to `0.2.2` leaves every HTML, CSS,
JavaScript and other asset byte unchanged. Only the build's generated
source-state marker differs across 200 text and JSON exports; removing that
marker difference makes all 1,649 files match. Both dependency-only builds
pass the same CSS contract and style delivery checks.

## Browser checks

Chromium and WebKit matched the previous production layout in 16 profiles:
English and Traditional Chinese, light and dark, at 375px and 1280px. The
route tabs measured 228px with three 74px seats. The delivery switch stayed a
full-row grid at 375px and occupied the first grid column at 1280px. At the
wider size the declared `inline-flex` is computed as `flex` on the grid
item. No production HTML contained a Vite development style ID.

Chromium dev verification covered the same eight route, width and color
scheme combinations. SSR emitted 36 distinct Vite styles in the head. The
same 36 DOM nodes and CSS texts survived real island hydration, with no
duplicate IDs or style text. The font bootstrap and generated `#master-css`
styles in the head are not Vite modules. Both controls kept their geometry
when the shared stylesheet moved last, and the native radios still selected
each variant with the keyboard.
