# Documentation refinement review

This second review covers all 359 current documentation routes: utility and formal
Reference, Guide and installation pages, the Reference overview, Brand, and the
Design System. `docs-refinement.json` tracks each route independently. Generated
Reference pages are reviewed through their authoritative source and rendered
document; their package API or preset semantics are outside this editorial scope.

## Final status

All **359/359 routes** are reviewed. See [the final production audit](./docs-refinement-final-audit.md)
for delivered scope, checks, CSS review and explicitly retained limitations. The
sections below retain historical batch counts and findings.

## Completion evidence

- `prose: reviewed` requires reading the complete authored or generated document,
  checking its examples against the explanation, and verifying new behavior claims.
  A corpus-wide search or a passing export test does not count as an editorial review.
- `visual: reviewed` requires examining that page's rendered composition at narrow
  and wide widths, checking its actual demo content and controls, and recording any
  fixes. A shared CSS change does not automatically complete every page's review.
- `pending` and `in-progress` remain incomplete. Notes identify findings and the
  evidence used to resolve them. Existing stable URLs and section IDs are preserved.

## Shared work

Repeated visual fixes belong in the site-owned design system. Keep content-driven
canvas sizing separate from bounded viewports used to teach scrolling, positioning
or viewport units. Do not change the measured property merely to make a specimen
fit its surrounding frame.

Changes are validated in scoped batches. The final review also requires the full
site build, docs/export checks, browser matrix and a reviewed CSS contract update.

## Earlier batch evidence

[Layout and typography refinement evidence](./docs-refinement-layout-typography.md)
records the completed flow, positioning, scrolling, flex/grid, sizing and text-flow batches.
The route inventory remains the source of completion status.

## Text decoration and glyph paint review

All eleven text-decoration and glyph-paint documents and their 43 scenes are reviewed.
The inventory now contains **103 reviewed documents out of 359**. Stable section IDs
are preserved. Authored HTML retains actual parent/child contexts and every required
underline, fill, gradient or stroke declaration. Plain specimens add no paint to the
subject, while native controls keep a separate visible focus indicator.

The prose distinguishes shorthand resets from independent longhands, propagated
ancestor decoration from inheritance, and painted bounds from layout dimensions.
The transparent-fill example has a real supports-gated screen gradient and solid
print fallback. Font-provided thickness is described as a requested keyword rather
than a measured pixel result. Display examples use compact, consistent typography;
HTML classes wrap between complete utilities so the instructional declaration can
be read in context.

Three reusable recipes cover decoration at its origin, independently inherited glyph
fill and paint versus layout geometry. There are now **40 Design System recipes**,
with authoring guidance for plain surfaces and complete paint prerequisites.

Evidence:

- `site/test-results/refinement-text-effects-close`: **132/132 passed**, covering
  all eleven documents and 43 scenes at 390/768/1280px in light and dark themes.
  Chromium covers desktop/tablet and WebKit covers mobile. Full desktop documents,
  all scene compositions and narrow introductions were visually inspected; final
  full documents were inspected again after code formatting.
- `refinement-text-effects-detail`: all 43 mobile scenes in both themes captured
  with additional vertical room for unobstructed visual review.
- `refinement-text-effects-gallery`: **6/6 passed**, all 40 recipes. The three new
  recipes were inspected at each width in both themes.
- `refinement-text-effects-type-regression`: **72/72 passed**;
  `refinement-text-effects-flow-regression`: **18/18 passed** after the shared plain
  specimen option. Actual hover/focus, print, responsive geometry, generated CSS,
  accessible names and focus rings remain covered.

Initial runs exposed one test-only color serialization assumption: the preset white
is reported as OKLCH, not RGB. All six corrected cases passed, followed by the full
132-check final matrix. No application behavior was altered to satisfy the assertion.

All 711 scenes compile. TypeScript, prepare-app, Reference (13 tests), documentation
examples (6 tests), llms exports (13 tests) and source budgets pass. Full site lint
passed with zero errors and 90 warnings; all 47 warnings in this batch were then
resolved and final scoped lint is clean. The remaining 43 warnings are outside this
batch. The production build and CSS contract review remain pending until the complete
359-document review finishes. No public package semantics or release settings changed.

## Lists, counters and generated content review

All eight list and generated-content documents and their 29 scenes are reviewed.
The inventory now contains **111 reviewed documents out of 359**. Existing heading IDs
are preserved. The typography recipe renders the complete authored article, list,
headings, items and descendant selectors. It no longer invents counter names, reset
values, marker geometry or generic link content.

Counter examples show actual 1/2/3, 10/9/8, 1/9/10 and conditional sequences. The
prose distinguishes reset, increment and set, including counter creation by set.
Native list attributes agree with meaningful ordinal jumps and countdowns. The
reversed() specimen exposes the actual supports branch and explains its authored
three-item fallback. Both local engines currently take that fallback; automatic
reversed initialization is not claimed as verified in a supporting engine.

