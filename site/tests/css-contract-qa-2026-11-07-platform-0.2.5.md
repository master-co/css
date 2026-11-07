# Shared platform 0.2.5 site CSS baseline review

The reviewed build is `main` with `@master/internal-site@0.2.5` (published from
`master-co/master` after its validation run) and Master CSS 2.0.1 workspace
packages. It approves the CSS baseline change caused by the platform upgrade.
Release-site browser verification and Cloudflare delivery remain separate gates.

## Exact contract and intentional changes

The previous snapshot (`css-contract-qa-2026-11-07.md`, SHA256 of the reviewed
file `d1f9a14946a46557682258b1c5bf4f53a0b9863dbdac770be751fe3d789c5615`) recorded
384 routes, 80 contracts and 2,282 segments. The new snapshot records 384 routes,
52 contracts and 2,258 segments. Every route changes; the project manifest,
semantic and public baselines are equal.

- **Prerender delivery.** Platform 0.2.5 runs the Master CSS Astro integration in
  `prerender` mode instead of `progressive`. Every route keeps its generated CSS
  in the HTML and drops the hydration manifest: for example `/guide/introduction`
  goes from 3,440 hydration bytes, retained class names and five resource-order
  variables to none. This collapses 80 distinct contracts to 52.
- **Lazy search dialog.** The search dialog and its results now load with the
  dialog (master `Merge(Site): Integrate lazy search with localized dialogs`).
  The 24 `.ui-dialog*`, `.ui-results*`, `.ui-search-shortcut` segments and their
  forced-colors and narrow-width media blocks leave the first-load CSS
  (`/guide/introduction`: 128,043 → 123,339 bytes).
- **Shared component utilities.** `(aspect-ratio:16/9)`, `mt-lg`,
  `outline-text-link:focus-visible` and `outline-offset-4xs:focus-visible` are
  added by the 0.2.5 components, with three token blocks that follow their routes.

31 segments are removed and 7 added. No Master CSS engine or preset output
changed; every delta follows from the platform's delivery mode and components.
