# Second additional illustration batch — 2026-11-03

## Delivered scope

20 further figures, distinct from the preceding 20-figure expansion. This batch adds 40 PNGs (light/dark pairs), 20 editable scenes and independent HTML/search/Markdown explanations across seven Guide and five Reference articles. Each scene is 720 × 480, exported at 1440 × 960. A theme pair counts as one figure. No existing figure or working demo was replaced.

The priority order below reflects prerequisite reach, potential misunderstanding and the explanatory value of geometry. It is an editorial judgment, not a traffic ranking. Integration articles remain code-first; organization Blog content remains in its owning Master repository.

| Rank | Figure | Article | What the composition makes visible |
| --- | --- | --- | --- |
| 1 | `border-ingredients` | `/guide/colors` | Three equal border boxes add color, width and style; only the last paints a border |
| 2 | `span-includes-gaps` | `/guide/layout-system` | A two-track item includes the actual 16px internal gutter, making its width 208px |
| 3 | `logical-inline-axis` | `/guide/layout-system` | Equal square content boxes acquire horizontal or vertical padding bands with writing mode |
| 4 | `has-owner-target` | `/reference/rules/selectors` | The checked child and the styled parent border are different, precisely identified targets |
| 5 | `manual-wrapper-reach` | `/guide/colors` | A real light region stays inside a dark ancestor; the manual selector crosses that boundary |
| 6 | `font-loading-boundary` | `/guide/typography` | One family request branches to visibly different faces according to availability |
| 7 | `reading-measure` | `/guide/typography` | Identical complete text grows to different heights when only its width changes |
| 8 | `pill-aspect` | `/guide/colors` | Equal-height circle and capsule share the same radius utility |
| 9 | `where-specificity` | `/reference/rules/selectors` | Aligned owner, suffix and total columns isolate the specificity contribution |
| 10 | `pseudo-element-origin` | `/reference/rules/selectors` | Real generated quotes bracket one span's text node without adding child elements |
| 11 | `attribute-word-match` | `/reference/rules/selectors` | A three-row matrix distinguishes exact values, whitespace words and hyphenated text |
| 12 | `contents-default-vs-empty` | `/reference/directives/definitions` | Omitted, explicitly empty and supplied blocks map to three distinct insertion results |
| 13 | `preserve-wins` | `/reference/directives/pruning` | Reversed directive orders converge on the same retained rule |
| 14 | `source-relative-base` | `/guide/monorepo` | A file tree connects the declaring stylesheet to its own relative source directory |
| 15 | `preload-is-data` | `/guide/rendering-modes` | Fetched program data and runtime initialization have separate roles; DOM usage enters initialization |
| 16 | `reference-no-roots` | `/reference/directives/imports` | The same reference produces different resource output only when local usage changes |
| 17 | `parameter-known-vs-live` | `/reference/directives/definitions` | Known recipe arguments, rejected live arguments and native variable references have separate outcomes |
| 18 | `compiled-query-snapshot` | `/reference/rules/conditions` | A concrete complement keeps its 64rem identity after only the minimum definition moves |
| 19 | `pruning-global-selectors` | `/guide/scanning-and-pruning` | Classless rules and used class rules remain while an unused class rule is removed |
| 20 | `lint-overlap-context` | `/guide/code-linting` | Declarations share or occupy separate diagnostic scope boundaries, without implying disjoint media ranges |

## Sources and visual review

- Scene source: `site/assets/images/reference-studies/source/<id>.ts`; outputs: `site/assets/images/reference-studies/<id>-{light,dark}.png`. Additional CSS uses narrowly named `detail-*` classes in the existing local `illustration.css`.
- Captions and descriptions: `site/reference/detail-illustrations.ts`, composed into the existing study/Reference registry. `ReferenceIllustration.astro` imports each asset explicitly. No new runtime, dependency, package configuration or semantic API was introduced.
- Compositions reuse the site's tokens, Geist, IBM Plex Mono and established illustration scale. The [MDN logical-axis illustrations](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Logical_properties_and_values/Basic_concepts) informed the controlled writing-mode comparison; the [font-family reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-family) supports the distinction between preference, availability and glyph coverage.
- All 40 output variants were reviewed in paired sheets at logical article scale; substantive revisions were reviewed again. The series deliberately mixes actual CSS specimens, nested regions, file trees, exact extent rulers, evidence matrices and data/operation flows.
- Refinements moved leaders to the checkbox, owner border and real file positions; put annotation paths above opaque specimens; painted actual nested light/dark regions; separated source and result connectors from code; retained valid media-definition syntax and qualified the omitted theme-layer wrapper in the reference-output excerpt.
- These are authored technical explanations, not observed reader-comprehension research. Color reinforces visible boundaries, changed dimensions and direct labels rather than being the sole distinction.

## Validation

- All 20 sources rendered successfully in both themes using the skill renderer, including font availability, label bounds and 1440 × 960 output checks.
- Executable compiler checks confirm: compiled query complements do not re-expand; omitted/empty/supplied contents differ; the illustrated two-declaration recipe rejects browser-dependent arguments; referenced native rules do not retain tokens; preservation wins in both directive orders; and classless selectors survive native pruning.
- Browser assertions verify eight working specimens in both themes: 144 × 96 border boxes, 64 × 64 and 192 × 64 pill geometry, 96/96/96 tracks and a 208px span, 128 × 96 versus 96 × 128 logical padding boxes, actual parent-border changes when the input is toggled, a light local scheme with matching ancestor wrapper and 0.85 opacity, pseudo-element content with zero child elements, and equal paragraph text with different intrinsic heights.
- All 12 articles passed at 390, 768 and 1440px in both themes: 72 page profiles and 120 new-figure checks. Assertions cover the single active theme image, decoded image, proportional 3:2 size, full media width, viewport bounds and keyboard disclosure containing every description paragraph. The site preference was deliberately opposite the OS setting.
- 24 additional profiles passed at 390px with 200% root text, one representative figure per article and theme. Descriptions remain within their container and keyboard operable. A no-JavaScript disclosure check also passes. Desktop captures cover every new figure; mobile and enlarged-text captures supplement the paired asset review.
- Final changed figures/placements were rechecked across the same widths and themes. Two Colors requests returned transient development-server 500 responses during concurrent package/build activity; both 768px theme profiles passed unchanged on retry. No persistent failure was found.
- Site lint and full type-check pass. Astro reports 18 existing unused-symbol hints, zero errors and zero warnings; Svelte and TypeScript checks pass.
- Reference tests: 27 pass. Documentation examples: 28 pass. MDX imports: 2 pass. The new export regression checks every new caption and description in portable articles and both search indexes.
- LLM/search suite: 35 pass, one unrelated failure. `introduction retains its panel, class mapping and shared token in portable and search output` still expects `Project panel` at `site/scripts/generate-llms-txt.test.ts:631`; the independently modified Introduction no longer contains it. Those Introduction changes and their expectation were left untouched.
- `prepare-app`, the full root `build:site` (153 pages), public-asset verification, `git diff --check` and `check:ai-context` pass. Package warming also reports an unrelated existing Rust unused-variable warning.

## Limits

Phone layouts scale the same composition, so bitmap labels become small; the complete HTML explanation remains readable independently. Browser verification used Chromium rather than a cross-browser matrix. English explanations follow the existing fallback for both site locales. This batch changes documentation and artwork only; it was not committed or deployed.