List examples supply real items, explicit dimensions and padding, a loadable SVG
marker and a valid gradient. They distinguish shorthand resets from independent
longhands, marker image precedence and inside/outside wrapping. Link meaning remains
in HTML, while genuine pseudo-elements add supplementary content. The shared semantic
text color preserves at least 4.5:1 contrast in the tested light and dark surfaces.

Three new Design System recipes cover running counter values, hanging markers and
supplementary link indicators. There are now **43 recipes**. The authoring guide
explains native scope, semantic lists, actual pseudo-element readings and support
branches. Obsolete counter decoration styles were removed; the separate display
list-item specimen retains its existing marker space.

Evidence:

- `site/test-results/refinement-list-content-first`: **32/32 passed**, desktop light
  and mobile dark before final contrast polish.
- `refinement-list-content-final`: **94/96 passed**, all eight documents at
  390/768/1280px in both themes. The two failures waited for the shared sr-only legend
  style on the counter-increment page; native counter assertions had passed up to
  that readiness check. `refinement-list-content-increment-close` reran the exact
  test unchanged across all six projects: **6/6 passed**. This intermittent development
  stylesheet readiness condition is recorded, not hidden by weakening the assertion.
- Chromium layout snapshots verify resolved counter glyph runs. Both Chromium and
  WebKit verify actual prefix geometry, counter declarations, marker line alignment,
  native viewport conditions and accessible link names. Chromium verifies print CSS;
  the shared print-preview control remains available in both engines.
- Every scene and full desktop document was inspected. `refinement-list-content-detail`
  contains all 29 mobile scenes and eight narrow introductions in both themes. Final
  introductions wait for iframe theme readiness and settled page scroll position.
- `refinement-list-content-gallery`: **6/6 passed**, all 43 recipes. The three new
  recipes were visually inspected at 390/768/1280px in light and dark.
- `refinement-list-content-display-regression`: **8/8 passed**, native inline-grid
  behavior and complete display page compositions after preserving its marker space.

All 711 scenes compile; the final 29 were recompiled after polish. TypeScript,
prepare-app, Reference (13 tests), documentation examples (6 tests) and llms exports
(13 tests) pass. Full site lint has zero errors and 43 warnings outside this batch;
final scoped lint is clean. The production build and CSS contract review remain
pending until the whole 359-document review finishes. No core, public API, dependency
or release behavior changed.

## Color and background review

All eleven color/background documents and their 34 scenes are reviewed. The inventory
now contains **122 reviewed documents out of 359**. Every existing heading ID remains
stable. The shared plain specimen preserves complete authored geometry, image layers,
scroll contexts and theme declarations; obsolete forced background defaults were removed.

The examples distinguish shorthand resets from independent color changes, foreground
alpha from element opacity, positioning origins from clipping boundaries, and computed
percentages from used offsets. A local 320 × 200 SVG supplies verifiable source geometry.
Native pixel checks cover image tiling, blending, clipping and attachment. The text-clipped
gradient retains a solid print fallback. Opaque labels remain readable in both themes.

Four reusable recipes cover positioning origins, focused background changes, image fit
and native attachment. There are now **47 Design System recipes**. Their authoring guide
requires complete paint prerequisites and actual scroll geometry. Duplicated legacy color
demos were removed while the data-driven syntax tables remain.

Evidence:

- `site/test-results/refinement-background-final`: **132/132 passed**, all eleven
  documents at 390/768/1280px in light and dark themes. Chromium covers desktop/tablet;
  WebKit covers mobile. Geometry, accessible names, native focus, viewport conditions,
  print CSS, pixels, loading, hydration and document overflow are checked.
- `refinement-background-color-close`: **12/12 passed** after the final theme/media
  class-order correction. The documentation validator identified an invalid default
  media ordering; the authored class now uses `@screen@dark` and generates valid CSS.
- Attachment checks verify native inner-panel scrolling in both engines and viewport
  painting in Chromium. WebKit uses native scroll APIs because this automation engine
  does not scroll that focused panel through ArrowDown; Chromium covers the actual key.
  Mobile fixed-background platform limitations are explained in the public prose.
- Full desktop documents and every desktop/tablet scene were visually inspected.
  `refinement-background-detail` adds all 34 mobile scenes and eleven introductions in
  both themes. `refinement-background-clean` captures tall comparisons without sticky
  header overlap and the four new recipes at all three widths in both themes.
- `refinement-background-gallery`: **6/6 passed**, all 47 recipes. The four new recipes
  also received the separate visual review above.

Initial failures exposed a duplicate attachment class, print/theme specificity, an
incorrect CSSOM serialization expectation, a border-antialias pixel sample and the
WebKit key limitation. These were corrected, with native behavior retained. All 711
scenes compile; the final 34 were recompiled after the media-order correction. TypeScript,
prepare-app, Reference (13 tests), documentation examples (6 tests) and llms exports
(13 tests) pass. Full site lint has zero errors and 43 warnings. The one class-order warning in
this batch was then fixed; final scoped lint is clean and the remaining 42 warnings
are outside this batch. The production build and CSS contract review remain pending
until the whole 359-document review finishes. No core, public API, dependency or release
behavior changed.

