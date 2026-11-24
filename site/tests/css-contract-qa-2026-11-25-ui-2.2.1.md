# Master UI 2.2.1 and shared site 0.3.6 site CSS review

The reviewed build is `main` at `456935183`, with `@master/ui` raised from 2.1.0
to 2.2.1, `@master/internal-site` from 0.3.4 to 0.3.6 and `@master/icons-astro`
and `@master/icons-svelte` from 1.0.3 to 1.0.5.

## Exact contract and changes

The previous snapshot SHA256 is
`20db085a97bdc89d151d8ec063ccc8c89420d1cc2c0c382b2434ebb56771ac65`
(approved by `css-contract-qa-2026-11-24-shared-site-0.3.3.md`): 389 routes, 58
contracts and 519 exact segments. The new snapshot records the same 389 routes
and 58 contracts with 520 segments. No route was added or removed, and the
project manifest, semantic and public baselines are equal. Nineteen segments
were replaced by a new version of the same stylesheet and one was added.

Master UI 2.2 component stylesheets, each gaining a `[hidden]` rule that keeps
`hidden="until-found"` searchable:

| Previous | New | Bytes | Change |
| --- | --- | --- | --- |
| `973a8a034541d64e` | `9fb076a851d81bb0` | 11214 → 11284 | `.btn`, `.btn-group` |
| `13689a49c4951178` | `933d7b297d7ce9b1` | 6268 → 6355 | `.badge`, `.badge-media`, `.badge-addon` |
| `4563091da9199be2` | `1a9e4a473f5370a5` | 4008 → 4122 | code block, line, panel, header and title |
| `ca39b23cc28dfad6` | `926ce1714102d588` | 4233 → 4314 | `.segmented`, `.segmented-item` |
| `c18793eb5186327a` | `930d538f25aa085d` | 2409 → 2493 | `.accordion`, `.accordion-trigger` |
| `d92a4c73fc4d4f1d` | `0dac76efde249bfd` | 2074 → 2160 | `.pager`, `.pager-link`, `.pager-label` |
| `86f4ecd234763236` | `c71f07c183216878` | 3762 → 3816 | `.kbd` |
| `71b6dc7ffea49526` | `c92414fb646a13db` | 24558 → 24719 | input group, fieldset, field, select and option |
| `630d8c5df7965f8a` | `e64fb84d247a3286` | 7609 → 7820 | window parts and the slider |

Master UI 2.2 stylesheets with new behavior as well as the `[hidden]` rule:

| Previous | New | Bytes | Change |
| --- | --- | --- | --- |
| `9c707e17ef14d7cf` | `46e7b812ab8cbcb5` | 2562 → 3460 | vertical tabs (`aria-orientation=vertical`) with an anchored side indicator |
| `daa04f5c160da517` | `6c8650617606973f` | 5088 → 5497 | sortable headings without a sort button reserve the indicator space |
| `3d965512812c3f3b` | `b0549ed0a4f7f4db` | 5089 → 5498 | the same table change in its second import order |
| `dddec8a2fa60a8e5` | `b2a6ed349b5d3b97` | 1834 → 1835 | `--alert-text-inset`: an alert's trailing action aligns under its text |
| `de207d1a5a596c16` | `b4e31e3c3656eb61` | 1835 → 1836 | the same alert change in its second import order |

Shared site 0.3.5–0.3.6 stylesheets:

| Previous | New | Bytes | Change |
| --- | --- | --- | --- |
| — | `2c8e3a46eab43a73` | 808 | New badges and section dots (`.ui-new`, `.ui-new-dot`) |
| `c2895f936e3e184c` | `6d174563f9790e51` | 1465 → 2254 | the page head's added-section row (`.ui-pagehead-new`) |
| `68b74ed64f3117b4` | `c2d0fb79edd5a12f` | 1466 → 2255 | the same page head change in its second import order |
| `2ef0cd8d5426af56` | `b9f8bd1dbffa0a52` | 11151 → 11095 | the header nav's `.badge` margin rule moves to the New badge |
| `cf9a013a3a44cff7` | `6c16f429c96cd39c` | 4041 → 4053 | a documentation rule now excludes `.badge` |
| `f0808942406d3b45` | `f784a36a50573cbe` | 1646 → 1674 | tray heads pad their title instead of pulling controls up with negative margins |

## Verification

The local build and the 389-route style delivery audit pass with the recorded
budgets, translation audit reports no problems, and the CI browser suites run
on this commit. Rendered pages were not read by hand for this review: vertical
tabs, sortable headings and the trailing alert action are not used on this
site's pages, and the `[hidden]` rules apply only to elements that are hidden.

## Delivery and HTML

79 of the 81 budgeted routes rise by 23 to 1210 gzip and 25 to 1030 Brotli
bytes; the budgeted total rises from 2868636 to 2942725 gzip bytes and from
2449581 to 2512199 Brotli bytes. File counts, import depth and inline CSS are
unchanged.
