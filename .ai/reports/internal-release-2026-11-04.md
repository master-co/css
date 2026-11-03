# Internal package upgrade — 2026-11-04

Release source: Master `31846bc` (site 0.1.3, skills 0.1.2).

Both packages were published successfully through GitHub OIDC in
https://github.com/master-co/master/actions/runs/41672485276 . Linux validation
and publication both passed. The downloaded npm archives, CI artifacts and
locally tested archives are byte-identical:

- `@master/internal-site@0.1.3`:
  `sha512-JpcUD9wJTfJnjFAziiA9rg0y3Tu46Zc50XRShn0iXibUWWODgdXQYBHbttKkfxAVatGS5ZIcvo9LYseu+yaMOQ==`
- `@master/internal-skills@0.1.2`:
  `sha512-OqpGcLGHSCCBP1JiIYd3mLBukcBdarw43C0Lxa5xHyzBcP2qrxSYJ+N4nJKYh2USme2eY0I1Zda4EcIa7SPL/w==`

The consumer uses exact registry pins and matching lockfile integrities. Its
frozen installation and explicit skill sync/check pass; all 738 site files and
23 skills files match the registry archive contents. No local archive dependency
remains. The exact-version minimum-release-age exemptions follow the new pins.

Verification below uses CSS source `e7ff3e9b9` plus the preserved pre-existing
CSS contract snapshot. Concurrent homepage edits are outside this release.

The packed consumer installs all 738 internal-site files byte-for-byte from the
reviewed archive. Type checks, site lint, 155-page build, 85 public assets,
155-route style-delivery budgets, skills check and AI-context checks pass.

## CSS contract review

Compared with the working snapshot at the start of this release, the product
manifest and route set are identical. Exactly five CSS segments are replaced:
document comparison surfaces join the existing document spacing/bleed rules;
transparent wrappers use actual `astro-island` and `astro-slot` elements, support
nested sections, and exclude accessible table scroll regions. These are the
intentional shared document-table corrections in Master `40ae1fb`.

The pre-existing snapshot changes for homepage refactoring and Guide ownership
are preserved. Their evidence remains in `site/tests/home-refactor-qa-2026-11-03.md`
and `site/tests/guide-ownership-qa-2026-11-03.md`.

The real-browser table audit passes 548 cases across 117 routes and 1,746 table
instances, covering both themes and mobile/desktop widths. Representative light
desktop and dark mobile screenshots were inspected. Evidence:
`/tmp/master-internal-release-tables/report.json`.

The header audit passes 98 cases, mobile menu audit passes 58 cases, and feature
checks pass 16 cases (prompt clipboard, tabs, disclosures and container controls).
These cover both sites, themes, keyboard/focus behavior and reduced motion.
Light/dark mobile menu screenshots were inspected.

## Existing limitation

Portable-content tests pass 38/39. The existing `e7ff3e9b9` AI coding guide adds
“Adapt a CSS or Tailwind component to Master CSS while preserving its appearance
and behavior.” The historical-teaching rule flags that sentence outside Migration
Guide. This release changes neither that content nor its test policy.

After registry installation, a concurrent edit added a global
`.home-header .ui-version { display: none }` rule in `site/content/page.astro`.
The subsequent 155-page Astro build and asset validation pass, but its homepage
style budget fails: gzip 63,144 > 63,126 and Brotli 49,554 > 49,510 bytes for `/`
and `/tw`. The packed-consumer build before this edit passes all style budgets.
The later build stops before its CSS-contract check. The concurrent source and
budget are not changed or committed by this release. Log:
`/tmp/css-internal-registry-build.log`.

No Master CSS push, merge, product package release or website deployment is part
of this update.