## Border, radius, outline and shadow review

All eleven edge documents and their 43 scenes are reviewed, including the three
border-radius MDX includes. The inventory now contains **133 reviewed routes out of
359**. Stable teaching anchors remain unchanged. Complete authored HTML supplies
all geometry, border/outline prerequisites and custom theme context; the old forced
edge and elevation styles were removed from the generic factory.

Examples distinguish border-box layout from paint, full shorthand resets from focused
longhands, physical edges from writing-mode axes, radius from clipping, and raw shadow
colors from mode-specific tokens. Real controls preserve accessible names and native
focus. Four new Design System recipes cover logical edges, clipping, keyboard focus
and shadow layers, bringing the gallery to **51 recipes**. The shared authoring guidance
explains complete paint prerequisites and geometry that is independent of annotation.

The iframe document adapter now scopes fragment-only anchor URLs to `about:srcdoc`.
A native skip link previously resolved against the host document and navigated the
preview away. It now focuses the authored iframe destination through native navigation;
image/font URLs and the portable displayed HTML retain their original base behavior.

Evidence:

- `site/test-results/refinement-edges-final`: **131/132 passed**, all eleven documents
  at 390/768/1280px in both themes. The single failure was a hidden-legend readiness
  assertion after the development runtime reported a 3000ms startup timeout while
  several capture jobs ran concurrently. The unchanged outline-color behavior test
  passed **6/6** in `refinement-edges-runtime-recheck` with one worker. No assertion
  or runtime timeout was weakened.
- Tests verify native border geometry and resets, logical axes, currentColor, transparent
  paint, width keywords, positive/negative offsets, actual focus, native viewport and
  print conditions, accessible names, custom theme scope and shadow layers. Chromium
  also checks forced colors. Chromium and WebKit verify the native skip-link destination
  and sampled corner pixels for actual child clipping.
- Every scene was inspected on desktop/tablet and mobile in both themes. Complete
  final desktop documents live in `refinement-edges-documents`; all 43 mobile scenes
  and eleven introductions are in `refinement-edges-detail`. `refinement-edges-clean`
  adds tall comparisons without sticky-header overlap and four new recipes at all
  three widths in both themes.
- `refinement-edges-gallery`: **6/6 passed**, all 51 recipes. Initial failures identified
  unsupported outline aliases in syntax rows, inherited srcdoc fragment resolution,
  and a fractional screenshot edge that required sampling inside the image. Those
  corrections retain the actual native behavior.

All 711 scenes compile; the final 43 were recompiled after code formatting. TypeScript,
prepare-app, Reference (13 tests), docs examples (6 tests) and llms exports (13 tests)
pass. Full site lint reports zero errors and 42 warnings outside this batch; final
scoped lint is clean. Full production build and CSS contract review remain pending
until the whole 359-document review finishes. No core, public API, dependency or
release behavior changed.

## Table borders, image borders and inline fragments

Eight documents and all 26 anchored scenes are reviewed. The inventory now contains
**141 reviewed routes out of 359**. Complete authored HTML supplies table cells,
paint prerequisites, image source geometry and native inline fragments. A stable
96 × 96 SVG source exposes corners, directional edge tiles and center paint without
changing the public preset or utility behavior.

Examples separate source slices from painted width, multiplier values from CSS lengths,
layout geometry from outward paint, and horizontal/vertical repeat order from box-side
pairs. Real tables retain their caption and row headers. Inline slice/clone examples
use one element with genuine wrapping, including a keyboard-accessible link. The old
orange fragment preview and hidden generic paint scaffolding were removed.

Four new Design System recipes cover table seams, source slices, patterned repeats
and inline fragments. The gallery now contains **55 recipes**. Shared authoring guidance
requires real source/fragment geometry and complete paint prerequisites. Ordinary HTML
lines were shortened after complete-document review; long single utility tokens remain
intact and scrollable.

Evidence:

- `site/test-results/refinement-border-paint-final`: **96/96 passed** across desktop,
  tablet and narrow WebKit, both themes. Native cell gaps, source equivalence, center
  fill, width/outset paint pixels, repeat patterns, glyph offsets, link name/destination,
  actual viewport changes and Chromium print conditions are verified.
- `refinement-border-paint-gallery`: **6/6 passed** with all 55 recipes. New recipes were
  visually checked at 390/768/1280px in both themes. `refinement-border-paint-clean`
  also preserves tall width/repeat comparisons without sticky-header overlap.
- All 26 scenes were visually inspected on desktop/tablet and in narrow WebKit, both
  themes. `refinement-border-paint-detail` includes all eight narrow introductions;
  `refinement-border-paint-documents` contains complete desktop pages. Final table/link
  code formatting was captured and inspected in `refinement-border-paint-polish`.
