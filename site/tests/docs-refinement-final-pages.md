# Final documentation pages

Continuation of [the project and language review](./docs-refinement-project-language.md).
The route inventory in `docs-refinement.json` remains authoritative.

## React Router installation

Both React Router pages are reviewed, bringing this pass to **350/359**.
DocumentSteps, compact mode links and literal configured heading previews replace
the old step rail and mismatched heading. Complete Vite/root/route examples retain
the framework document shell, Links, metadata, outlet, scripts and scroll
restoration. The current official template's Vite path-alias option is retained.
Runtime imports `virtual:master-css-runtime` once in the root route and includes
the TypeScript declaration: framework-rendered HTML bypasses Vite index.html
injection, so the installer's CSS import alone is insufficient. Static mode has
no bootstrap. All four original section anchors on each page remain available.

Original and revised complete desktop/light and mobile/WebKit/dark documents were
read. Final config regions were reread after retaining `resolve.tsconfigPaths`.
Final browser checks pass **24/24** across 390/768/1280px and both themes, including
keyboard mode navigation, native code visibility, actual SSR/hydration, initial
styles without JavaScript and runtime DOM class changes. Evidence:
`installation-router` and `installation-router-final`.

The local machine has React Router 7.18.3 but not @react-router/dev. The explicit
fixture adapter provides build entrypoints and the route/asset manifest, then
runs the real public createRequestHandler, ServerRouter and HydratedRouter APIs.
It retains authored components and actual Vite CSS/runtime output; it does not
substitute hand-built HTML. Full framework CLI loading and host deployment are
outside this validation. The official installation and current default-template
sources were checked for creation commands, route registration, Vite options and
production scripts; the public guide does not promise a tested framework version.

Docs **31/31**, Reference **20/20**, LLMs **29/29**, prepare, actual LLM generation,
types and scoped lint pass. The latest full site lint completed in the Nuxt pass
with **zero errors and 11 warnings** outside this batch. AI context is checked
again after the new fixture and report structure.

Remaining: **two TanStack Start installation pages and seven other documents**,
then the final production build and CSS contract review. TanStack Start 1.168.50,
@tanstack/react-router 1.170.33 and Vite 8.2.2 are installed. Its real integration-lab build
fixture is available, but that fixture's SSR helper silently skips when a bare
fetch entry does not start an HTTP server; the next pass must actually serve and
exercise the built entry. The original source and current official getting-started,
build-from-scratch and hosting pages have been read. Production startup depends on
the selected host adapter; avoid inventing a universal start command. The CLI
accepts a project name after `create`, which resolves the current unnamed-create
then `cd my-app` mismatch. TanStack baseline panels are prepared for review.

## TanStack Start installation

Both pages are reviewed, bringing this pass to **352/359**. The shared six-step
layout, compact Runtime/Static mode navigation and exact heading preview now match
the other integrations. Four legacy anchors per page remain stable. Creation names
the project before changing directories. Complete Vite, CSS, root and route files
retain TanStack/React plugin order, native Vite aliases, document metadata,
HeadContent, Outlet and Scripts. Manual setup and provider-specific production
startup are explicit; static CSS delivery is distinct from framework SSR.

Real TanStack Start 1.168.50, @tanstack/react-router 1.170.33 and Vite 8.2.2 compile
the authored files unchanged. A local HTTP adapter serves the generated server
fetch entry and client assets. An initial eager virtual-runtime import built but
failed SSR with a missing server manifest asset. The documented dynamic import
inside `!import.meta.env.SSR` removes that browser dependency from the server and
passes real startup, SSR, hydration and DOM observation. The TypeScript declaration
includes Vite environment types. No core or integration package was changed.
Provider deployment plugins and installer CLI scaffolding are outside this test.

