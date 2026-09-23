# Layout and typography refinement evidence

Completed batch evidence for [the documentation refinement review](./docs-refinement.md).

## Flow and visibility review

The first completed batch covers 12 documents: `clear`, `float`, `display`,
`box-sizing`, `columns`, `column-span`, `break-before`, `break-after`, `break-inside`,
`contain`, `visibility`, and Guide `spacing`. Every section was read and its narrow
and wide composition inspected. The Next.js installation preview was also checked
for the shared Hello World spacing change; its installer prose remains pending.

The shared viewport now supports explicit content sizing for normal flow. Fixed,
sticky, scrolling and viewport-unit scenes keep a bounded viewport. Development
previews reread authored MDX and frame styles so a hot update cannot leave an old
scene beside new documentation. Syntax previews for float and column-span now use
the same media, text and surface primitives as the rest of the system.

Behavior corrections include real `x` multipliers in the spacing guide, screen-only
responsive conditions where print needs a different result, 160px/194px box-model
references, genuine column fragmentation, and containment resets on the owning
element. Visibility examples contrast a reserved flex-item slot with a collapsed
native table row. All existing utility section IDs remain unchanged.

Evidence is recorded in `docs-refinement.json`. Browser artifacts for this batch
live under `site/test-results/refinement-flow-visibility`; shared-control regression
artifacts use `site/test-results/refinement-shared-controls`. Screenshots include
each individual demo, not only the first example on each page. Wait for iframe
fonts before capturing column layouts, and do not run `prepare-app` or edit source
during a browser sweep: development hot reload can interrupt an active navigation.

Validation includes all 711 compiled scenes, TypeScript, Reference and Markdown
export tests, documentation-example tests, llms tests, and AI context budgets.
The full site lint run reported no errors; follow-up scoped lint retains only three
intentional canonical-alias warnings for the guide's `m:1x`, `p:2x`, and `gap:3x`
teaching examples. Replacing these with token aliases would contradict the lesson.
The final production build and CSS contract update remain part of the full review.