- The full 711-scene compilation, TypeScript, prepare-app, Reference (13 tests), docs
  examples (6 tests) and llms exports (13 tests) pass. All 26 scenes were recompiled
  after final code formatting. Full site lint has zero errors and 42 warnings outside
  this batch; final scoped lint is clean. AI context checks and diff whitespace pass.

Full production build and CSS contract review remain pending until the whole
359-document review finishes. No core, public API, dependency or release behavior changed.

## Image fitting, source positioning and SVG paint

Five documents and all 17 anchored scenes are reviewed. The inventory now contains
**146 reviewed routes out of 359**. The examples supply known natural image dimensions,
explicit image boxes, real SVG paths and native named controls. Complete visible HTML
owns the crop geometry and paint prerequisites; the shared specimen preserves them.

Round source features distinguish stretching from cropping. Position comparisons keep
the fitted size constant. SVG paint separates fill, stroke and width, including real
theme aliases and a path-level non-scaling stroke. Conditional icon controls use screen
queries so a focused or hovered state cannot override their print reset.

Four Design System entries cover image fitting, precise source position, theme fill
and native SVG width scaling. Authoring guidance preserves source sizes and paint
contexts. Final complete-document review shortened ordinary SVG attributes and classes
without splitting individual utility tokens.

Evidence:

- `refinement-media-final`: **60/60 passed** across desktop, tablet and narrow WebKit,
  both themes. Tests inspect real image crop pixels, known natural sizes, SVG fill,
  inherited paint, native accessible names, keyboard focus, actual viewport and print.
- SVG width verification integrates pixel coverage, counting antialiased edges by their
  alpha contribution. It verifies 4px, 8px and 6px transformed lines and a 1.5px
  non-scaling line, independently of the computed style serialization.
- `refinement-media-gallery`: **6/6 passed**. `refinement-media-clean` captures the new
  recipes at 390/768/1280px, both themes, and complete tall comparisons. All 17 scenes,
  five mobile introductions and five full desktop documents were visually inspected.
  Final SVG code formatting is captured in `refinement-media-polish`.
- TypeScript, prepare-app, Reference (13 tests), docs examples (6 tests), llms (13 tests)
  and all 711 scene compilations pass. Final 17-scene compilation and scoped lint are
  clean. Full site lint has zero errors and 39 warnings outside this batch. AI context
  checks and diff whitespace pass.

Full production build and CSS contract review remain pending until the whole
359-document review finishes. No core, public API, dependency or release behavior changed.

## Filters, clips, masks, blend groups and opacity

Six documents and all 21 anchored scenes are reviewed. The inventory now contains
**152 reviewed routes out of 359**. Complete authored HTML owns transparent SVG paint,
backdrop layers, exact clipping geometry, real scroll content, isolated blend groups
and native controls. The obsolete generic appearance factory and unused paint hooks
were removed. The shared plain specimen preserves the actual teaching geometry.

Five new Design System recipes cover alpha shadows, inset clipping, scroll masks,
isolated blending and opacity interaction. A duplicate image-fitting entry was removed;
the gallery now contains **63 unique recipes**. Authoring guidance covers paint context,
hit testing, unmasked focus indicators and native interaction. All original anchors
remain stable and explanations remain available in Markdown and search exports.

The masked region has an accessible name/description and native first/last links. Its
focus outline belongs to an unmasked wrapper. Bottom padding lets the last item move
above the fade. Opacity examples keep real disclosure and checkbox behavior. Final
contrast polish strengthens backdrop text and gives the background-alpha comparison
opaque black text; actual composited contrast is about 19.1:1 in light and 5.6:1 in dark.

Evidence:

- `refinement-effects-final`: **72/72 passed** across desktop, tablet and narrow WebKit,
  both themes. Tests verify paint pixels, transparent shadow bounds, clipping hit areas,
  mask paint, native scroll links, explicit multiply math, accessible names, keyboard
  operation, real viewport queries and Chromium print. `refinement-effects-polish`
  verifies all 36 affected cases after final contrast/token adjustments.
- `refinement-effects-gallery`: **6/6 passed**, all 63 recipes. New/current effects recipes
  were visually checked at 390/768/1280px in both themes. All 21 scenes, six mobile
  introductions and six complete desktop documents were visually inspected. Final
  HTML formatting and contrast screenshots supplement the original full-page captures.
- Platform limitation: this headless mobile WebKit does not paint backdrop filters,
  including in an independent minimal native HTML probe. The test records this limit
  and checks its computed declarations, geometry and fallback appearance; Chromium
  verifies actual filtering pixels. `refinement-effects-native` preserves the evidence.
  Native arrow-key scrolling is also unavailable in that mobile engine; the authored
  first/last links provide verified keyboard access in both engines.
- TypeScript, prepare-app, Reference (13 tests), docs examples (6 tests), llms (13 tests)
  and all 711 scene compilations pass. Full site lint has zero errors; its two batch
  formatting/token warnings were corrected and final scoped lint is clean, leaving
  39 warnings outside this batch. Final scoped compilation, AI context and whitespace
  checks pass. The Reference export assertion now follows the updated control wording
  while retaining the requirement to explain that opacity does not disable interaction.

