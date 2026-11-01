# CSS contract refresh, 2026-11-01

## Refresh {#refresh}

The committed snapshot dated from `095ce731d` and no longer matched `rc`. This refresh records the output of `rc` at `76b80ebb9` plus the follow-up commits on `design/followups`. It was approved in the 2026-11-01 refactor session ("全做").

### Drift already on rc (`095ce731d` → `76b80ebb9`)

Nine commits since the old snapshot changed site output:

- `dacbf69eb` rebuilt the Reference as structured sheets.
- `85f210253` consolidated the Guide into task pages.
- `acac92606` made fixed values static utilities and renamed the gap axes.
- `d58b586e4` shared the typed Manifest v6 model.
- The rest were site polish and tooling commits: `d782e8f91`, `9e6842f95`, `5571a4496`, `4206fd97e` and `d962c7452`.

| Change | Count |
| --- | --- |
| Routes removed (mostly consolidated `/guide/installation/*`, `/tw/guide/*` and `/tw/reference/*` pages) | 148 |
| Routes added (Reference sheets and consolidated guides) | 24 |
| Shared routes with a different CSS contract | 221 |

The project manifest also changed for the same reasons: `radius-pill` became the static `pill` utility, and the spacing and direct-value families moved.

### This change set

Compared against a build of `76b80ebb9` with the same toolchain, the delta is fully attributed. Preset shadow values were substituted before comparing.

- Four delivered CSS segments that hold preset `--shadow-*` values now carry the converged shadows.
- `/design-system/review/comparison` and `/design-system/review/label` (and their `/tw` copies) list every shadow token. They gain `--shadow-inset` and `.shadow-inset`.
- The manifest gains the converged shadow values, `--shadow-inset` and eleven `--max-*` custom media. Keyframe ids change their file-hash prefix because `theme.css` changed; their offsets are unchanged.
- `@max-md` and the new lint examples appear only in documentation code, not in delivered site CSS.

### Visual check

The routes below were captured from the static build at 1280px in light and dark:

- `/`
- `/guide/introduction`
- `/guide/responsive-design`
- `/guide/code-linting`
- `/reference/tokens/shadow`: Values lists `shadow-inset`, and the Usage preview shows the converged `shadow-xs` and `shadow-lg`.
- `/reference/tokens/breakpoints`: the new "Below viewport widths" group.
- `/design-system/review/comparison`

No layout regressions were seen. The rc drift above was reviewed by its own commits; it is recorded here, not re-reviewed page by page.

## Single-parenthesis queries {#single-parenthesis-queries}

Class queries drop their native group parentheses: `@media((width>=50rem))` becomes `@media(width>=50rem)`, and the engine restores the group when it emits the query.

The delta against the `rc` snapshot is fully attributed by rewriting the old class names the same way:

- 14 delivered CSS segments change only their escaped selector, for example `.x\@media\(\(width\<64rem\)\)` → `.x\@media\(width\<64rem\)`. The at-rules and declarations are byte-identical.
- No other segment, route, contract or project manifest entry changes.

## Moonstone interface {#moonstone-interface}

`design/moonstone` replaces the site interface with the `ui-*` system in `site/styles/system/` (tokens, mixins and component styles) and then tunes it to the owner's direction: zinc neutrals, light regular type, small radii and clearer dark contours. It was approved in the 2026-11-01 Moonstone session ("核准更新", "繼續").

The comparison is against the `rc` snapshot at `3f5b38def`, built with the same packages, so the delta belongs to this change set.

| Change | Count |
| --- | --- |
| Routes removed (`/design-system/review/text` and its `/tw` copy; its primitive no longer exists) | 2 |
| Shared routes with a different CSS contract | 244 |
| Delivered CSS segments | 3,742 → 2,773 (1,907 removed, 938 added) |
| Delivery contracts | 124 → 123 |
| Total CSS delivered across routes | 39.4 MB → 30.6 MB (−22.3%) |
| Median CSS per route | 165 KB → 123 KB |

