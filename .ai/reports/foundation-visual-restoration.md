# Foundation visual restoration

The original 2026-09-29 restoration is recorded below. The [2026-10-28 follow-up](#2026-10-28-guide-readability-follow-up) supersedes its Guide selection details and palette count.

Status (2026-09-29): restoration complete; final shared-workspace and isolated static builds both pass. Baseline: `fef197a78`. Integration base: `e20a75fed` (unified Demo components). The Reference inventory remains 90 documents; no retired property routes or redirects are restored.

## Ownership and source inventory

Migrate content, presentation and interaction together. A lookup page deserves a designed visual explanation. A teaching selection may be rich and self-contained; its size is determined by the task, not an arbitrary specimen limit. Before removing a presentation, mount its replacement on its public destination and verify its appearance and behavior.

| Original source at `fef197a78` | Public destination | Preserved or restored presentation |
| --- | --- | --- |
| `docs-shell/components/ColorPalette{,Item}.tsx`; Guide Colors `PresetThemeColors` | `/reference/tokens/color`; `/guide/colors` | Complete 22 × 13 fixed hue matrix; hue names and step labels; CSS value and variable copy. Guide uses three explicit hue rows. Aliases and special values have separate previews. |
| Guide Colors role data, `SurfacesDemo`, `LineRolesDemo`, `TextRolesDemo` | `tokens/color-surface`, `color-line`, `color-text`; Colors Guide | Complete, independent light/dark documents. Actual surfaces, boundaries and text. Complete composed card and original contextual specimens remain in Guide. |
| Guide Corner Radius `Overview`; retired Border Radius example MDX | `tokens/radius`; `/guide/corner-radius` | Equal-size shapes across the full scale; class, variable and value labels; distinct pill/circle. Guide includes a complete nested card, field and action composition, plus accessible pill/icon links. |
| Guide Elevation `ShadowTokens` / `ShadowScaleDemo` / `SurfaceElevationDemo` | `tokens/shadow`; `/guide/elevation` | Six real raised cards with original role advice, stripe canvas, 48px gaps and 64px bottom room; full light/dark comparisons. Guide retains surface composition and adds hover/focus lift. |
| Reference Font Size `Overview`; Guide Typography `Overview`, `FontWeightTokens` and reference MDX imports | `tokens/font-size`, `font-weight`, `font-family`, `leading`, `tracking`, `text`; `/guide/typography` | Actual-size flowing text, weight/family comparisons, multi-line leading, long tracking phrase and complete treatments. Guide retains body/headings/page-title examples and composed hierarchy. |
| `ThemeNumberVariableTable`; Guide Spacing `Overview` | `tokens/spacing`; `/guide/spacing` | Complete authored/reference-unit table and visible striped gaps; selected Guide rows plus a fully styled form with adjacent HTML/CSS. |
| Guide Sizing `XScale`, Containers size helpers | `tokens/container`; `/guide/sizing` | Comparative width bars and exact value table; measured avatar, fluid content, shrinkable row and selected width caps. |
| Guide Breakpoints `BreakpointVariables` / `BreakpointQueries` | `tokens/breakpoints`; `/guide/breakpoints` | Numerical viewport scale and every exact custom-media condition; keyboard-resizable type example in Guide. |
| Guide Containers, Layout System and Responsive Design | Their existing Guide URLs | Rich media/grid/workspace/gallery scenes retained. Unified sliders support keyboard resizing. Query thresholds remain explicit and independent of container tokens. |
| Guide Motion `AnimationTokens`, `DurationTokens`, `EasingTokens`, `AnimationsOverview` | `tokens/animate`, `duration`, `easing`; `/guide/motion` | Complete animation set, same-path timing comparisons, real token values, paused initial state and Play/Pause/Replay. Guide includes finite card entrances, state transition and native dialog. |
| Preset and Rust-inferred family metadata | `tokens/order`, `families` | First/last visual order with explicit DOM order; complete prefix/property/namespace lookup. No invented default values. |

Paths in the first column are relative to `site/`; Guide-local names refer to `app/[locale]/guide/<topic>/components/`.

## Recipe inventory

All seven public recipe pages mount a scene beside its exact HTML and public-compiler output, before parameter and definition details.

| Route under `/reference/` | Observable result |
| --- | --- |
| `screen-readers` | A native icon button with the accessible name “Add collection”; explanation distinguishes visual hiding from semantic removal. |
| `grid-columns`, `grid-rows` | Six labeled cells arranged into the authored tracks. |
| `grid-column`, `grid-row` | A featured region spans two tracks beside remaining cells. |
| `clamp-lines` | Same paragraph shown complete and limited to three lines. |
| `text-size` | Complete title, body and metadata hierarchy. |
| `animate` token family | Complete animation specimens in `tokens/animate`; finite card entrances in Guide Motion, with playback controls and reduced-motion conditions. |

## Data and implementation boundaries

- `common/foundation-data/tokens.ts` retains preset facts and public Rust family projections. `specimens.ts` and `recipe-specimens.ts` contain presentation, never token parsing or semantic fallback.
- `FoundationTokens` receives explicit Guide keys, or a complete Reference namespace. The palette receives selected rows; number tables receive selected keys. `specimen-content.ts` provides the same selected facts and scene examples for search/Markdown/llms.
- Full values, scopes, dependencies, consumers and stable anchors remain in Reference. UI captions/advice have portable text equivalents without appearing twice below the visual.
- All new presentation uses `components/demo/`, including existing DemoViewport, theme comparison, copy feedback and numeric tables. The old docs-shell Demo branch is not restored.
- No engine or public API changes. Concurrent development-generator, dependency, raw-import and explicit-MDX-import changes belong to another workspace task and are preserved. FoundationTokens imports use its default export when explicit imports are present.

## Verification and evidence

The browser matrix and screenshots are saved with this task's visual artifacts. The matrix records measured CSS viewport widths, modes, anchors, overflow and preview readiness; effect checks inspect rendered CSS in the actual iframe documents.

- Reference: 20 tests pass. New specimen coverage: 6 tests pass. Gallery: 5 tests pass. Syntax migration: 4 tests pass.
- Full static build: 480 pages; 94 referenced public assets verified with no missing or unreferenced assets.
- Site type-check passes. Site lint passes with 0 errors and 156 class-order warnings; unrelated formatting is not changed.
- Browser checks include real preset durations/easing, one iteration for animation specimens, paused initial state, Play/Pause/Replay, actual first/last ordering, empty generated content, and full paragraphs versus three-line truncation.
- Palette copy announces the authored OKLCH value; keyboard Enter in variable mode announces `var(--color-blue-60)`.
- Shadow comparison has six cards in each mode, with distinct generated shadow colors/opacities. Text roles and line roles use their actual properties; full typography is not scaled into fixed-height tiles.

- The complete **43 pages × 3 widths × 2 modes = 258 unique states** were checked at measured 390, 768 and 1280 CSS pixels. No page overflow or missing Reference specimen/family anchors was found. This is structural coverage; the property/effect checks above and saved screenshots provide separate visual evidence.
- Syntax, 17 docs-example tests, 31 llms tests and AI-context checks pass. A first docs-example run timed out in a CLI subprocess under concurrent build load; its complete rerun passes.
- Real system reduced motion was tested for all animation, duration and easing specimens and Guide entrances: `animation-name:none`, opacity 1. The original OS setting was restored. Native dialog Escape restores trigger focus. The responsive gallery changes from 2 to 5 columns at 240/1600px using keyboard slider controls; container resizing leaves the viewport unchanged.
- Both clipboard outcomes were exercised: secure localhost announces the copied OKLCH value; an insecure local origin announces “Copy unavailable” and exposes the exact value. Variable mode also works with Enter. Feedback stays visible while scrolling the full palette.
- Full historical Colors, Corner Radius and Elevation pages were rendered from `fef197a78` in an isolated checkout using installed dependencies. The retained source and styles were unchanged; only dependency resolution/build-root setup was adapted for the local preview. The historical package/API catalog was not rebuilt because symlinked declaration sources prevented discovery; it is not used as historical Guide visual evidence.
- Evidence directory: `~/.codex/visualizations/2026/09/29/01a0ece4-f498-7132-9a43-3675243b1392/foundation-restoration/`. `original/` holds historical captures; `before/` holds the degraded Reference; `after/` holds restored public pages. `matrix.jsonl`, `role-effects.json` and `reduced-motion.json` retain measured results.

### Integration verification

The final shared working-tree build, including the concurrent Next upgrade and explicit MDX imports, passes: 480 static pages and 94 verified assets. Earlier integration attempts encountered Play raw-import and review-page prerender errors while those sources were changing; neither issue reproduces in the final run. Those sources were preserved and were not repaired or reverted by this restoration task.

The restoration was also overlaid onto the isolated `e20a75fed` checkout with its original MDX/global-component setup. Its final 480-page static build and 94-asset postbuild pass independently, including preview-first ordering, formatted HTML, sticky palette feedback and the clipboard capability guard.

The browser automation reported a navigation-time MutationObserver error on pages containing iframes. A plain HTML page containing only a static iframe, with no application scripts, reproduced the same message; a fresh family index produced none. This isolates that message to the browser automation environment. It did not prevent the recorded interactions; no engine/runtime change was made for it.


## 2026-10-28 Guide readability follow-up

The live Colors, Corner Radius and Elevation pages display `v2.0.0-rc.88`; a deployed Git commit was not publicly established. Their useful visual comparisons are the design reference. Current local class syntax and preset facts remain authoritative.

Completed 2026-10-28 02:36:25 UTC. The task ran from 2026-10-27 19:32:58 UTC for **7 hours 3 minutes 27 seconds**, satisfying the requested minimum of seven hours. It updates **28 Guide bodies** and their shared documentation shell/demos.

### Public destinations and reading flow

- `/guide/colors` again includes the complete **23 × 13** fixed palette, including zinc, from shared preset facts. Desktop shows a hue matrix; narrow columns wrap all steps with labels. Copy formats retain original CSS values and variable references, report failure truthfully, and offer a keyboard skip link.
- `/guide/corner-radius` opens with equal-size outline comparisons across all nine tokens plus the equal-sided circle. The highlighted corner isolates curvature; pill and circle have distinct dimensions. Exact values remain available in Reference and portable output.
- `/guide/elevation` opens with all six actual shadows, on identical surfaces with room for the full spread. Guide uses one full-width theme-switchable preview and a two-column comparison when space permits. Reference retains simultaneous light/dark lookup.
- Spacing, Sizing, Typography, Breakpoints, Container queries, Responsive Design, Layout System, Theme and Motion keep practical examples beside concise explanations. Generated details follow the visual lesson; full token lookup remains in Reference.
- Variables and Modes and Cascade Layers now contain working configured examples. Their long reference indexes, and the extraction index, use native disclosures while preserving anchors.
- Rendering Modes starts with delivery choices and the default static path, then runtime and progressive workflows. Browser startup uses compiled programs; server rendering retains manifests. The authored DOM sequence actually inserts its element. Unsupported size/speed claims and duplicate delivery diagrams were removed.
- Global Styles and Authoring Packages reuse the existing executable component examples. Monorepo guidance removes repeated trees and a broken anchor. Native pruning uses framework-neutral HTML with real per-root scanning verification.
- View Transitions uses the existing isolated scenes and shared transition hook. Reduced motion, missing APIs, focus restoration and natural content height apply to the public Guide. Visible native examples connect their actual buttons, templates and return flow; snapshot names are unique.
- AI Coding groups prompts and keeps advanced syntax/maintenance checks in native disclosures. Code Linting reaches the ESLint config before editor and automation details. Route-level Styles starts with a page-owned stylesheet import and keeps independent compiler options at the end.

The documentation shell keeps category labels readable, restores the h2/h3 hierarchy, wraps long inline code, and hides the right contents column when enlarged text needs the space. Installation steps use column-aware native CSS and sequential counters. Hash navigation focuses its destination, opens containing disclosures and respects reduced motion. A media-object example now queries a real ancestor rather than itself. Invisible theme/language/version selects expose visible keyboard focus on their actual control. The header language switch has one named select instead of an inert extra button; the mobile menu exposes its translated name, expanded state and controlled panel.

`site/AI.md` and the Docs Pack now explicitly permit useful complete visual scales in Guide. A lookup migration must preserve those comparisons on the public reading path; an arbitrary small specimen selection is not a substitute. Guide rules also put the reader's working task before machine contracts and preserve heading/body legibility.

### Validation and limits

- Full workspace/site build and subsequent scoped site builds pass. Current output: **430 pages**, with **92 public assets** verified.
- Docs examples: **21**; portable/search/llms: **33**; Reference: **25**; syntax: **14**; specimens: **6**; explicit MDX imports: **2**; atomic authoring: **3**. Site type-check and lint pass; lint retains existing class-order warnings. AI context checks pass.
- The browser matrix covers **172 Guide/Reference destinations × 2 locales × 12 profiles × 2 engines = 8,256 unique states**. Profiles include 390/768/1280px in both modes, 320px, disabled JavaScript and enlarged root text. Earlier width failures were corrected and the affected states replaced by passing captures. All 34 primary Guides were rerun after the shared style fixes; the final transition/container/layout changes have an additional 144-state run. The AI Coding/Code Linting/Route-level Styles editorial pass has another 144 passing states on frozen build-v12.
- **60** functional checks cover copy format/feedback, palette keyboard skipping, native disclosures, theme effects, viewport/container controls, reduced motion, dialog Escape and contents focus. Clipboard tests use a controlled browser implementation; they do not write the system clipboard.
- Native animation playback passes **8** browser/width/mode combinations: authored 150/300ms timings, settled pause, completion and replay after finish. Native article snippets pass **18** browser/width/API-preference combinations. Their mounted Guide scenes pass **36**, including focus return and content-height settling. The authored runtime DOM walkthrough also executes successfully in Chromium and WebKit.
- **26** final preference-control cases cover desktop/system theme propagation, fixed palette values, mobile focus in both modes, version focus, menu state and exact English/Traditional Chinese language navigation. An initial URL glob also matched the departing locale; only the corrected exact-path cases count, with the harness observation retained.
- **9,394** internal Guide links resolve to pages and anchors. Native fragment navigation expands closed reference indexes with JavaScript disabled.
- Continuous browsing completed **634 interactive page visits** across Chromium/WebKit and **120 reading visits** across **88 Guide routes** in one Chromium context. No document-overflow or HTTP errors were recorded. The 16 retained module-load observations comprise the original two uninstrumented messages and 14 explicitly attributed old-document cancellations; no active-document error remained for review. `reading-metrics-final.json` preserves the changing-document measurements without treating them as a controlled leak benchmark.
- Firefox could not launch in this environment because its profile directory was rejected. Chromium and WebKit supply the recorded browser coverage.
- The existing global CSS snapshot already predates committed zinc chroma change `4682a1a43` and also includes concurrent homepage differences. Its first mismatch is the old zinc value. The snapshot was not blanket-updated; actual/delta CSS is saved for review. No engine or preset semantics were changed by this follow-up.
- WebKit continuous-run module-load messages are retained as observations. Matching rapid-navigation diagnostics captured 10 rejected imports after the old document's `beforeunload`; the destination's search still worked. A 20-second navigation run then captured the same Elevation → first-paint path with the rejection explicitly attributed to the old Elevation document after `beforeunload`. The original message has no stack, so its attribution is by matching signature and sequence. Separate 250ms, 2s and 15s navigation controls had no errors. The continuous run was restarted with navigation-boundary instrumentation, preserving the earlier raw observations. Instrumented records distinguish interrupted old-document imports from active-document errors.

Evidence: `~/.codex/visualizations/2026/10/27/01a17ed9-dfd1-73f0-bd8f-d17b1b4ba8ef/guide-refinement/`. `qa-status.json` records the current matrix and continuous-session status; `task-state.json` records the source/build provenance. `primary-v7/`, `primary-v10/`, `primary-v12/`, `secondary-v3/` and `reference-v3/` retain captures. `functional-v7.json`, `transition-examples.json`, `transition-ui.json`, `runtime-walkthrough.json`, `motion-playback-settled.json`, `site-preferences-v12.json`, `mobile-preferences-v12.json`, `header-preferences-exact-url.json`, `foreground-loading.json` and `link-audit.json` hold focused evidence. `css-delivery-v12.json` and its deltas capture final frozen delivery without recompiling a concurrent working-tree manifest; they do not approve or update the repository baseline. The final build-v13 restores unrelated class ordering; `css-delivery-v13-equivalence.json` verifies identical delivery bytes/contracts across all 430 routes compared with tested build-v12. Closed-browser retries from stopping the first harness are excluded from visit counts and documented in `qa-harness-stop-observation.json`.
