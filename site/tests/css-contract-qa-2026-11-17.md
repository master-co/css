# Shared site 0.2.16 site CSS review

The reviewed build is `main` at `d30a27688` (Master CSS 2.1.7) with
`@master/internal-site` raised from 0.2.13 to 0.2.16. The base build at the same
revision with 0.2.13 verifies against the previous snapshot, so the whole delta
below belongs to the shared site release.

## Exact contract and intentional change

The previous snapshot SHA256 is
`20806261c1d9ae0a65088ae389cbf8896e3a0575849c03323b06699f0c27eeeb`
(approved by `ui-texture-qa-2026-11-12.md`): 389 routes, 58 contracts and 2,246
exact segments. The new snapshot records 389 routes, 58 contracts and 2,212
segments. No route or contract was added or removed, and the project manifest,
semantic and public baselines are equal.

All 389 routes change. Their delivered CSS falls from 63,512,579 to 50,904,147
bytes in total (20%), and the segments a route repeats fall from 37,030 to
21,364 across the site.

## Attribution

Across all routes, 35 distinct segments are new and 70 are gone:

- Shared site 0.2.16 loads Master UI stylesheets as modules instead of CSS
  `@import`s, so a component that two stylesheets used is delivered once. This
  removes repeated segments and adds none.
- The shared Astro integration declares `globalStyleEntry`, so Master CSS 2.1.7
  emits the theme variables and keyframes of every local stylesheet once from
  the site entry. The per-stylesheet `:root,:host{…}` blocks leave (60 of the 70
  removed segments, with the `@font-face` segment below) and the entry's merged
  blocks arrive (21 of the 35 added). Every variable keeps its value.
- The document head declares `@layer theme, base, defaults, components,
  utilities;` inline: shared component stylesheets can link ahead of the entry
  that declares the order. It is a new segment, and the `@font-face` segment
  after it is cut at a different leading blank line.
- Site overrides of a Master UI component name the component's class too,
  because a build does not keep module import order: `.tooltip.ui-tooltip` (and
  the seven header rules that position it), `.pager.ui-pager` and
  `.select.site-select-overlay[data-variant="overlay"]`. Ten segments are
  replaced by ten.
- `.mcss-host-active-on-hover` arrives with shared site 0.2.14's on-demand class
  highlighting, on the 365 routes with code panels.

`/examples/responsive-button` alone grows (473 gzip bytes): the shared entry now
carries globals its bare page does not use.

## Rendering

Every element's computed style, custom properties excluded, was compared
between the base and the reviewed build in Chromium: 41 English routes at 1280
px in the light theme, 17 at 600 px in the dark theme, and `/`,
`/examples/responsive-button` and `/tw` with nine more at both widths and
themes. No element differs. Hover and focus states were not exercised.