- The document shell, reading styles, code, demos and data views now use `ui-*` component rules on `--ui-*` roles instead of long utility lists and the former `doc-*`, `app-*`, `demo-*`, `ds-*` and `code-*` classes. Routes no longer emit the many preset utility rules those lists required, which is most of the reduction (for example `/guide/installation` 168 KB → 122 KB, `/design-system` 207 KB → 133 KB).
- `data.css` and `specimens.css` are imported by the components that use them, so only Reference, benchmark and demo routes carry them.
- Ten routes grow. They are bare sections or the 404 page, which import `globals.css` themselves and now receive the global system files: `/examples/*` (+42 to +55 KB), `/design-system/review/home-icons` (+32 KB), `/blog` (+25 KB) and `/404` (+12 KB). A narrower stylesheet for example pages was tried and delivered more CSS, so it was withdrawn; [Route style boundaries](#route-style-boundaries) trims these routes.
- The project manifest changes because `materials.css` re-points the site `@theme` utility tokens at the `--ui-*` roles, seven unused theme tokens are removed (`--stripe-pink`, `--grid`, `--color-float`, `--color-text-primary`, `--color-success`, `--color-danger`, `--color-line-danger`) and `mixins.css` adds `--ui-sheet-face`, `--ui-focus-ring` and `--ui-label-type`.
- `scripts/verify-css-contract.ts` now expects the shell's own route declarations (`--prose-bleed`, `--color-line-media`, `--docs-header`) and the `ui-*` markers in place of the removed classes.

### Visual check

Routes were compared against the previous design at 1280 and 390 px in light and dark: `/guide/installation`, `/guide/syntax-tutorial`, `/guide/responsive-design`, `/reference/tokens/spacing`, `/design-system` and its review pages, `/benchmarks`, `/blog` and a post, `/brand`, `/404` and `/`. The browser checks for reading, navigation, demos, reviews, states, the homepage header, brand, search, illustrations and anchors pass. Known exceptions: `migration/css` previews at 320 px with 200% text (the reading column keeps its gutters on phones by design) and the documentation-geometry baseline, whose fixture is missing.

## Route style boundaries {#route-style-boundaries}

`globals.css` now holds only the foundation (preset, `theme.css`, `mixins.css`, `tokens.css`, `base.css`). The system component files load in ordered asset boundaries (`site/routes.ts`): the shell interface (`styles/interface.css`: controls and shell) on every page in the site shell, and document styles (`styles/documents.css`: surfaces, code and prose) unless a page exports `documentStyles = false`. The Blog index, 404 and the homepage icon handoff opt out. Bare `/examples/*` pages import only the system files their scene renders. It was approved in the 2026-11-01 route style boundaries session ("核准並提交").

Why the first attempt grew: every stylesheet that imports `@master/css` is a Master CSS entry, and all entries compose one project graph. A second entry for the examples delivered the union of both entries on every route that linked either, so the CSS grew (+14.9 KB on every route) instead of shrinking. The component files are therefore local stylesheets. One stylesheet per boundary keeps each local output's theme-variable emission to one copy. Separate boundaries keep the cascade layers in order, because links within one boundary are unordered. A shared `controls.css` chunk once linked before `globals.css` and declared `components` before `theme`. `verify-css-contract.ts` now rejects any route whose layers are not declared as `theme > base > defaults > components > utilities`, and checks which routes carry the interface and document boundaries.

`rc` moved to `0bc88aec0` after its last snapshot, and that commit changes site output without updating the snapshot. A build of `0bc88aec0` alone, with the same packages, attributes this drift to `@custom-container`:

- The project manifest gains `customContainers` (`--3xs` … `--7xl` and their `--max-*` forms).
- Four routes gain `@container (width >= 28rem){.grid-cols\(2\)\@container\(--md\){…}}` from `FoundationExamples.tsx`.
- 240 routes gain one byte of whitespace before a `@layer components {` wrapper.

This change set, compared against that `0bc88aec0` build:

| Change | Count |
| --- | --- |
| Shared routes with a different CSS contract | 244 (all; segment order and link boundaries changed) |
| Delivered CSS segments | 2,774 → 2,774 (1 removed, 1 added) |
| Delivery contracts | 123 → 123 |
| Total CSS delivered across routes | 30.63 MB → 30.72 MB (+0.32%) |
| Median CSS per route | 122.8 KB → 124.5 KB |
| Project manifest | unchanged by this change set |

| Route (and `/tw` copy) | Before Moonstone (`68f8674c1`) | rc (`0bc88aec0`) | Now | vs before Moonstone |
| --- | --- | --- | --- | --- |
| `/examples/responsive-button` | 16.4 KB | 71.8 KB | 18.4 KB | +2.0 KB |
| `/examples/responsive-gallery` | 40.4 KB | 82.2 KB | 28.8 KB | −11.6 KB |
| `/examples/layout-system` | 43.3 KB | 85.6 KB | 40.4 KB | −2.9 KB |
| `/examples/article-transitions` | 41.4 KB | 83.4 KB | 56.9 KB | +15.5 KB |
| `/examples/view-transitions` | 40.4 KB | 82.3 KB | 55.7 KB | +15.3 KB |
| `/404` | 75.6 KB | 87.5 KB | 65.6 KB | −9.9 KB |
| `/blog` | 84.3 KB | 109.1 KB | 87.3 KB | +3.0 KB |
| `/design-system/review/home-icons` | 75.2 KB | 107.2 KB | 85.4 KB | +10.2 KB |

- The ten routes above lose 21.9–53.4 KB against `rc`.
- The remaining growth against the pre-Moonstone build is attributed. All routes gain `tokens.css`, the `--ui-*` roles: 7.5 KB, net +2.0 KB after the removed demo and code variables, which is all of `/examples/responsive-button`. The two view transition scenes render one `ui-button` or `ui-segmented` and one `ui-sheet`, and load whole `controls.css` and `surfaces.css` (about 27 KB) in place of the 3 KB demo button family. `/blog` and the icon handoff carry the shell interface (31.6 KB), which replaced the former header, menu and search styles.
- Every other route (234) gains 1,762 bytes. The interface and document boundaries are local stylesheets, and each emits the theme variables it uses: `--font-family-sans`/`-mono`, `--font-sans`/`-mono`, `--color-zinc-0`/`-95` and the `@theme static` code colors from `syntax-theme.css`. Inside the single entry these were emitted once. All 234 routes remain below their pre-Moonstone size.

### Visual check

The checks below ran on `51dd1eac7`. On `0bc88aec0`, this change set's byte delta is identical for every route. The `rc` build and this build were served side by side. The check compared every element's computed style, including `::before` and `::after`, at 1440 px in light and dark on these routes: the ten routes above, `/`, `/guide`, `/reference`, `/guide/monorepo`, `/guide/view-transitions`, `/guide/layout-system`, `/reference/packages`, `/design-system`, `/design-system/review/{documents,controls,viewport}`, `/brand`, `/benchmarks`, `/blog/master-css-next` and `/tw/guide/colors`. Interactive states were also compared: the mobile menu at 390 px (`/blog`, `/404`, the icon handoff, `/guide/monorepo`), the search dialog and both transition scenes after a click. All styles match. The only difference was an animated `scale` on the homepage lint figure, which differs between two loads of the same build.

`node site/scripts/visual-capture.mjs` captures (1440×900, light and dark) of the eight routes in the table are byte-identical, except `/examples/responsive-gallery`. It differs only where lazy, asynchronously decoded photos load at different times; two captures of the same build differ the same way.

`interior-navigation`, `interior-demos`, `guide-preview-reflow`, `brand-system`, `design-system-figures` and `demo-flow-sizing` give the same results on both builds. The same six known failures appear on `rc`: `migration/css` reflow ×2, the missing documentation-geometry fixture, demo reduced-motion pausing, and the brand comparison at 320 px ×2.


## Documentation refinement {#documentation-refinement}

`design/moonstone-refine` refines the documentation interface after comparing it with mature documentation sites. It restores the wide grid, so running text keeps a 41rem measure while steps, page tabs and the pager span a wide column and code, previews, tables and charts hang out up to 2rem on each side with aligned edges. Search moves to a quiet pill at the top right of the header. Group and page captions become tracked uppercase eyebrows. The footer becomes three columns on a 32px pitch with a quiet bottom row, the pager becomes a hairline row, and link marks no longer push punctuation away. It was approved in the 2026-11-01 Moonstone session ("合進 rc").

The comparison is against a build of `rc` at `bb6af9f29`. That build matches the committed snapshot byte for byte, so the delta belongs to this change set.

| Change | Count |
| --- | --- |
| Routes added or removed | 0 |
| Routes with a different CSS contract | 244 (all grow) |
| Delivered CSS segments | 2,774 → 2,803 (101 added, 72 removed) |
| Delivery contracts | 123 → 123 |
| Total CSS delivered across routes | 30.7 MB → 31.9 MB (+3.7%) |
| Median CSS per route | 124 KB → 129 KB |

- Documentation routes gain 4.6–5.5 KB: the wide-grid and hang rules in `styles/docs-shell/docs.css` and `prose.css`, the eyebrow mixin, the header search pill, and the footer and pager rewrites. `/tw` routes match their English pages.
- Routes outside the documentation shell gain less, from the shared header, footer and tokens: `/` +3.4 KB, `/blog` +3.0 KB, `/404` +2.7 KB, `/examples/*` +0.15–0.33 KB.
- The project manifest grows by 867 bytes for the new tokens and the `--ui-eyebrow-type` mixin, and drops the unused `--content-external` and `--content-hash` theme tokens.

### Visual check

Routes were compared with the previous state at 1280 and 390 px in light and dark: `/guide/installation`, `/guide/syntax-tutorial`, the guide index, `/reference/tokens/spacing`, `/design-system`, `/benchmarks`, `/blog`, `/brand` and `/404`. After rebasing onto the route style boundaries, the browser checks for reading, navigation, demos, reviews, states, the homepage header, brand, search, illustrations and anchors pass. The known exceptions are the `migration/css` previews at 320 px with 200% text and the missing documentation-geometry fixture.

## Brand identity boundary {#brand-identity-boundary}

`brand-cleanup` narrows `/brand` to the identity now that the Design System owns the interface: the mark and logotype, their gold, the typefaces, the voice, the artwork downloads and the trademark policy. The page moves from its own hero, chapter navigation and 427-line `brand.css` onto the standard document shell (page head, contents rail, `ui-tray` specimens, `ui-table`, `ui-swatch`), with a 30-line `brand.css` for the clear-space, minimum-size and typeface specimens. Color roles, spacing, radii, materials, controls, motion and the applied compositions are left to `/design-system` and Reference.

The comparison is against the committed snapshot, which a build of `rc` at `7a8a4fa18` matches for every other route.

| Change | Count |
| --- | --- |
| Routes added or removed | 0 |
| Routes with a different CSS contract | 2 (`/brand`, `/tw/brand`) |
| Delivered CSS segments | 2,803 → 2,539 (21 added, 285 removed) |
| Delivery contracts | 123 → 123 |
| `/brand` CSS | 183,318 → 141,783 bytes (−22.7%) |
| `/brand` hydration payload | 5,755 → 2,346 bytes |

- The removed segments are the brand-only rules for the hero, chapter navigation, color-role cards, type scale, spacing and radius scales, materials, controls board and application compositions, plus the utilities and tokens only they used.
- The added segments are the specimen rules, `.brand-gold [data-signal]` (which delivers `--color-amber-40`), and the document-shell rules the page now shares with Benchmarks and the Guide.
- The project manifest is unchanged. `DemoAsset` gains a `data-demo-container` marker so the prose media perimeter no longer outlines the downloadable artwork; it changes no CSS.

### Visual check

`/brand` was reviewed at 1280 and 390px in light and dark on the development server. `brand-system.e2e.mjs` passes in Chromium and WebKit: no overflow, every anchor resolves, the visible artwork matches the background in both schemes and without JavaScript, the minimum sizes render at 16, 24 and 16 CSS pixels with their source proportions, downloads are byte-identical to the originals, and enlarged text with forced colors stays readable.
