# Homepage ownership and delivery QA — 2026-11-03

Status: local source implementation and packed-consumer validation. No publication,
registry pin update, commit, push, merge or deployment. The separate migration note
is not part of this change.

## Reproducible baseline

The starting sources are Master `59ecffb` and Master CSS `d6b77004b`. The latter
already includes the delivery Guide work. Baseline source hashes, Git differences,
tarball inventory, freshly built outputs and screenshots are retained under
`.cache/home-refactor-2026-11-03/baseline/`. This baseline has **50 + 155 routes**;
the earlier 203-route report is not the denominator for this work.

Both baseline and final builds use the same installed dependency trees, separate
disposable consumers and one identical shared-package tarball per stage. This is
packed installation validation, not a fresh registry installation. Consumers live
under `/tmp/master-home-refactor/`; immutable outputs, source evidence, logs and
raw browser records are retained in `.cache/home-refactor-2026-11-03/`.

Guide, translation, reference, skill and shared document-style edits resumed in another chat during QA.
A final live-workspace pack initially included new reading/prose rules; the route budgets rejected that mixture. The final archive was prepared from the frozen package plus only the owned home sources, and both consumers pass again. Concurrent edits are excluded from these consumers and this result. Their current source
changes must not be credited to this refactor or overwritten by its snapshot.

## Ownership and interfaces

| Source / owner | Consumers and states | Delivered boundary |
| --- | --- | --- |
| Shared `home.css`, `design.css` | Both homepage compositions, themes, header and page materials | Homepage base, without bento or segmented controls |
| Shared `bento.css` | Frame, Grid, product card, palette and cascade owners; narrow containers and Chinese wrapping | Only importing components |
| Shared `segmented-control.css` | SegmentedControl, DeliveryModesSection, WorkflowRoutes; selected, measured, focus, reduced motion | Only importing controls |
| Product `home-window-surface.css` | HomeEditorWindow, Lint panes and Agent; forced colors | Outer material only |
| Product `home-editor-chrome.css` | Bar, Tab and Lights used by Editor, Delivery and Lint | File-window chrome only |
| Product `home-code-window.css` | HomeCodeWindow, static code and focus | Code owner; no page-level feature aggregate |
| Product `home-code-colors.css` | Agent and CascadeLayers | Four semantic color roles |
| Product `copy-command.css` | CopyCommand; hover, focus, result feedback | Copy owner |
| Product Agent styles | Spinner, current step, forced-color track | Agent owner |

No package export map or version changes were needed: new styles use existing
explicit `home/*` subpaths. Window, Bar and Tab retain children snippets, `class`
and native HTML attributes. Lights remain decorative. Lint tab fill is expressed
with `--home-editor-tab-fill`; Agent shares only the exterior and keeps its own
pane layout. Details are recorded in the product components' `DESIGN.md`.

Removed after source-reference checks: `home-tag`, unused code-window dots/problem
rows, marquee rules/keyframes, unused chip/terminal-line rules, and HomeCodeWindow's
unconsumed `fixPreviewCode` prop/layers. Its single real caller still renders the
same code. `HomeCodeWindowProblem` remains: Lint and Agent consume that type.
`home-features.css` is removed after its live rules move to owners. Initial DOM or
Coverage alone was not used as deletion evidence.

Lint now has one reactive `phase`; the imperative `currentPhase` mirror is removed.
Elapsed time, animation geometry and paused-time snapshots remain separate. Editor
and Agent already derive their displayed states; their state machines and playback
rhythms remain intact. No shared player, rendering-mode change, global pruning,
compiler change or new dependency was introduced.

Intentional visual differences: Lint uses the Editor/Delivery lights and curved
file tabs, while retaining its code-well fill and pane arrangement. Agent uses the
same outer shadow material and retains its own chrome. Light/dark desktop and
phone screenshots were inspected; unrelated homepage composition is unchanged.

## Measured delivery

Bytes below are distinct reachable external CSS files, each independently compressed
with Node's default gzip/Brotli settings. Inline CSS is separate. These are not
production latency measurements.

| Homepage | External raw before → after | gzip before → after | Brotli before → after | Files / depth |
| --- | ---: | ---: | ---: | --- |
| Master | 122,483 → 113,592 | 25,936 → 24,537 | 21,575 → 20,520 | 8 / 1, unchanged |
| Master CSS | 330,129 → 326,748 | 59,597 → 58,877 | 46,371 → 45,934 | 10 / 1, unchanged |

Master inline CSS remains 2,067 bytes; product inline CSS is 13,346 → 13,266.
Unused old code-window declarations had supplied two storefront font-size tokens
externally. Removing them initially moved 47 bytes into inline CSS. The storefront
now owns those label sizes and dependencies, preserving its computed typography
without keeping dead rules or increasing the budget.

All 205 route budgets pass. Only Master `/` and product `/` and `/tw` change CSS
bytes; all other routes retain their CSS metrics. Homepage ceilings are tightened
to measured values, including the actual workspace/packed maximum for Master.
No budget is increased.

Other resource costs are reported rather than hidden:

