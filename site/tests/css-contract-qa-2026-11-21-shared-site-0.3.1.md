# Shared site 0.3.1 site CSS review

The reviewed build is `chore/upgrade-shared-site` on `main` at `7e2e17428`, with
`@master/internal-site` raised from 0.3.0 to 0.3.1 and `@master/ui` unchanged at
0.0.11. The base build at the same revision verifies against the previous
snapshot.

## Exact contract and intentional change

The previous snapshot SHA256 is
`eccc50abe7bc0844ef0d2099724cefbe51a36234f9863a8e7603e8feaf1058f0`
(approved by `css-contract-qa-2026-11-21-api-index.md`): 389 routes, 58
contracts and 511 exact segments. The new snapshot records the same 389 routes,
58 contracts and 511 segments. No route was added or removed, and the project
manifest, semantic and public baselines are equal. Thirteen segments changed:

| Segment | Bytes | Rule-level change |
| --- | --- | --- |
| `0d25b721ee932c57` → `ad984603f3bcb82f` | 8030 → 7528 | Removed rules: `.ui-leader`, `.ui-leader>i`, `.ui-spacing`. |
| `179c8f0c7584394c` → `2224a315d2b78703` | 452 → 537 | Changed declarations: `.ui-code-bar>.ui-tabs`. |
| `495c4b0b1fa31419` → `4a82fa52cb2ac02e` | 4921 → 4911 | Removed rules: `.ui-prose>:is(.ui-tray,.ui-code,.ui-table,.document-comparison,.ui-callout,.ui-steps,.ui-index,.ui-logos,.ui-params,.ui-prompt,.ui-tree)`. Added rules: `.ui-prose>:is(.ui-tray,.ui-code,.ui-table,.document-comparison,.ui-callout,.ui-steps,.ui-logos,.ui-params,.ui-prompt,.ui-tree)`. |
| `6406e4b3f54cdfab` → `12293494d590e095` | 4079 → 3770 | Removed rules: `.ui-code .a`, `.ui-code .c`, `.ui-code .k`, `.ui-code .n`, `.ui-code .p`, `.ui-code .s`, `.ui-code .t`. |
| `6cbd314c6b0d31c7` → `3419928602859be5` | 221 → 217 | Changed declarations: `.ui-footer-link-mark`. |
| `74c50711590f99c2` → `9b8bb8fa33601ae1` | 9633 → 9786 | Theme entry. Removed: none. Added: `--color-mark`, `--color-mark-underline`. Changed value: none. |
| `86a31ef493efee18` → `cf9a013a3a44cff7` | 4101 → 4041 | Changed declarations: `.ui-pagehead-kicker>svg`. |
| `ac19f2e9d81ab2e9` → `1a9ca085d2199790` | 273 → 235 | Removed rules: `.ui-prompt-body var`. |
| `b618a64dc209c057` → `37069c6543b1021f` | 308 → 266 | Changed declarations: `.ui-hint>svg`. |
| `ceb2ce8d54d9e91c` → `2ef0cd8d5426af56` | 11272 → 11151 | Removed rules: `.ui-app`, `.ui-header .ui-header-menu`, `.ui-header-control.btn>svg:not(.ui-header-external)`, `.ui-menu-glyph[data-open=true]>path`, `.ui-menu-glyph[data-open=true]>path+path`. Added rules: `.ui-header-control:not(.ui-header-search).btn>svg:not(.ui-header-external)`, `.ui-header-search>svg:not([data-compact])`, `.ui-header-search>svg[data-compact]`, `.ui-header-search>svg[data-compact],.ui-header .ui-header-menu`, `.ui-menu-glyph[data-open=true]>path:first-child`, `.ui-menu-glyph[data-open=true]>path:last-child`. Changed declarations: `.ui-header`, `.ui-header-brand`, `.ui-header-end>.btn>.ui-header-external`, `.ui-header-nav>a>.ui-header-external,.ui-header-end>.btn>.ui-header-external`, `.ui-header-search>svg`, `.ui-menu-glyph>path`, `.ui-mobile-menu-community>a>.ui-menu-external`. |
| `d66b50fac52e12f0` → `cfc70a7cc3999a9c` | 1533 → 1496 | Removed rules: `.ui-nav-link>.badge`. |
| `e1d6753d444f6967` → `c70d4b3224053206` | 8031 → 7529 | Removed rules: `.ui-leader`, `.ui-leader>i`, `.ui-spacing`. |
| `f1c42a0282fd5ce2` → `5e0ac0651a36047a` | 1004 → 827 | Removed rules: `.ui-table-caption`. |

The changes come from five shared-site changes in 0.3.1:

- **Master Icons.** The shell draws Master Icons 1.0.3 instead of Tabler. Icons
  size themselves, so `.ui-pagehead-kicker>svg` and `.ui-hint>svg` no longer set
  a size or a stroke width, the header search carries a desktop and a compact
  drawing selected by `[data-compact]`, and the menu glyph rotates its two lines
  in the 20 px view box.
- **External link marks.** The mark is 8 px instead of 10 px, sized by the icon,
  and sits `1rem` up and out from the centre of an icon control.
- **Search palette.** The search dialog is composed from the Master UI command
  palette, which brings `--color-mark` and `--color-mark-underline` into the
  theme entry.
- **Code tabs.** `.ui-code-bar>.ui-tabs` drops its own border and shadow so one
  separator shows under the tabs.
- **Unused rules.** `.ui-leader`, `.ui-spacing`, `.ui-table-caption`, `.ui-app`,
  `.ui-nav-link>.badge`, `.ui-prompt-body var` and the single-letter
  `.ui-code` token rules are gone, with `.ui-index` leaving the reading
  selector list. No built page of this site contains an element they matched.

## Rendered effect

`tests/header-layout.e2e.mjs` and `tests/mobile-menu.e2e.mjs` of the shared site
pass against this build and the Master site in light and dark at 1440, 1280,
1100, 1024, 768, 390 and 320 px (58 menu cases). The header, the search dialog,
the mobile menu and the footer render with the new icons and marks; reading
pages are unchanged apart from them.

## Delivery budget

All 81 budgeted routes are measured again. Seventy-nine deliver less CSS and two
deliver more: `/404` by 8 gzip and 7 Brotli bytes and
`/examples/responsive-button` by 13 and 9, from the second search drawing on
pages that load little else. The budgeted total falls from 2934724 to 2879736
gzip bytes and from 2507067 to 2459856 Brotli bytes. File counts, import depth
and inline CSS are unchanged.