Final browser matrix **24/24** passes: 390/768/1280px, both themes, JS-enabled and
JS-disabled app delivery, dynamic classes, native keyboard mode navigation,
anchors, code visibility and overflow. All **14** complete desktop/light and
mobile/WebKit/dark reading panels were inspected. The final TypeScript prose
correction passes another **6/6** page checks and affected panels were reread.
Evidence: `installation-tanstack` and `installation-tanstack-close`.

Docs initially passed **32/32**. The final run passed **31/32**, with the unrelated
Express fixture losing its reserved ephemeral port (EADDRINUSE); isolated server,
TanStack and changed-source checks then passed **4/4**. Reference **20/20**, LLMs
**29/29**, prepare, actual LLM generation, types and scoped lint pass. AI context
passes for **2860 files**, with four generated exclusions and one bounded
exception. The latest whole-site lint remains zero errors and 11 warnings from
the completed Nuxt pass. No CSS contract baseline has been updated.

Seven documents remain: Brand, Design System, Guide index, Introduction, Syntax
tutorial, Benchmarks and Reference index. Their baseline capture is separate from
review; do not mark them reviewed just because screenshots exist. Then run the
final production build, browser audit and CSS contract review.

Final TypeScript wording: scoped installation portable-output check **1/1**,
actual LLM generation, types and scoped lint pass. Seven-page baseline capture
completed at 1280/light and 390/WebKit/dark with no page errors or document
horizontal overflow; those 14 screenshots have **not yet been visually reviewed**.
Their anchors are saved with the evidence in `refinement-final-pages-baseline`.

## Brand and documentation indexes

Brand, Guide index and Reference index are reviewed: **355/359**. Shared
DemoAsset now owns proportional SVG previews, fixed light/dark or transparent
surfaces and native downloads. The three source files and every trademark
restriction are preserved. A strict literal adapter includes labels, asset URLs,
download links and policy in search/LLM exports. The Guide/Reference index retains
all 34/264 destinations, complete summaries, canonical group fragments and native
keyboard category/A–Z navigation. The Guide's six sections form a balanced grid;
its related Reference link spans the remaining row. The narrower gallery handles
an even card count without an empty cell. Both primitives have live Design System
examples, minimal usage and constraints.

Original and revised full desktop/light and mobile/WebKit/dark documents were
read, including the final restored policy line. Browser checks: **24/24** core
page tests, **24/24** downloads/localized indexes/gallery tests, and **12/12** final
gallery checks across 390/768/1280px and both themes. Original SVG download bytes,
native keyboard actions/focus, stable hashes after reload, complete SSR catalog
links and no console/page errors are asserted. Evidence: `final-pages`,
`final-pages-close`, `final-pages-galleries`. Final gallery panels were reread.

Playwright's default caret hiding mutated form styles before delayed hydration;
screenshots now use caret:initial. Two concurrent full-gallery SSR loads on the
Next dev server also delayed Wasm downloads beyond the existing three-second
startup guard. Serial execution passes without changing that guard or filtering
errors. This dev-server resource limitation still needs the final production
load audit. Development's internal HTML intentionally starts hidden without JS;
the no-JS check proves complete server HTML, not development visibility.

Docs **32/32**, Reference **20/20**, LLMs **30/30**, prepare, actual LLM generation,
types and scoped lint pass. AI context passes **2865 files** before the next
Introduction/Syntax batch. Whole-site lint and the production build/CSS contract
review remain in the final audit; no contract baseline was changed. Four pages
remain: Introduction, Syntax Tutorial, Benchmarks and Design System.

## Introduction and Syntax Tutorial

Both pages are reviewed: **357/359**. Introduction now leads with its purpose,
keeps the practical card and its labelled reduced markup, and pairs the first
panel with an exact literal preview. The card preserves its 16:9 crop, complete
text and native installation link. The Introduction export strictly includes
its local Overview, source and generated CSS; search and LLM output agree.