Full production build and CSS contract review remain pending until the whole
359-document review finishes. No core, public API, dependency or release behavior changed.

## Native shapes, wrapping margins and alpha thresholds

Three documents and all 12 anchored scenes are reviewed. The inventory now contains
**155 reviewed routes out of 359**. Authored SVGs, images, floats and adjacent paragraphs
replace the generic shape fixture. Every comparison preserves its actual painted
geometry. The ordinary margin box, shape contour and source alpha are explained
separately, with stable anchors and complete portable HTML.

The shared plain shape specimen reads only relevant properties and keeps its labels
outside the flowing paragraph. Three new Design System recipes expose circle wrapping,
expanded contours and image alpha; the gallery now contains **66 unique recipes**.
The obsolete shape fixture and its hidden float/size/image rules were removed; the
existing float factory retains its behavior. Authoring guidance documents native
inline flow, explicit reference boxes and the margin-box limit.

The gradient threshold example intentionally lets text flow over pixels excluded from
the shape. Its blue paint follows the current theme to preserve contrast without
changing alpha or wrap geometry. Native pixel tests check at least 4.5:1 where text
first enters the painted fade. Actual DOM Range measurements verify each line’s
indentation, circle/inset geometry, increased margins and image-vs-basic-shape behavior.

Evidence:

- `refinement-shapes-final`: **36/36 passed** across desktop/tablet Chromium and narrow
  WebKit, both themes. Tests check unchanged float boxes, real text-line positions,
  accessible image names, loaded sources, native viewport/print queries, horizontal
  overflow and hydration errors. `refinement-shapes-polish` adds **12/12 passed** after
  the gradient readability adjustment, including composited contrast checks.
- `refinement-shapes-gallery-matrix`: **6/6 passed**. All 12 scenes and the three new
  recipes were visually inspected at 390/768/1280px in both themes. All three complete
  desktop documents and narrow introductions were inspected, with final replacement
  captures for the gradient page. `refinement-shapes-probe/geometry.json` records
  independent line-by-line measurements in both engines.
- TypeScript, prepare-app, Reference (13 tests), docs examples (6 tests), llms (13 tests)
  and all 711 scene compilations pass. Scoped lint is clean; full site lint has no
  errors and 39 warnings outside this batch. Final AI context and whitespace checks
  pass. Source semantics were checked against CSS Shapes Level 1 and native rendering.

Full production build and CSS contract review remain pending until the entire review
finishes. No core, public API, dependency or release behavior changed.

## Transforms, pivots, reference boxes and browser hints

Five documents and all 21 anchored scenes are reviewed. The inventory now contains
**160 reviewed routes out of 359**. Complete HTML and SVG preserve native controls,
source coordinates, layout slots, explicit pivots and nested 3D contexts. The obsolete
transform scaffolding was removed. Five new recipes bring the Design System to
**71 unique recipes**, with guidance on geometry and hint lifetime.

Original layout dimensions remain distinct from transformed client bounds. SVG fill,
stroke and view boxes produce actual different percentage translations. The HTML
content-box example uses native geometry because Chromium's resolved transform matrix
can serialize a border-box-based offset even when the actual content-box displacement
is correct. SVG client bounds are not described as including all stroke paint.

Final visual polish separates pivot labels from the markers and draws original circle
guides above enlarged fill. Will-change controls remain visible, named and operable;
the readout makes no performance or compositing-promotion claim.

The six-project sweep exposed a shared control bug: changing reduced-motion preference
paused native CSS transitions even in demos without playback controls. DemoViewport
now pauses only playback-controlled demos. It also refreshes property/size readings on
transition completion or cancellation, so the displayed value reaches the real final
state. New regression assertions verify preference changes, return transitions and
final dimensions without altering the demonstrated styles.

Evidence:

- `refinement-transforms-first`: **20/20 passed**. The initial six-project run passed
  59/60 and exposed the preference-change bug above. After fixing it, the final
  `refinement-transforms-close-resume` matrix passed **60/60**; existing animation
  playback/replay and reduced-motion checks passed **8/8**.
- `refinement-transforms-gallery-matrix`: **6/6 passed**. All 21 scenes and five new
  recipes were visually inspected at 390/768/1280px in both themes. Complete desktop
  documents and narrow introductions were inspected separately. Native Space, focus,
  link-independent control names, true viewport/print conditions, unchanged layout,
  SVG source bounds, percentage offsets and 3D grouping geometry are checked.
- Headless WebKit reports the expected 3D client geometry but its screenshots do not
  paint the projected 3D transform. The same limitation appears in independent native
  HTML outside the demo framework; `refinement-transforms-native` preserves both engines'
  images and geometry. Chromium verifies projected appearance. This is recorded as a
  screenshot-engine limitation, not a claim that all Safari versions lack 3D support.
