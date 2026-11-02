# Astro + Svelte merge baseline

This records the pre-extraction site at `7e2ef27c3cc0`, after the user confirmed the
`site-svelte` merge and authorized adopting Astro + Svelte throughout the shared
site migration. It does not deploy the site or authorize publishing an undated post.

The clean build produces 243 routes. The project manifest is byte-for-byte equal
to the previous approved snapshot after repository-relative normalization. There
is no compiler, preset, layer-order or token-value change in this refresh.

The exact segment review removes 13 strings and adds 15:

- Astro's `astro-island`, `astro-slot` and `astro-static-slot` display-contents rule
  replaces the former `site-island`/`site-slot` rule.
- Existing view-transition examples now use authored local selectors and their
  scoped transition rules instead of the previous utility declarations. The local
  example also emits the existing `--duration-slow:.3s` token.
- Illustration expand controls add their light/dark visibility and print rules.
- The empty `@layer theme` segment differs only in preceding whitespace.

All 243 contract IDs change because the common island stylesheet changes. The
snapshot still records every exact segment, ordering, hydration state and project
manifest; no comparison was removed or weakened.

The merged source currently includes `/blog/v2` and `/tw/blog/v2`, accounting for
the two additional routes. These are baseline artifacts only: the organization
migration keeps that undated article outside public content in `site/drafts` and
must exclude it from production routes, search, feeds, sitemap and exports.

Validation: clean Astro production build (243 pages), static postbuild, 90 public
asset checks, full site lint and TypeScript check passed. Browser captures covered
home and Guide at 1440px in light/dark, and Reference at 390px. Home/Guide reported
no browser errors. The initial mobile capture against Python’s simple HTTP server reset two JS
requests. Repeating the probe against Astro preview completed without failed
requests and without horizontal overflow. The visual output
retains the reading layout, header, side navigation, example surfaces and themes.

Capture/report files for this session are under `/tmp/master-site-visual` and
`/tmp/master-baseline-*-visual.log`; these are local evidence, not deployed URLs.