Syntax Tutorial keeps its six anchors and progressive button lesson. Five
labelled native-button previews now use shared DemoViewport; the old local client
controller is removed. Added conditional hover and final project-token previews
show their actual compiled rules. Complete final source remains available through
a native disclosure and in portable exports. Optional widthPresets on DemoViewport
sets meaningful actual iframe widths; Fit and the range remain available. The
label/range/Fit group stays together on mobile. Design System documents defaults,
constraints, a live preset example and its actual tutorial use.

All original and revised complete desktop/light and mobile/WebKit/dark panels
were read; final image crop and grouped control regions were reread after fixes.
Browser **12/12** initial page checks, **12/12** final tutorial/gallery checks,
**6/6** final card checks and **4/4** existing generic iframe checks pass. They
assert the real media-query boundary on either side and at sm, padding tokens,
conditional hover, native focus outline, keyboard presets/range/Fit, source
expansion, theme profiles, anchors and no console/page errors. Evidence:
`introduction-syntax`, `introduction-syntax-close`, `introduction-close` and
`viewport-controls-close`.

The full docs run passed **31/32** and caught an invalid aspect:video spelling
introduced in the card. Corrected it to the preset's canonical video shortcut;
the affected full-source class validation now passes **1/1**, and actual image
ratio passes all six profiles. The other 31 tests passed, including all framework
build fixtures. Reference **20/20**, LLMs **31/31**, final affected portable checks
**2/2**, prepare, actual LLM generation, types and scoped lint pass. AI context
passes **2868 files** (four generated exclusions, one bounded exception).

Remaining: Benchmarks and the complete Design System page review, then production
build, final browser/load audit and CSS contract review. No contract baseline was
updated and no public package or internal submodule was changed.

Final card-source cleanup replaces partial margin overrides with explicit axes
and canonical ordering. Scoped lint is clean, prepare and source-class validation
pass, and the affected portable/export generation is rerun. All six viewport-preset
gallery screenshots were visually inspected. The whole-site lint process is still
running at handoff (`/tmp/master-entry-tutorial-site-lint.log`); do not infer success
from the earlier scoped checks.

## Benchmarks — 358/359

The complete original and revised desktop/light and mobile/WebKit/dark page was
read. Final changed regions and all six chart-gallery profiles were inspected.
The page now uses static, proportional, labeled site-owned charts, exact zero
fills, consistent series colors, responsive metric summaries, dated source links,
and native disclosures for complete data and reproduction commands. Values and
committed benchmark snapshots are unchanged. Removed ambiguous “x smaller/faster”
labels; the measured values, units, scales and full tables carry the comparison.
Historical page-size evidence is explicitly dated and separated from equivalent
fixture measurements. All existing heading IDs remain available.

New shared components: BenchmarkChartGroup, BenchmarkDataTable and BenchmarkSource.
BenchmarkMetrics replaces the site-private BenchmarkMetricTable name and renders
an appropriate responsive definition list. All imports and MDX registration are
migrated; no compatibility alias remains. Sample summaries use their own container
width. The gallery documents units, composition scales, zero values, scrolling,
server rendering and minimal usage, and links back to the real benchmark page.

Mobile WebKit does not consistently scroll a focused overflow region with arrow
keys. BenchmarkScrollRegion is an isolated client boundary that supports horizontal
and vertical arrows, leaves child controls and modified keys alone, and uses an
accessible description. Native disclosure and the server-rendered table remain
intact. Its local lint exception covers the intentional keyboard-accessible scroll
region, not a false button/application role. Charts have no animation; keyboard
scrolling is instant. The existing global lint policy is unchanged.

utils/benchmark-content.ts exports the same snapshot-backed chart props and complete
tables through an explicit static component registry. It does not execute MDX or
client components, and rejects unknown presentation components. Portable Markdown,
search and generated LLM output retain values, row labels, dates, sources and limits.
The export tests cover every registered chart, every documentation-site value,
all source dates, inline label text, and both locale search records.