| Resource | Master | Master CSS |
| --- | --- | --- |
| Homepage HTML gzip | 8,265 → 8,265 | 196,986 → 197,051 (+65) |
| Homepage HTML Brotli | 6,991 → 7,007 (+16) | 112,456 → 112,649 (+193) |
| Reached JS gzip, full interaction/theme sequence | 81,430 → 81,430 | 201,496 → 201,612 (+116) |
| Reached JS Brotli | 72,161 → 72,161 | 177,801 → 177,871 (+70) |
| Reached fonts and images | Identical bytes/counts | Identical bytes/counts |

The window components add a small amount of product HTML/JS. CSS savings therefore
are not the whole-page net saving. Local deterministic Brotli serving shows median
initial **subresource** transfer decreases of 1,059 bytes on Master and 410 bytes on
Master CSS in both themes. Including the separately measured HTML Brotli change
leaves 1,043 and 217 bytes respectively in this setup. Do not extrapolate that to
production speed or claim every asset got smaller.

Browser evidence comprises three fresh-context repetitions per theme/site/stage,
full scrolling, feature selection, theme switching, document navigation and return
home. Request counts are unchanged; cached return-home CSS transfers zero bytes.
Resource Timing excludes navigation HTML, which is reported separately above.
There is no CPU/network throttle; localhost durations are not speed claims.

Output hashing finds 151 Master duplicate groups (4,203,649 redundant raw bytes)
and 52 product groups (546,456 bytes), unchanged. These include brand download
aliases and original/generated outputs. No same-content/different-URL asset was
fetched twice in the measured homepage sequence, so no download saving is claimed
for these groups. Theme switching triggers additional lazy artwork requests; both
variants are not assumed to be downloaded up front. Formats, dimensions, quality,
public download URLs and compiler companion assets are preserved.

### Independent compression experiment — not shipped

An isolated transform with the already installed Lightning CSS minifier, followed
by the same gzip/Brotli calculation, gives these final-CSS counterfactuals:

| Homepage | Current gzip → experiment | Current Brotli → experiment |
| --- | ---: | ---: |
| Master | 24,537 → 22,232 | 20,520 → 19,086 |
| Master CSS | 58,877 → 52,162 | 45,934 → 42,787 |

These are compression-only measurements, not implementation savings. This task
retains the existing CSS compiler and asset compactor. The experiment does not
establish transformed selector/cascade compatibility, browser-target compatibility
or production transfer behavior, and its bytes are not included in the delivered
improvement. No new minifier or handwritten CSS rewrite is shipped.

## Verification and limitations

- Shared Astro/Svelte checks, Master type checks, 64 shared tests, four skills tests,
  14 Master site tests, and 128 product homepage tests pass. Product packed
  Astro/Svelte/TypeScript and ESLint checks pass. Shared package has no lint script.
- Five isolated packed fixtures cover Window, Tab, code, bento and segmented control.
  Each rejects Editor overlays, Lint diagnostics and Agent panes; the individual
  surface/chrome/bento/control boundaries and one foundation per route are checked.
- Editor: 24 cases including tours, focus/hover, keyboard color editing and touch.
  A pre-existing assertion expected `color:#218875`; it fails on the baseline too.
  It is corrected to the current native spelling `(color:#218875)` and passes;
  product examples are unchanged. Agent: 29 cases. Delivery: 33 cases.
- New Lint checks cover all rules, fixes, replay, keyboard, touch, forced colors and
  offscreen pause on Chromium and WebKit. WebKit's scrolling is explicitly centered
  after font/layout settlement before checking the visibility-gated player.
- Both sites pass 320/390/768/1280/1440px × light/dark, no-JS first paint and 200%
  text checks. There are 120 before/after specimen screenshots. Header regression
  tests and Chromium/WebKit cold/cached context and modal tests pass.
- 1,529 code blocks, 211 iframe documents and 249 export files compare unchanged
  across the 205 pages. The project manifest is byte-identical. Homepage hydration
  class lists intentionally reflect removed/added native names and storefront
  label ownership; hydration versions and resource ordering are unchanged.
- The exact contract also records a replay-order-only change among `ui-table`,
  `ui-prompt-body`, `ui-prompt` on both AI-coding locales. Their class sets and CSS
  are identical. It is explicitly recorded, not hidden in a blanket snapshot reset.
- Svelte documentation MCP and autofixer were used. Existing Agent findings about
  unkeyed static lists and trusted static HTML, plus animation/DOM suggestions,
  remain advisory; no new issues are introduced. The local Master CSS workspace
  MCP succeeds. Its generic project scanner misparses existing Svelte script/regex
  fragments as markup classes; the framework-aware project lint passes. Its raw
  diagnostics are retained, not reported as a clean MCP lint result.
- Initial consumer type-check failures came from an omitted root TypeScript helper;
  copying the existing helper into the disposable consumer resolves them. No
  source workaround or type suppression was added.

The current checkout’s concurrent Guide and document-style work is outside this frozen validation.
A future published package/pin integration and deployment remain separate work;
no hosted result is claimed. Evidence entrypoint:
`.cache/home-refactor-2026-11-03/README.md`.