- All 711 scenes compile; the polished 21 were recompiled. TypeScript, prepare-app,
  Reference (13 tests), docs examples (6 tests), llms (13 tests), AI context and whitespace
  checks pass. Final scoped lint is clean; full site lint has zero errors and 39 warnings
  outside this batch. Interrupted validation processes were restarted only after their
  handles and native processes were confirmed stopped.

Full production build and CSS contract review remain pending until the entire review
finishes. No core, public API, dependency or release behavior changed.

## Native transitions, delays and easing

Five documents and all 21 anchored scenes are reviewed. The inventory now contains
**165 reviewed routes out of 359**. Every transition comes from the complete adjacent
HTML: native checkboxes, buttons and a real link supply actual changed endpoints.
The generic transition fixture and its hidden movement/timing rules were removed.
Four recipes bring the Design System to **75 unique recipes**.

Property-list comparisons, zero duration, equal travel rates, sibling delays, custom
duration tokens, state-specific return curves and stepped progress each retain explicit
geometry. Timing rules use screen plus motion conditions so print stays immediate even
when the motion preference also matches. Readouts report the browser's native values.

Evidence:

- `refinement-transitions-final`: **60/60 passed**, spanning desktop/tablet Chromium
  and narrow WebKit in both themes. Tests inspect actual CSS transition timelines,
  midpoint interpolation, delays, easing, steps, native keyboard controls, accessible
  names, real link destinations, responsive/print conditions and reduced motion.
- `refinement-transitions-gallery-matrix`: **6/6 passed**. All 21 scenes and four new
  recipes were visually inspected at 390/768/1280px in both themes. All five complete
  desktop documents and narrow introductions were inspected separately.
- All 711 scenes compile, with the final 21 screen-scoped scenes recompiled. Prepare-app,
  TypeScript, Reference (13), docs examples (6), llms (13), AI context and whitespace
  checks pass. Full site lint has zero errors and 37 warnings outside this batch.

Full production build and CSS contract review remain pending until the entire review
finishes. No core, public API, dependency or release behavior changed.

## Native animation timelines and accessible motion controls

Nine animation documents and all 40 anchored scenes are reviewed. The inventory now
contains **174 reviewed routes out of 359**. The complete authored SVGs and keyframes
supply every visible animation. The generic hidden rotation fixture was removed.
Five new recipes bring the Design System to **80 unique recipes**; the existing
direction recipe uses the same explicit native path.

Delay, duration, direction, fractional iterations, fill and easing each keep distinct
base/start/end states where needed. Readouts report actual timeline time and progress.
The playback controller retains real CSS Animation objects after finite completion,
so Replay also works when a no-fill animation disappears from `getAnimations()`.
Canceled or detached animations are removed. Native CSS play-state lessons retain
stable checkboxes and child-targeted hover/focus selectors without playback overriding
the property being taught. Reduced motion stays paused until an explicit preview action;
print removes the animation. Responsive animation-name changes are screen-scoped so
print cannot accidentally restore a timeline.

Semantic text color gives the SVG strokes light/dark support. Native sRGB contrast
measurements against the preview surface are approximately 6.1:1 and 7.0:1. Decorative
fade opacity and faint guide circles remain intentional; visible status text stays still.

Evidence:

- `refinement-animations-final`: **108/108 passed** across six projects. Assertions cover
  real interpolation, negative delay, sibling timing, reverse cycles, finite completion,
  fractional endpoints, zero duration, keyframe-level easing, cancellation/reselection,
  native checkboxes, focus, keyboard playback, responsive conditions and print.
- `refinement-animations-polish`: **54/54 passed** after the semantic SVG color polish.
  Shared playback/reduced-motion checks passed **8/8** and transform regressions **4/4**.
  The shared reduced-motion test now checks both authored comparison subjects instead
  of using a stale single-target locator.
- `refinement-animations-gallery-matrix`: **6/6 passed**. All 40 scenes, six relevant
  recipes and nine complete documents were visually inspected. The final wide, narrow,
  fresh-introduction and gallery captures cover 390/768/1280px in both themes.
- All 711 scenes compile; the final 40 animation scenes were recompiled. Prepare-app,
  TypeScript, Reference (13), docs examples (6) and llms (13) pass. Full site lint has
  zero errors and 36 warnings outside this batch. AI context and whitespace pass.

Full production build and CSS contract review remain pending until the entire review
finishes. No core, public API, dependency or release behavior changed.

## Native interaction and accessibility

Ten documents and all 38 anchored scenes are reviewed. The inventory now contains
**184 reviewed routes out of 359**, including all **183 utility reference pages**.
Seven new recipes bring the Design System to **87 unique recipes**.

Complete native inputs, selects, disclosures, reset forms, scroll regions and drag
subjects supply actual behavior. ID scoping preserves labels, descriptions and local
references in independent comparisons. Drag readouts observe native starts and ends;
they do not enable or cancel drag. Obsolete simulated pointer/form fixtures were removed.
Platform-specific resize, selection and vendor drag constraints are documented in prose.

