# Pre-render delivery for the site

The shared Astro integration in `@master/internal-site` now configures
`masterCSS({ mode: 'pre-render' })` instead of `'progressive'`. Every route was
already prerendered by Astro; this change stops shipping the Master CSS browser
runtime, the hydration manifests and the lazy engine/program. Each page keeps the
rules generated from its own server HTML in `style#master-css`.

The Master repository owns the mode switch (`packages/internal-site/src/astro/index.ts`)
and the shared article-transition example. This repository adapts two homepage
islands, the style-delivery budget and the authoring rule in `site/AI.md`. The
site consumes the change once a new `@master/internal-site` is published and
pinned in `site/package.json`; nothing was published or deployed.

## Method

Both builds use the same source: `@master/internal-site` packed from Master `HEAD`
(`137060e`), installed locally, so the only difference is the mode and the fixes
below. (The checkout's installed copy was a stale `0.1.3`; the lockfile pins
`0.2.4`.) `bun run build:astro` built 384 routes in about 40 s for each.

1. **Output metrics.** A script read every HTML file and the `_astro` graph:
   inline `style#master-css` bytes, hydration references and manifests, runtime
   chunks and their lazily imported engine/program, and the static JS import
   closure of sample pages.
2. **Per-page CSS equality.** For all 384 routes, `style#master-css` was
   compared byte for byte after removing the `data-master-css-hydration-manifest`
   attribute.
3. **CSS contract attribution.** `verify-css-contract.ts --update` produced a
   snapshot of each build in a scratch copy; the committed snapshot was restored.
   The committed snapshot already differs from the base build, because it was
   recorded with an older shared package, so it is not updated here.
4. **Finding dynamic utilities.** Playwright opened all 83 English and root
   locale pages of the *progressive* build, scrolled them and clicked up to 60
   buttons, tabs, summaries, checkboxes, radios and popup triggers, with
   cross-page navigation blocked. An init script wrapped
   `CSSStyleSheet#insertRule` and `CSSGroupingRule#insertRule`: in progressive
   mode every call is a rule the runtime had to generate because the class was not
   in the server HTML. A `MutationObserver` also recorded every class an element
   carried; at the end the classes without any matching selector in the page's
   style sheets were listed. The same crawl then ran on the pre-render build, and
   classes unstyled only there were reported.
   A source scan (scanner-valid classes in `.svelte`, `.ts` and `.astro` sources
   that appear in no rendered HTML) produced 291 names, almost all documentation
   strings, illustration data or shared demos this site does not render; it was
   only used to cross-check the browser results.

## Dynamic utilities found and how they are handled

The runtime generated rules for 10 classes on 2 routes. No other page needed it.

| Route | Classes | Cause | Change |
| --- | --- | --- | --- |
| `/examples/article-transitions` | `(aspect-ratio:16/9)` `p-lg` `text-2xl` `mt-md` `mt-lg` `outline-solid:focus-visible` `outline(2):focus-visible` `outline-text-link:focus-visible` `outline-offset-4xs:focus-visible` | The detail view was inside `{#if selected}`, so the server never rendered it. | Master `ArticleTransitionScene.svelte` always renders the one detail `<article>` with `hidden={!selected}`; it shows the selected article, else the first. The card list keeps its `{#if}`: its classes are in the initial HTML. Hidden elements take no part in view transitions, so the shared names cannot collide. |
| `/` and its four locale editions (seen on `/cn`) | `invisible` | Two islands appended `invisible` from state: a gallery frame while its artwork is open in the modal (`ArtGalleryPreview.svelte`) and inner axis ticks of a narrow chart (`BenchmarkSizeChart.svelte`). Whether the narrow state occurs depends on measured width, which is why only one locale hit it during the crawl. | The complete classes `invisible[data-lifted]` and `invisible[data-crowded]` stay in the markup; the islands toggle `data-lifted` / `data-crowded`. The rules are now pre-rendered on every homepage edition. |

The rule is recorded in `site/AI.md`: keep complete class names in the server
HTML, select states with attributes, render class-bearing alternate views with
`hidden`, pass unbounded values through CSS variables, and never build class
names from state. `@safelist` is not a substitute: pre-render generates CSS
from page HTML only.

After the changes the pre-render crawl recorded 0 `insertRule` calls, 0 page
errors and one class unstyled only in the pre-render run, `tabler-icon-bulb`: a
Tabler icon name with no CSS rule in either build, which the progressive crawl
did not happen to observe.

## Before and after

| css.master.co build | Progressive (before) | Pre-render (after) | Change |
| --- | ---: | ---: | ---: |
| Routes | 384 | 384 | 0 |
| Routes whose `style#master-css` changed | — | 6 | the 5 homepages and article transitions |
| Inline Master CSS, all routes | 473,313 B (205,680 gzip) | 474,801 B (206,076 gzip) | +1,488 B (+396 gzip) |
| HTML `style#master-css` with a hydration reference | 384 | 0 | −384 |
| Hydration manifest files | 80 (257,503 B) | 0 | −257,503 B |
| Runtime chunk on every page (`page.*.js`) | 38,009 B | 0 | −38,009 B per page |
| Lazy engine chunk + program | 80,594 B + 81,988 B `.bin` | 0 | removed |
| All `_astro` JavaScript | 613,586 B | 494,114 B | −119,472 B |
| Linked CSS assets | 494,406 B | 494,406 B | 0 |
| Static JS on `/` | 374,198 B / 46 files | 335,623 B / 44 files | −38,575 B |
| Static JS on `/guide/installation` | 178,367 B / 26 files | 141,429 B / 24 files | −36,938 B |
| Static JS on `/reference/tokens/color` | 171,253 B / 29 files | 132,615 B / 27 files | −38,638 B |

The CSS contract of the two builds has the same project manifest, the same 2,263
CSS segments and the same CSS for all 384 routes before the island fixes; the
only difference is that 80 distinct contracts collapse to 52 because they no
longer carry hydration class lists (45,661 class names across routes). With the
fixes, only the six routes above differ.

Remaining `data-master-css-hydration-manifest` text in the output is guide and
`llms*.txt` prose about progressive rendering.

## Budgets

`tests/style-delivery.budget.json` raises exact ceilings only where pre-rendered
rules replaced runtime-generated ones:

- `/`: `inlineBytes` 13,416 → 13,532 (the two `invisible[...]` rules).
- `/examples/article-transitions`: `inlineBytes` 3,470 → 4,378, `gzip`
  15,387 → 15,574, `brotli` 13,106 → 13,273 (the detail view's rules).

The base build passed this audit; the after build passes with these ceilings.

## Validation

- `bun run build:astro` and `bun run postbuild:static`: pass (85 public assets,
  384 routes, 45 CSS assets).
- `check:astro`: 0 errors in 554 files. ESLint on the changed islands: clean after
  `--fix` sorted the classes.
- Against the static pre-render output: `view-transitions.e2e.mjs` 17/17,
  `benchmark-chart.e2e.mjs` 7/7, `design-system-figures.e2e.mjs` 20/20,
  `interior-states.e2e.mjs` 6/6.
- `home-header.e2e.mjs` (7 failures) and `hero-section.e2e.mjs` (7 failures) fail
  identically against the progressive base build served the same way; they are
  not caused by this change.

## Limitations

- The crawl exercises visible buttons and scrolling, not every keyboard path,
  hover-only script or search query. Classes that appear only through those
  paths would still be missing; the authoring rule above is the guard.
- The committed CSS contract snapshot is not updated; refresh it together with the
  published shared package.
- Release steps remain: publish the new `@master/internal-site`, pin it here and
  rebuild. Nothing was deployed.
