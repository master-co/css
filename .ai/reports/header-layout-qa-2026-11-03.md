# Header and documentation rail QA — 2026-11-03

User-requested change: Master navigation keeps Products/Blog; remove the homepage
Principles section. Master CSS desktop header keeps Search, GitHub, divider,
language, including its homepage. Preserve all community destinations in the
footer and compact menu. Mark external header destinations with a raised 10px
arrow. Shared implementation is owned by Master, distributed as internal-site 0.1.1.

The old rail selector targeted site-island, but Astro emits astro-island.
Correcting that selector restores the existing 3.5rem top padding, 15.75rem
rail width and sticky positioning, rather than introducing a new offset.

Validation:
- Master workspace build: 50 pages; 48 canonical pages, 2 published posts.
- Packed Master CSS consumer: 153 pages; 85 public assets verified.
- Shared Astro/Svelte checks and 49 package tests pass; shared package has no lint script.
- Master site Astro/Svelte checks pass; 50 pages, 157 stylesheets and 2559 local URLs pass static verification. Master site has no lint script.
- CSS site lint and Astro/Svelte/TypeScript checks pass.
- Master site/tests/header-layout.e2e.mjs: 40 page cases across both sites,
  light/dark and widths 1440/1280/1100/390. No overflow or browser errors.
  Checks desktop control order, arrow size/placement, hidden mobile rails,
  compact menu opening/closing, removal of Master links and Principles.
- At 1440 and 1280px, TOC caption and article header both start at y=116px;
  after 500px scrolling the rail stays at y=60px. This checks actual Astro islands.

CSS contract review:
- Project manifest and all 153 route keys are unchanged.
- 149 routes change because they load shared header/docs CSS; no standalone
  /examples/ route changes its delivery contract.
- Exact segment comparison removes 4 and adds 8 distinct segments, exclusively
  the three site-island -> astro-island selectors, external header arrow rules,
  and homepage header controls. No unrelated declarations changed.
- Snapshot updated with this report as the QA reference.

Package integrity: sha512-BgTwfk8yXrbI5iIjT0LH1OcOsfyMm/3eVcRfn3nhpLOEaVY2TmzfuUhXQBarDrZ6xLC8scec4kLGIpXZ35/+NQ==

Hosted verification repeats all 40 cases against:
- https://03e25379.master-co.pages.dev
- https://47945101.master-css-e8w.pages.dev

Both preview checks pass. Production is not changed by these preview deployments.

Release verification: npm registry 0.1.1 contains exactly the tested 3,435,886-byte
archive (all 687 packed files match the committed Master source/build).
CSS uses exact 0.1.1 with its integrity in bun.lock and an exact release-age
exception. Registry installation, site lint and CSS-contract checks pass.