Validation: final browser matrix **12/12**, final static-label follow-up **6/6**,
docs **32/32**, Reference **20/20**, LLMs **32/32**, final affected export **1/1**
and full-source class validation **1/1**. Prepare, actual LLM generation, types,
scoped lint and whitespace checks pass. Whole-site lint completed with **0 errors,
11 pre-existing warnings** outside this batch. AI context passes **2876 files**
(four generated exclusions and one bounded exception). Earlier introduced MDX
registration, import-name and lint failures were fixed; the initial keyboard
failures led to the explicit WebKit keyboard implementation.

Evidence directories: benchmarks (full revised reading view), benchmarks-complete,
benchmarks-final (final six-profile gallery), benchmarks-labels (final page and
source controls). Logs: /tmp/master-benchmarks-final-browser.log,
/tmp/master-benchmarks-labels-browser.log, /tmp/master-benchmarks-docs.log,
/tmp/master-benchmarks-reference.log, /tmp/master-benchmarks-final-llms.log,
/tmp/master-benchmarks-labels-export.log, /tmp/master-benchmarks-classes-final.log,
/tmp/master-entry-tutorial-site-lint.log and /tmp/master-benchmarks-final-ai.log.

Remaining: **the complete Design System page review**, followed by the final
production build, cold/concurrent browser/load audit, CSS contract review and
full goal completion audit. No CSS baseline has been updated. Design System's
first 155 source lines and full heading inventory were read for preparation;
its full baseline screenshots remain unread. Its section index omits Platform
behavior and differs from the order of the appended tooling/agent/package sections;
review that organization together with the long-page rendering cost. Existing
per-gallery coverage does not replace the complete page review.

## Design System catalog and authoring review

The complete original and revised desktop and mobile document has been read,
including every shared gallery's source. DemoIndex supplies a four-part section
map in actual reading order; the missing Platform behavior destination is restored.
All pre-existing heading IDs remain available. Foundations use intrinsic specimen
columns. DemoCatalog groups all 87 actual Reference recipes into nine native
keyboard-operable disclosures with source links. No teaching source or preview is
removed. The initial page stays compact while offscreen frames load lazily.

DocumentOptionList and DocumentOptionEntry reuse the existing definition-list
presentation for authored MDX. The 18 component interface entries now keep names,
props and layout constraints readable at narrow widths. The existing data-driven
DocumentOptions renders the same native structure. Strict literal Markdown adapters
preserve the categorized links and complete authored descriptions and reject
executable props. DemoBadge replaces the remaining unstyled legacy badge classes;
its sizes, paint variants, default state and explicit padding are documented beside
live specimens. It is a static span, separate from measured lesson geometry.

The catalog/gallery browser matrix passes **12/12** across 390/768/1280px and both
themes. Every profile opens and closes all 87 recipes with the keyboard, checks actual
iframe readiness, links, stable anchors, focus and document overflow. All 40 visible
iframe previews load. Complete desktop/dark and mobile/dark reading panels, every
recipe in desktop/dark and mobile/dark, and component captures across all six
profiles have been inspected. Evidence: `design-system`, `design-system-final`.
Final production badge variants, loaded assets and all 18 interface entries are
verified and visually inspected. The route ledger now records all 359 routes reviewed.
Fresh retained evidence and the historical artifact cleanup are documented in
`docs-refinement-final-audit.md`.

An early desktop development capture used stale disclosure styles; subsequent fresh
loads render correctly. The browser regression now checks the title column's actual
width in all 87 summaries. Full-page screenshots do not reliably trigger offscreen
lazy images; the gallery check explicitly loads every visible authored image first.
Neither issue is hidden by screenshot styling or error filtering. Screenshots retain
the caret to avoid mutating native input styles during delayed hydration.

Before the final badge: docs **32/32**, Reference **20/20**, LLMs **32/32**, all **711**
scene compilation/coverage checks, prepare and types pass. The badge's full-source
class validation and type check pass. The final production build, 18-profile-check
load audit, 40 behavior checks and 792-page-profile sweep pass. Full lint has zero
errors and nine warnings. CSS review and complete results are recorded in
`docs-refinement-final-audit.md`.