Evidence:

- `refinement-interactions-final`: **124/124 passed**. Six size/theme projects cover
  geometry, computed properties, native controls, keyboard access, accessible names,
  responsive changes and print. Additional native WebKit pointer and Chromium touch
  tests verify actual resize handles, drag starts, selection and gesture arbitration.
- Shared iframe/motion/CSS regressions: **16/16 passed**. Full 87-recipe gallery matrix:
  **6/6 passed**. All 38 scenes, ten complete documents, narrow introductions and eight
  relevant recipes were visually inspected at 390/768/1280px in both themes.
- Native select tests use actual typeahead/Enter; closed disclosure content is checked
  after opening. Narrow touch projects test focus and touch rather than assuming a
  hardware keyboard scrolls a mobile scrollport. These correct test assumptions without
  changing platform behavior. Screenshots preserve caret paint instead of injecting
  Playwright's default temporary transparent caret; the affected six captures pass.
- All 711 scenes compile, with the final 38 recompiled. Prepare-app, TypeScript,
  Reference (13), docs examples (6) and llms (13) pass. Full site lint has zero errors
  and 33 warnings outside this batch; final screenshot-test lint is clean.

Full production build and CSS contract review remain pending until the entire review
finishes. No core, public API, dependency or release behavior changed.

## Guide layout foundations

Six Guide documents are reviewed: breakpoints, containers, responsive design, sizing,
corner radius and layout system. The inventory now contains **190 reviewed routes
out of 359**. Ten practical foundation compositions join the 87 utility recipes.

Shared container controls resize a real ancestor without changing the viewport; page
previews reuse actual iframes. Native links, task checkboxes and accessible image
labels replace inert controls and placeholder content. Prose now distinguishes media
query initial-font units from container-relative units, query ancestors from their
children, physical dimensions from flex axes, and border-radius from clipping.
The `round` shortcut documents both its radius and aspect-ratio declarations.

Evidence:

- `refinement-foundations-complete`: **78/78 passed** across 390/768/1280px and both
  themes. Tests cover native thresholds, container ownership, measured dimensions,
  shrink/ellipsis behavior, radius, keyboard controls and real page grid tracks.
- Final token-table composition matrix: **36/36 passed**. Descriptions retain readable
  column width inside the local scroller. All six documents and narrow introductions,
  all shared specimens and all ten gallery compositions were visually inspected.
- Shared iframe/playback/reduced-motion regressions: **12/12 passed**. The stale
  Color conditional test was updated for its actual hover/focus/theme/print lesson;
  viewport behavior remains tested on Height. Corrected conditions pass **4/4**.
- Prepare-app, TypeScript, Reference (13), docs examples (6), llms (13), AI context
  and whitespace pass. Full site lint: zero errors and 32 warnings outside this batch;
  final table/test lint is clean.

A fresh development preview resolved a cached Design System MDX import before final
verification. No internal loader or core/package behavior was changed. Full production
build and CSS contract review remain pending until the complete review finishes.

## Next review findings

Colors, Elevation, Typography and Motion have been read completely. Findings include
legacy clipped theme comparisons, dynamic preview class assembly, incomplete palette
steps, inaccessible copy handling, misleading shadow advice, mismatched typography
comparisons and incomplete font-weight descriptions. Motion examples need explicit
controls, actual transition endpoints and accurate looping/finite recipe explanations.

## Color and elevation foundation review

Colors and Elevation are reviewed, bringing the route inventory to **192/359**.
Eight shared recipes use independent real light/dark iframe documents. They preserve
native disabled controls, working links, focus outlines, line widths and shadow states.
The palette includes all thirteen fixed steps per family and reports actual clipboard
success or failure without losing keyboard focus. Token inventory previews resolve
the preset's real mode values and dependencies locally, including otherwise unused roles.

The foreground example now uses blue; native sRGB canvas samples give approximately
6.11:1 against its light surface and 6.99:1 against its dark surface. This is evidence
for that specific pair, not a claim that every semantic alias guarantees contrast.
Shadow prose distinguishes unchanged preset geometry from mode-dependent colors.

`DemoTokenTable` combines tokens and utility names into a readable two-column inventory.
Namespace tables keep whole utility names and place their purpose beside the group.
These server-rendered tables stay outside measured scenes. The Design System documents
the tables, palette, copy controls, independent themes and readiness behavior.

Evidence:

- The 54-case paint matrix initially passed 49 cases; native color serialization and
  premature theme-switch assumptions caused five failures. Corrected subset runs and
  the final six inventory checks all passed. All 54 distinct cases are covered.
- `refinement-paint-tables-final`: **18/18 passed** after the shared inventory changes.
  A separate final table sweep passed **24 document checks** and captured 30 tables.
  Full documents, all eight recipes and final tables were inspected at 390/768/1280px
  in both modes. Narrow pages retain local table scrolling without page overflow.