Native behavior was checked against browser geometry and the CSS specifications:
[normal flow](https://www.w3.org/TR/CSS22/visuren.html#flow-control),
[multi-column layout](https://www.w3.org/TR/css-multicol-1/),
[containment](https://www.w3.org/TR/css-contain-2/), and
[visibility](https://www.w3.org/TR/CSS22/visufx.html#visibility).

Browser results: the 84-case flow/visibility matrix finished with 83 passes and one
development hot-reload navigation interruption. The affected column-fragmentation
case and containment alias cleanup were rerun independently in all four projects:
8 passes. The 24 shared-control regression cases also passed, covering fixed/sticky
positioning, native conditions, media sizing, accessible viewport controls, reduced
motion, replay and Design System measurements. No assertion was relaxed for the
interrupted navigation. Repeat the complete matrix against the final static build
when all document batches are finished.

## Positioning, stacking and clipping review

The next completed batch covers `position`, `inset`, `z-index`, `isolation`, and
`overflow`: 23 teaching sections, their syntax overviews, and page metadata. This
brings the independently reviewed total to **17 of 359 routes**. The full review
remains in progress; these batches do not substitute for the remaining documents.

Shared positioning and clipping recipes now take their structural classes directly
from the displayed HTML. Decorative outlines do not supply implicit position,
width, height or isolation. Labels remain outside the measured layout; overlapping
layers keep their names in visible areas. Fixed/sticky examples retain bounded
iframes. Ordinary stacking and blend comparisons use content sizing. The Design
System adds local stacking, hidden/clip controls and external-backdrop isolation
recipes, along with authoring guidance on containing blocks and native scrolling.

Browser checks cover preserved relative-flow slots; fixed/sticky bounds; automatic
inset dimensions; real hit-tested paint order; isolated blend pixels; focus and
viewport conditions; hidden versus clip scroll offsets; block ellipsis; native
scroll containers; and print conditions. The fixed search control now has native
searchbox semantics and a matching accessible name. All stable section IDs remain.

Artifacts:

- `site/test-results/refinement-positioning-close`: final five-page composition and
  scrolling checks, 390/768/1280px, both themes; 42/42 passed.
- `site/test-results/refinement-positioning-final`: other behavior checks and all
  12 Design System recipes at 390/768/1280px in both themes. The matrix had 68 passes,
  four mobile input-tool failures, and 12 intentionally omitted duplicate gallery
  captures; the corrective run above covers all four failures. Across these runs,
  all 72 distinct targeted cases pass.
- `site/test-results/refinement-positioning-shared`: 12/12 fixed/sticky, animation
  replay, keyboard control and reduced-motion regressions passed.

Input-tool limitation was isolated with a plain native scrollable div: Playwright
WebKit does not perform default arrow-key scrolling, and its mobile mode explicitly
rejects mouse-wheel input. Chromium tests verify actual arrow-key scrolling. Mobile
WebKit tests verify focus, keyboard activation of buttons, and actual native
`scrollBy`/`scrollTo` geometry. Physical mobile touch gestures remain unverified;
no application keyboard override or simulated CSS state was added to hide this.

All 711 utility scenes compile. TypeScript, `prepare-app`, Reference (13 tests),
documentation examples (6 tests), and llms exports (13 tests) pass. Full site lint passes with zero errors and 54 existing warnings outside this batch;
the changed batch has no lint warnings. AI budgets pass for 2,638 files, and
`git diff --check` is clean. The final production build and CSS contract review
remain pending until the complete documentation review ends.

Native semantics were checked against [CSS Positioned Layout](https://www.w3.org/TR/css-position-3/),
[CSS Overflow](https://www.w3.org/TR/css-overflow-3/), and
[Compositing and Blending](https://www.w3.org/TR/compositing-1/).

## Scrolling, offsets and snapping review

The third completed batch covers seven documents and all 28 teaching sections:
`overscroll-behavior`, `scroll-behavior`, `scroll-margin`, `scroll-padding`,
`scroll-snap-align`, `scroll-snap-stop`, and `scroll-snap-type`. Metadata, syntax
overviews and complete authored examples were reviewed. The independently reviewed
total is now **24 of 359 routes**; the whole-site review remains in progress.

The new scrolling recipe decorates each section's exact portable HTML. Scrollport
dimensions, nested containers, track directions and snap candidates belong to that
HTML, not injected frame geometry. Native position and target-inset readings make
the result visible when the platform hides scrollbars. Destination and edge controls
remain outside the tested layout. Shared frame styles add neutral surfaces and
blue/violet outlines without changing measured bounds.

Meaningful examples replace empty containers and static-print comparisons. They
cover native anchor navigation, 64px clearance under a 48px sticky header, distinct
target margins and container viewing insets, physical edge padding, genuine nested
chaining, interior centered targets, one deliberate snap stop, and responsive
horizontal/vertical tracks. All stable section IDs remain. The Design System adds
three scrolling recipes and guidance for authoring geometry, readouts and controls.

Destination controls use the target's computed snap alignment and preserve the
host document's scroll position. WebKit currently ignores the nearest-container
scroll option; restoring only the host position leaves the actual inner alignment
to the native browser API. Smooth scrolling follows the system's reduced-motion
preference, including preference changes after loading the page.

Snap-stop comparisons use one immediate native relative request. A minimal fixture
independently reproduced WebKit's smooth `scrollBy` snapping difference: a 600px
request skipped an `always` stop, while immediate scrolling stopped at 208px in
both Chromium and WebKit. The exported document links the relevant
[WebKit issue](https://bugs.webkit.org/show_bug.cgi?id=293227). Normal pass-through
is also tested against the actual available scroll range; tablet-sized tracks can
end before the nominal fourth-card destination. No CSS state is simulated.

Evidence:

- `site/test-results/refinement-scrolling-close`: 88/90 cases passed across
  390/768/1280px and both themes. The two explicit skips are mobile WebKit wheel
  chaining, because its automation API does not support wheel input. Chromium
  verifies real chaining on both axes; mobile checks cover native controls,
  keyboard activation, focus and real offsets. Physical touch momentum remains
  unverified.
- `site/test-results/refinement-scrolling-mobile-paint`: 14/14 composition cases
  passed. Captures wait two animation frames after scrolling, avoiding stale
  offscreen iframe paint in WebKit screenshots.
- `site/test-results/refinement-scrolling-gallery`: 6/6 gallery cases passed,
  covering all 15 recipes at 390/768/1280px in both themes.
- `site/test-results/refinement-scrolling-detail`: narrow WebKit detail captures
  expose the full nested-comparison heading and show actual 64px/208px destinations
  after activation. The taller capture viewport only avoids fixed-header overlap
  in an element screenshot; the normal mobile matrix remains unchanged.
- `site/test-results/refinement-scrolling-shared`: 20/20 native conditions,
  viewport controls, replay, reduced-motion and keyboard-navigation regressions.

All 711 scenes compile. TypeScript, `prepare-app`, Reference (13 tests), docs examples
(6 tests), and llms exports (13 tests) pass. Full site lint reports zero errors and
54 existing warnings outside this batch; final scoped lint is clean. The full
production build and CSS contract update remain pending for the complete review.
AI context budgets pass for 2,641 files, the 359-route inventory remains unique,
and `git diff --check` is clean.

Behavior was checked against [CSS Scroll Snap](https://www.w3.org/TR/css-scroll-snap-1/),
[CSS Overscroll Behavior](https://www.w3.org/TR/css-overscroll-1/), and
[CSS Overflow](https://www.w3.org/TR/css-overflow-3/#smooth-scrolling), as well as
native Master CSS compiler output and measured browser geometry.

## Flex sizing, wrapping and source order review

The fourth completed batch covers seven documents and all 27 teaching sections:
`flex`, `flex-basis`, `flex-grow`, `flex-shrink`, `flex-wrap`, `flex-direction`, and
`order`. Complete MDX, metadata, syntax overviews and local components were reviewed.
The independently reviewed total is now **31 of 359 routes**; the whole-site review
remains in progress. All 27 existing section IDs are preserved.

Each scene now decorates the exact authored HTML. Parents, dimensions, gaps, bases,
minimum-size constraints and siblings are visible in the portable example; the
frame adds only the shared paint and external annotation. A new Flexbox recipe
replaces injected shrink/wrap geometry. Measurements report actual container, blue
item and (for grow/shrink) violet item border boxes. The shared viewport observes
measured elements directly, so intrinsic text/font changes update the readings even
when neither the iframe nor its body resizes. Axis labels use the computed layout.

The prose distinguishes `flex:0` from `flex:none`, a basis from the final size,
positive free-space ratios from final width ratios, and shrink factors from their
basis-weighted effects. A 280px row with 192/96px bases and a 16px gap produces
176/88px items. Label padding is nested inside those items because scaled shrink
weights use the inner flex basis. Fixed media, long unbroken text, genuine wrapping,
reversed line stacking, row/column reversal and auto-placed grid ordering all have
complete working examples. Responsive lessons change real iframe media queries.

Native button examples expose the difference between visual order and source-order
focus. An independent plain-HTML fixture reproduced WebKit's default Tab behavior:
plain buttons were skipped, Alt+Tab included them, and explicit `tabindex="0"`
included them in normal Tab traversal. The authored examples now use zero indices,
with no positive indices or custom keyboard behavior. Chromium and mobile WebKit
both verify Source 1 → Source 2 → Source 3 and a visible 2px focus outline with 3px
offset. These are native sequential-focus controls, not a simulated reorder demo.

The Design System now contains 18 recipes. The three additions demonstrate fixed
and flexible regions, measured free-space distribution and preserved source order.
Its authoring guidance documents geometry ownership, intrinsic size readings,
padded inner labels and native keyboard controls. The existing order syntax preview
uses the same neutral/blue specimens with compact fixed geometry.

Evidence:

- `site/test-results/refinement-flexbox-final`: **84/84 passed**, including behavior
  and every page's composition at 390/768/1280px in both themes. Desktop/tablet use
  Chromium; mobile uses WebKit. Every individual demo screenshot was examined.
- `site/test-results/refinement-flexbox-gallery-final`: **6/6 passed**, covering all
  18 recipes at 390/768/1280px in both themes; the three new recipe compositions were
  inspected individually.
- `site/test-results/refinement-flexbox-shared`: **24/24 passed**, covering shared
  viewport controls, native conditions, named grid/flex geometry, scrolling,
  keyboard controls, animation replay and reduced motion.
- `site/test-results/refinement-flexbox-detail`: six additional narrow WebKit
  captures and two keyboard-focus captures. A taller capture viewport avoids the
  fixed page header overlay that locator screenshots introduce for demos taller
  than the normal mobile viewport. The standard 390px mobile matrix is unchanged.

All 711 scenes compile. TypeScript, `prepare-app`, Reference (13 tests), docs examples
(6 tests), and llms exports (13 tests) pass. Full site lint has zero errors and 54
existing warnings outside this batch; final scoped lint is clean. AI context budgets
pass for 2,644 files, the 359-route inventory remains unique and `git diff --check`
is clean. The production build and CSS contract update remain pending until the
complete documentation review ends. Public package and preset behavior is unchanged.

Behavior was checked against [CSS Flexible Box Layout](https://www.w3.org/TR/css-flexbox-1/),
[HTML sequential focus](https://html.spec.whatwg.org/multipage/interaction.html#the-tabindex-attribute),
actual Master CSS compiler output, and independent native browser fixtures.

## Alignment and distribution review

The fifth completed batch covers nine documents and all 31 teaching sections:
`align-content`, `align-items`, `align-self`, `justify-content`, `justify-items`,
`justify-self`, `place-content`, `place-items`, and `place-self`. Complete MDX,
metadata, syntax overviews and local components were reviewed. The independently
reviewed total is now **40 of 359 routes**. All 31 section IDs match their existing
stable anchors; the remaining documentation review is still in progress.

The shared alignment recipe paints the exact portable HTML and adds annotations
outside the teaching layout. A small shared paint helper serves both Flex and
alignment scenes without supplying geometry. Native readings show the computed
property, logical axis, track widths, border-box sizes and the blue item's physical
x/y offset from the container's inner top-left corner. Readings update when measured
elements resize and when the actual scrollport scrolls. Obsolete forced alignment
widths and minimum heights were removed from the frame styles.

Complete examples now distinguish flex lines from items, Grid track distribution
from item alignment, and Flex main/cross axes from Grid inline/block axes. They
show genuine media/caption edges, first text baselines, automatic-size stretching,
parent defaults and self overrides. Stretch works with both an explicit container
height and a line height established by a sibling; a definite height is not an
unconditional prerequisite. Native fixtures verify that align-content has no effect
on nowrap but can move a single actual line in a wrapping container. Safe/unsafe
centering uses a real focusable named scrollport: safe starts at zero, unsafe at
-20px, and the native scroll offset updates the reading. The prose explains how a
nonzero gap combines with distributed free space.

All conditional sections use real iframe media queries. The shared viewport's
configurable `maxWidth` now defaults to 1600px instead of the former hard 1200px
limit, so the preset's 1280px `lg` condition can be reached. Tests use actual 900px
and 1400px viewports for `sm` and `lg`; no inline alignment override simulates a
query. The Design System documents the readout attributes and width control and
adds track/item separation, automatic stretch and safe-overflow recipes, bringing
the gallery to 21 templates. A final visual pass shortened the blue place-self
labels so they fit their deliberately small boxes without changing geometry.

Evidence:

- `site/test-results/refinement-alignment-final`: **108/108 passed**, covering all
  nine pages' behavior and composition at 390/768/1280px in both themes. Chromium
  covers desktop/tablet and WebKit covers mobile. Every individual demo, all nine
  document compositions and narrow introductory syntax tables were inspected.
- `site/test-results/refinement-alignment-label-close`: **12/12 passed** after the
  final place-self label correction, including behavior and all six compositions.
- `site/test-results/refinement-alignment-gallery`: **6/6 passed**, covering all 21
  recipes at three widths in both themes. All three new recipes were inspected.
- `site/test-results/refinement-alignment-flex-regression`: **42/42 passed** for
  all seven Flex behavior checks in six projects after extracting shared paint.
- `site/test-results/refinement-alignment-shared`: **24/24 passed**, covering
  viewport controls, native conditions, flex/named-grid behavior, native scrolling,
  keyboard controls, animation replay and reduced motion.
- `site/test-results/refinement-alignment-detail` and
  `site/test-results/refinement-alignment-detail-close`: full narrow captures of
  all 31 scenes in both themes, final place-self captures at all three widths, and
  tall tablet distribution captures. Taller detail viewports avoid the fixed page
  header overlay in screenshots of elements taller than a normal viewport. The
  ordinary six-project matrix retains its standard viewport heights.

All 711 utility scenes compile, and the final 31 alignment scenes were also checked
against native compiler output. TypeScript, `prepare-app`, Reference (13 tests),
documentation examples (6 tests), and llms exports (13 tests) pass. Full site lint
reports zero errors and 54 existing warnings outside this batch; scoped lint has
no rule violations. The final production build and CSS contract update remain
pending until the complete documentation review ends. Public package APIs and
preset semantics are unchanged. AI context budgets pass for 2,648 files, the
359-route inventory remains unique, and `git diff --check` is clean.

Behavior was verified against [CSS Box Alignment](https://www.w3.org/TR/css-align-3/),
[Flex line alignment](https://www.w3.org/TR/css-flexbox-1/#align-content-property),
[Grid alignment](https://www.w3.org/TR/css-grid-2/#alignment), native compiler output
and measured browser geometry.

## Grid review

All 13 Grid documents are now reviewed: `grid`, `grid-area`, `grid-auto-columns`,
`grid-auto-flow`, `grid-auto-rows`, `grid-column`, `grid-columns`, `grid-row`,
`grid-rows`, `grid-template`, `grid-template-areas`, `grid-template-columns`, and
`grid-template-rows`. Their 34 sections retain every original stable heading ID.
The full inventory now contains 53 reviewed documents out of 359.

Every scene renders its complete authored parent and children. The new Grid recipe
adds only paint and external readings; obsolete shared rules that supplied tracks,
placement and missing children were removed. Explicit and implicit tracks, gaps,
flow, named maps and spans now come from the visible framework-neutral HTML.
Track readings round pixel values to one decimal and retain the raw computed value
in the output title. Size and position readings measure the actual blue item.
Conditional canvases omit duplicate property toolbars while keeping viewport controls.

The native `grid` shorthand does not establish Grid display and resets implicit
settings. `grid-template` preserves those settings. Browser fixtures verify the
different resets. Line examples measure track boundaries and include internal gaps;
negative indices refer to the explicit grid. Named-area examples define rectangular
maps and track sizes separately, and explain why removing a map does not reset a
child's named placement. Sparse/dense examples create real holes with spanning
native buttons and verify that Tab still follows source order.

Equal-row examples use a definite height and explain the column flow established
by `grid-rows:N`. Track-minimum comparisons keep the same intrinsic content and
non-scrollable clipping in both examples: automatic column minimums produce
216/48px tracks, while a zero minimum permits 88/176px. Real four-line content grows
a minmax row from 48px to 104px and reduces the remaining fractional row. All 13
conditional sections use actual iframe media queries, including a 1400px viewport
for the preset's `lg` condition. No inline style simulates a condition.

The Design System now documents these constraints and the optional rounded style
readout. Four additional recipes cover implicit tracks, dense focus order,
responsive named regions and flexible track minimums, bringing the gallery to
25 templates.

Evidence:

- `site/test-results/refinement-grid-close`: **156/156 passed**, covering all 13
  pages' behavior and composition at 390/768/1280px in both themes. Chromium covers
  desktop/tablet; WebKit covers mobile. Every individual scene, all 13 complete
  desktop documents, and narrow introductory syntax tables were inspected.
- `site/test-results/refinement-grid-sorted`: **26/26 passed** for all Grid behavior
  checks in Chromium and WebKit after sorting classes. A source comparison confirmed
  that the cleanup changed only class order, preserving every class and anchor.
- `site/test-results/refinement-grid-gallery-close`: **6/6 passed** for all 25
  recipes at three widths in both themes. All four new recipes were inspected.
- `site/test-results/refinement-grid-shared`: **24/24 passed**, covering viewport
  controls, native conditions, named Grid/Flex layouts, scrolling, keyboard controls,
  animation replay and reduced motion after the shared readout change.
- `site/test-results/refinement-grid-detail-close`: narrow captures of all 34
  scenes in both themes and introductory syntax. Tall detail viewports avoid the
  fixed-header overlap in screenshots of tall elements. One auto-rows light capture
  preceded host stylesheet readiness; it was recaptured and inspected after host
  styles and fonts settled. The standard six-project matrix passed independently.

All 711 utility scenes compile; the final 34 Grid scenes were compiled again after
class sorting. TypeScript, `prepare-app`, Reference (13 tests), documentation
examples (6 tests), and llms exports (13 tests) pass. Full site lint found zero
errors, 54 existing warnings outside this batch and 29 new class-order warnings.
The 29 new warnings were fixed; final scoped lint has no rule violations. AI context
budgets and `git diff --check` pass. The final production build and CSS contract
review remain pending until all documentation batches finish. Package APIs and
preset semantics are unchanged.

Behavior was verified against native compiler output, measured browser geometry,
and CSS Grid's [shorthand](https://www.w3.org/TR/css-grid-2/#grid-shorthand),
[auto-placement](https://www.w3.org/TR/css-grid-2/#auto-placement-algo),
[template](https://www.w3.org/TR/css-grid-2/#grid-template-property) and
[named-area](https://www.w3.org/TR/css-grid-2/#grid-template-areas-property) definitions.

## Sizing and spacing review

All 13 sizing and spacing documents are reviewed: `width`, `height`, `size`,
`min-width`, `min-height`, `min-size`, `max-width`, `max-height`, `max-size`,
`aspect-ratio`, `gap`, `margin`, and `padding`. Their 65 scenes cover 64 third-level
teaching headings plus padding’s quick answer. All original stable heading IDs,
padding’s legacy anchor and its data-driven token values remain intact. The
inventory now contains **66 reviewed documents out of 359**.

The sizing recipe renders complete authored HTML and adds only paint, comparison
labels and external readings. Obsolete injected geometry and placeholder-media
rules were removed. Parent and blue border-box dimensions are measured separately;
padding reports its actual content dimensions and physical insets, margin reports
its external offset, and named scrollports report their real scroll position.
Content examples grow naturally. Viewport-height examples use a bounded 320px
iframe; fluid wrappers can enable width controls without inventing a breakpoint.

The documents now explain definite percentage references, intrinsic sizing,
preferred/minimum/maximum conflicts, physical versus logical dimensions and actual
media ratios. The flex-minimum comparison retains the same 224px content and
non-scrollable clipping in both cases, measuring a 224px automatic minimum against
a 176px zero minimum. Real four-line content grows an 80px minimum to 104px.
Paired image limits preserve a 320:200 source ratio unless explicit dimensions
force a square. Two definite dimensions override a preferred aspect ratio.
The min-width overview typo `min-vh` is corrected to `min-vw`.

Gap examples use actual Grid and Flex children; margin examples preserve native
sibling collapse and demonstrate flow-root separately. Padding exposes fixed neutral
content with centered labels, including RTL and vertical writing. Annotation space
around deliberate visible overflow stays outside the measured object. Every
conditional section changes a real iframe viewport. Scroll regions and icon
buttons have accessible names; keyboard scrolling and focus appearance are checked.

The Design System documents authored constraints, content, bounded viewports and
annotation placement. Four added recipes cover intrinsic widths, automatic flex
minimums, logical padding and ratio versus definite dimensions. There are now
**29 recipes**, with links to their actual reference sections.

Evidence:

- `site/test-results/refinement-sizing-final`: **156/156 passed**, covering all
  65 scenes’ behavior and all 13 pages’ composition at 390/768/1280px in both themes.
  Chromium covers desktop/tablet and WebKit covers mobile. Every scene, the full
  desktop documents and narrow introductory syntax were inspected. No page overflow,
  page errors or hydration mismatches were reported.
- `site/test-results/refinement-sizing-detail` and `refinement-sizing-detail-final`:
  all 65 scenes in both themes, with 26 polished scenes recaptured. Tall mobile
  detail viewports avoid fixed-header interference in tall-element captures.
- `site/test-results/refinement-sizing-gallery-final`: **6/6 passed** for all
  29 recipes at three widths in both themes. All five affected recipes were inspected.
- The first matrix exposed test assumptions, not a layout regression: WebKit rounds
  substring Range widths differently from intrinsic glyph advances, and a zero-duration
  ArrowDown can miss native scroll animation. Tests now use the loaded font’s canvas
  metrics and a 100ms key press. All geometry tolerances remain unchanged.

All 711 utility scenes compile. Site TypeScript, `prepare-app`, Reference (13 tests),
documentation examples (6 tests), llms exports (13 tests), AI context budgets and
`git diff --check` pass. Full site lint reports zero errors and 49 existing warnings
outside this batch; final scoped lint has no rule violations. The final production
build and CSS contract review remain pending until the complete documentation review
finishes. Package APIs, preset semantics and release configuration are unchanged.

## Type, glyphs and inheritance review

All twelve typography documents and their 54 scenes have been refined and reviewed.
The inventory now contains **78 reviewed documents out of 359**. Every stable heading
ID is preserved, including font-family’s second-level whitespace section. Eight
shared guide specimens use the same authored recipes; the full Typography guide
remains pending its independent review.

The type recipe retains the exact authored HTML, inheritance, inline formatting,
SVG and complete table structure. Whole-document examples preserve real head
resources and body classes. Font loading reports actual loaded/fallback state.
Computed property and run-size readings stay outside the measured context; tracking
retains fractional precision. Static specimens no longer have empty toolbars.

Examples verify nine variable weights, intermediate weight 550, true proportional
and tabular advances, and a supported slashed-zero face. Unitless and fixed line
heights differ under inheritance. The combined text utility reports its three
size-dependent properties. Vertical alignment uses actual inline objects and table
cells. Screen-only breakpoint conditions preserve print rules. Font smoothing and
remote font availability are described without unsupported visual guarantees.

Four reusable recipes cover inherited resets, digit advances, line-height inheritance
and inline SVG baselines. The Design System now has **33 recipes** and corresponding
authoring guidance. No public package or preset behavior changed.

Evidence:

- `site/test-results/refinement-type-close`: **150/150 passed**. All twelve reference
  pages and the affected guide specimens were checked at 390/768/1280px in both
  themes. Chromium covers desktop/tablet and WebKit covers mobile. Every scene,
  full desktop composition and narrow introductory syntax was inspected.
- `site/test-results/refinement-type-detail`: all 54 mobile scenes in both themes
  plus twelve paired document introductions. Taller capture viewports avoid fixed
  header overlap in element screenshots; normal mobile checks retain their standard
  viewport height.
- `site/test-results/refinement-type-gallery`: **6/6 passed**, with all 33 recipes.
  The four new recipes were inspected individually at all three widths and themes.
- Native keyboard focus, desktop hover, responsive sizing, print CSS, font loading
  fallback, glyph changes, inherited resets and named SVG/table contexts are tested.

All 711 scenes compile; the final 54 typography scenes were recompiled after polish.
TypeScript, `prepare-app`, Reference (13 tests), documentation examples (6 tests) and
llms exports (13 tests) pass. Full site lint passes with zero errors and 47 existing
warnings outside this batch; scoped changed-source lint is clean. The production
build and CSS contract review remain pending until the whole documentation review
finishes. Native geometry was checked against CSS Fonts and CSS2 inline formatting.

## Text flow, whitespace and reading paths review

All fourteen text-layout documents and their 60 scenes have been refined and reviewed.
The inventory now contains **92 reviewed documents out of 359**. Existing heading IDs
are preserved. The shared authored-text recipe now supports computed pseudo-element
readings and optional box measurements while keeping whitespace, language, direction,
nested blocks, SVG and native disclosure structure intact.

The examples distinguish wrapping from intrinsic sizing, first-line indentation from
box spacing, and logical alignment from physical edges. Arabic and Chinese text make
native direction and vertical column progression visible. Manual soft hyphens remain
in the source; automatic hyphenation uses the browser's actual dictionaries. Truncation
examples provide complete prerequisites and an explicit reading path when needed.
Rendering hints make no promise of a visible difference or faster rendering.

Four new Design System recipes cover meaningful whitespace, min-content wrapping,
full-text disclosure and vertical column progression. There are now **37 recipes**.
The authoring guide explains semantic language, actual constraints and keeping
annotations outside the text context. The old generic text-wrap:<value> syntax row
was removed: the current compiler treats its suffix as a pseudo-class. The four
verified aliases remain; no compiler or preset semantics were changed.

Evidence:

- `site/test-results/refinement-text-flow-final`: **168/168 passed**, with native
  behavior and all fourteen page compositions at 390/768/1280px in both themes.
  Chromium covers desktop/tablet and WebKit covers mobile. All 60 scenes, complete
  desktop documents and paired narrow introductions were inspected.
- `refinement-text-flow-close`: **18/18 passed**, recapturing text-wrap, overflow-wrap
  and line-clamp after caption, syntax and source-format polish. The screenshot
  readiness check now waits for screen-reader-only control legends to receive their
  stylesheet; one early tablet capture had occurred before that rule was loaded.
- `refinement-text-flow-detail` and `refinement-text-flow-detail-close`: all 60 mobile
  scenes in both themes, with final text-wrap captures. Tall capture viewports avoid
  fixed-header overlap without altering normal mobile behavior tests.
- `refinement-text-flow-gallery`: **6/6 passed**, all 37 recipes at the three widths
  in both themes. The four new recipes and updated balancing recipe were inspected.
- `refinement-text-flow-type-regression`: **72/72 passed** for the existing typography
  behavior suite after shared renderer/readout changes.
- Shared controls: **20/24 initially passed** in `refinement-text-flow-controls`.
  The four failures were the same stale height fixture expectation left from the
  earlier sizing refinement. The test now checks the authored 48/80px height and uses
  the color example for theme/hover/print. All four corrected cases pass in
  `refinement-text-flow-conditions-close`; the other twenty checks remain passing.

The first focused behavior run exposed two native differences. Chromium normalizes
clamped display to flow-root but returns -webkit-box after removing the line limit.
WebKit can retain a soft-hyphen break when only hyphens changes; the responsive example
now uses an explicit fluid width, causing normal viewport-driven reflow. No inline
style simulation, remount or reduced assertion hides these behaviors.

All 711 utility scenes compile, and the final 60 scenes were recompiled after polish.
TypeScript, prepare-app, Reference (13 tests), documentation examples (6 tests), llms
exports (13 tests), source budgets and whitespace checks pass. Full site lint has
zero errors and 47 existing warnings outside this batch; final scoped lint is clean.
The production build and CSS contract review remain pending until the complete
359-document review finishes. No package API or release configuration changed.
