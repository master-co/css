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
- Ten routes grow. They are bare sections or the 404 page, which import `globals.css` themselves and now receive the global system files: `/examples/*` (+42 to +55 KB), `/design-system/review/home-icons` (+32 KB), `/blog` (+25 KB) and `/404` (+12 KB). A narrower stylesheet for example pages was tried and delivered more CSS, so it was withdrawn; trimming these routes is a follow-up.
- The project manifest changes because `materials.css` re-points the site `@theme` utility tokens at the `--ui-*` roles, seven unused theme tokens are removed (`--stripe-pink`, `--grid`, `--color-float`, `--color-text-primary`, `--color-success`, `--color-danger`, `--color-line-danger`) and `mixins.css` adds `--ui-sheet-face`, `--ui-focus-ring` and `--ui-label-type`.
- `scripts/verify-css-contract.ts` now expects the shell's own route declarations (`--prose-bleed`, `--color-line-media`, `--docs-header`) and the `ui-*` markers in place of the removed classes.

### Visual check

Routes were compared against the previous design at 1280 and 390 px in light and dark: `/guide/installation`, `/guide/syntax-tutorial`, `/guide/responsive-design`, `/reference/tokens/spacing`, `/design-system` and its review pages, `/benchmarks`, `/blog` and a post, `/brand`, `/404` and `/`. The browser checks for reading, navigation, demos, reviews, states, the homepage header, brand, search, illustrations and anchors pass. Known exceptions: `migration/css` previews at 320 px with 200% text (the reading column keeps its gutters on phones by design) and the documentation-geometry baseline, whose fixture is missing.