- `refinement-paint-shared-ready`: **16/16 passed**. A real cold-load race allowed a
  viewport slider to accept input before hydration, then reset to its initial width.
  Viewport controls now wait for iframe readiness; native resizing and replay still work.
- Prepare-app, type-check, Reference (13), docs examples (6), llms (13), AI context and
  whitespace checks pass. Full site lint has zero errors and 32 warnings outside this
  batch; final scoped lint is clean. An initial table barrel export pulled server-only
  code into a client module; separate MDX registration fixed the boundary before the
  successful final browser checks.

The production build and CSS contract review remain pending until all 359 documents
are reviewed. No preset, public API, dependency or release behavior changed.

## Typography, motion and foundation exports

Typography and Motion are reviewed, bringing the inventory to **194/359**. Five
shared recipes show a reading hierarchy, an equal-context font/text comparison,
finite entrance animations, a real checkbox transition and a native modal dialog.
The guides preserve their anchors and document looping recipes, available font
weights, actual timing, reduced motion and focus restoration accurately.

Evidence:

- `refinement-type-motion-final`: **48/48 passed** across 390/768/1280px and both
  themes, including native layout/type values, replay after completion, delayed
  transitions, accessible dialog text, Escape, focus restoration and reduced motion.
- Complete Typography/Motion documents, all five gallery recipes and open dialogs
  were visually inspected. The first browser pass found Safari pointer-open focus
  restoration needed an explicit native close handler; the final matrix includes it.
- `refinement-type-motion-export`: **6/6 passed** after extracting table data, with
  unchanged typography geometry and complete desktop/mobile document compositions.
- `refinement-foundation-search-final`: **6/6 passed**. Search finds table descriptions,
  retains the old typography anchor, restores focus after one Escape, preserves the
  query on reopening and follows the selected result by keyboard. All six search
  views were inspected. An initial test targeted a nonexistent optional theme
  control; it now uses an actual document link as its focus origin.

The old Guide exporter stripped component tags without expanding included lessons.
`foundation-content.ts` now uses the existing non-executing MDX parser for all eleven
Design Foundations pages. Local MDX, generated CSS, token inventories and namespace
consumers are retained; missing content adapters fail explicitly. Data-only modules
supply the same values and descriptions to SSR and portable text. Reference Overview
syntax extraction keeps its existing default behavior.

- llms **17/17**, including all eleven search/export bodies, all eight Typography
  includes, native values, stable IDs and rejection of unknown/recursive components.
- A final data extraction sweep passed **22/22** document compositions in desktop
  Chromium/light and mobile WebKit/dark, with populated tables and no page overflow
  or runtime errors. Type-check, prepare-app, llms generation, docs examples, the
  scoped Reference checks and AI context pass.
- A full lint run overlapped a later token-reference edit and reported a parse error;
  stable scoped parsing passes. The subsequent frozen full run passes with zero errors
  and 31 warnings outside this batch. No core,
  preset, internal package, dependency or release behavior changed.

All 22 formal token/condition pages are now in progress. Their existing generated
bodies have been read; the next pass replaces oversized value boxes with a shared
compact definition list and keeps complete CSS examples for named conditions.

## Formal token and condition reference review

All 22 token/condition documents are reviewed, bringing the inventory to **216/359**.
Native token values now use a compact, server-rendered definition list. Identifiers,
mode labels and long CSS values wrap within the reading column; utility consumers
remain complete names. Each namespace explains its actual purpose and links to a
working Guide or utility example. Named conditions retain complete generated CSS.

The shared DocumentValueList and DocumentKeyList are documented in the Design System.
Every token keeps its stable heading and direct link. Search now maps the full CSS
variable identifier to its corresponding row. The first browser pass found inherited
prose styling made heading links display:contents and unfocusable; the site-owned
component now gives those links a real box and a visible keyboard focus outline.

Evidence:

- `refinement-token-complete`: **150/150 passed** across 390/768/1280px and both
  themes. All 22 documents preserve the preset inventory, native values, consumer
  keys and anchors without overflow or runtime errors. Search keyboard selection,
  row focus, six gallery compositions and general Reference code rendering pass.
- All 22 complete desktop/light and mobile/WebKit/dark documents were visually
  inspected, including the full palette inventory. Gallery specimens at all six
  width/theme combinations and additional long font/shadow/mode values in tablet,
  desktop/dark and mobile/light compositions were inspected as well.
- Reference **14/14**, docs examples **6/6**, llms **17/17**, type-check, prepare-app,
  actual llms generation and source budgets pass. Full site lint on frozen source
  passes with **zero errors and 31 warnings outside this batch**.

Theme, Variables & Modes, Global Styles and Cascade Layers are the next four
in-progress guides. The other 139 documents remain pending. Production build and
CSS contract review remain pending until all 359 documents are reviewed.



## Further refinement evidence

[Project and language rule review](./docs-refinement-project-language.md) records
the later project-styling guides, formal rules and their validation.
