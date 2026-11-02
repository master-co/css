# Shared site migration CSS review — 2026-11-03

Reusable Astro/Svelte layouts, styles and rendering move to `@master/internal-site`,
validated first as the next.18 tarball and then as the published `0.1.0` package. Master owns Blog, Brand and
Design System; Master CSS retains product pages.

## Reviewed changes

- The 243-route baseline becomes 153 routes. All 90 removed routes belong to Blog,
  Brand or Design System, including former localized copies. No product route
  was removed and no new product route was introduced.
- All 153 retained routes have identical parsed CSS declaration multisets,
  including selector, condition and layer ancestry. Package extraction changes
  stylesheet boundaries/order and whitespace, without changing declaration values.
  Standalone example CSS is byte-identical. The homepage grayscale rule changes
  asset position only.
- Development manifest source paths and a source-derived keyframe definition ID
  now identify the installed package. Hydration fingerprints consequently change;
  stylesheet delivery remains static.
- An intermediate build loaded the foundation twice through bare examples. This
  was rejected and fixed: every route loads its configured foundation once; bare
  sections omit only interface/document chrome. The verifier checks this invariant.
- The 404 uses a generic page section independently of the removed Brand route.

## Validation and decision

- 153-page Astro build and 85 public asset checks passed.
- All 152 non-404 desktop pages and eight mobile pages in both themes passed
  browser checks (168 cases): no resource/page errors or horizontal overflow.
  Each reports the intended Geist/Noto font family. Introduction/light and Font
  Reference/dark mobile screenshots were inspected for readable text and tables.
- Reference 27 tests and portable product exports 35 tests pass. Astro, Svelte and
  TypeScript checks pass. Master separately checks 50 pages, stylesheet isolation,
  a single foundation per page, and 43 review tests at 320px/200% text size.

Accept the snapshot for the intentional ownership and asset-boundary change.
This records local source/build review. Published dependencies, clean CI and
production cutover remain separate gates; this is not a pixel comparison of
every interactive state or a production deployment record.

## Development verification

The startup helper was using a retired search class and `/reference/grid-columns`;
update it to the current search data attribute and `/reference/grid-tracks`.
The memory helper now imports the shared virtual route map and omits the moved
organization review page (covered by Master's review browser suite).

One cold-cache browser run per checkout on Node 24.22.1 confirmed homepage-only
route loading (one page, zero MDX modules), working search and subsequent
Guide/Reference navigation. Both had zero idle emitted-global updates.

| Measurement | Before extraction (df48b3584) | Published package consumer |
| --- | ---: | ---: |
| Server ready | 1.45 s | 1.92 s |
| First homepage response | 1.21 s | 5.13 s |
| Search interactive | 10.22 s | 7.32 s |
| Warm homepage median | 144 ms | 150 ms |
| Post-GC heap after homepage | 306 MiB | 284 MiB |

These are single-run diagnostic observations under concurrent local work, not a
performance improvement claim or a statistically stable regression threshold.
The HTTP-only repeat/invalidation run passed the lazy-loading assertion: homepage
heap was 217 MiB initially and 220 MiB after 30 requests; Guide heap was 238 MiB
after both 10 and 20 requests; 20 simulated watcher invalidations ended at 244 MiB.
This is bounded development validation, not a multi-hour leak test.
