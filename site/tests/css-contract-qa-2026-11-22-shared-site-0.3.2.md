# Shared site 0.3.2 on Master UI 2.1.0 site CSS review

The reviewed build is `main` at `538e8c680`, with `@master/internal-site` raised
from 0.3.1 to 0.3.2 and `@master/ui` raised from 0.0.11 to 2.1.0.

## Exact contract and intentional change

The previous snapshot SHA256 is
`d860e60dfca36f3d623d27a68893dbda3da08f1e90d8b80d633c7d3128fdc8ca`
(approved by `css-contract-qa-2026-11-21-shared-site-0.3.1.md`): 389 routes, 58
contracts and 511 exact segments. The new snapshot records the same 389 routes,
58 contracts and 511 segments. No route was added or removed, and the project
manifest, semantic and public baselines are equal. Eight segments changed:

| Segment | Bytes | Rule-level change |
| --- | --- | --- |
| `079ef33529501ce6` → `f43953c5387ac9d1` | 220 → 229 | Changed declarations: `.icon` (`stroke-width` falls back to `revert-layer` instead of `1.5`). |
| `8bdcdb4ecc001bf3` → `71b6dc7ffea49526` | 23517 → 24558 | Changed declarations: `.input::-webkit-search-cancel-button`, `.input::-webkit-calendar-picker-indicator`, `.input[type=time]::-webkit-calendar-picker-indicator`, `.input::-webkit-inner-spin-button`, `.input-group-field`, `.select`, `.select-option` (mask drawings only). |
| `f726d037415adbac` → `d92a4c73fc4d4f1d` | 2520 → 2074 | Removed rules: `.pager-label:before` and `:after` for each direction, their `:dir(rtl)` forms and the forced-colors rule. Added rules: `.pager-label .icon` for each direction and their `:dir(rtl)` forms. Changed declarations: `.pager-label`. |
| `7d752a658d393aca` → `c18793eb5186327a` | 2584 → 2409 | Removed rules: `.accordion-trigger:after` with its hover, active, reduced-motion and forced-colors forms. Added rules: the same five on `.accordion-trigger .accordion-chevron`. Changed declarations: `.accordion-item`. |
| `647a14e24fa0e60a` → `daa04f5c160da517` | 5028 → 5088 | Changed declarations: `.table-heading` (`--table-chevron` drawing). |
| `0d1eb48614f6beb8` → `3d965512812c3f3b` | 5029 → 5089 | Changed declarations: `.table-heading` (`--table-chevron` drawing). |
| `e6894d25c613e67a` → `e3e10aeed1763af6` | 1577 → 1590 | Removed rules: `.ui-tray>.ui-disclosure[data-variant=text-description]>summary:after`. Added rules: the same on `summary .accordion-chevron`. |
| `ab7cbf4bbd0fc552` → `480f35c238b66fcc` | 1576 → 1589 | Removed rules: `.ui-tray>.ui-disclosure[data-variant=text-description]>summary:after`. Added rules: the same on `summary .accordion-chevron`. |

The changes come from three changes in Master UI 2.1.0 that shared site 0.3.2
follows:

- **Icons a component holds in its markup.** The accordion chevron and the pager
  arrows are Master Icons in the markup instead of masks on pseudo-elements, so
  their rules select `.accordion-chevron` and `.pager-label .icon`. The shell
  writes those icons in all eight disclosure components and in the pager, and
  its 12 px text-description chevron sizes the icon.
- **Icon stroke.** `.icon` no longer forces a 1.5 stroke when `--icon-stroke` is
  unset, so each Master Icon keeps the stroke of its optical size.
- **Control glyphs.** The masks of the search cancel button, the date, time and
  number indicators, the select indicator and option check, and the sortable
  table chevron are redrawn in the Master Icons geometry.

This site's own components contain no `accordion-trigger`, `pager-label` or
other part whose glyph moved into the markup.

## Rendered effect

The built output was read in a browser at `/guide/typography` in the dark theme.

- The 1920 `accordion-trigger` summaries in the 389 pages each end with one
  `accordion-chevron`, their `::after` has no content, the chevron is 16 px and
  the text-description chevron 12 px.
- The 230 pager labels each hold one 14 px icon, before the word on the previous
  link and after it on the next one, with no pseudo-element content.
- The search dialog lists results in the listbox layout: a kind icon on the
  title's line (five different icons across one query), a marked title, a path
  such as Guide › Getting started › heading on one line and an excerpt of at
  most two lines. Arrow keys move `aria-activedescendant` and `aria-selected`,
  Escape closes the dialog, and the console reports no error.

The light theme, narrow widths and forced colors were not read for this review.

## Delivery budget

All 81 budgeted routes are measured again. Seventy-five deliver less CSS, three
are equal and three deliver more: `/` and `/404` by 148 gzip and 104 Brotli
bytes, from the redrawn control glyphs on pages that load no accordion or pager,
and `/examples/article-transitions` by 3 and 2. The budgeted total falls from
2879736 to 2863371 gzip bytes and from 2459856 to 2444802 Brotli bytes. File
counts, import depth and inline CSS are unchanged.
