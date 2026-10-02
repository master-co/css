# Foundation visual restoration

Status: restoration complete; final shared-workspace and isolated static builds both pass. Baseline: `fef197a78`. Integration base: `e20a75fed` (unified Demo components). The Reference inventory remains 90 documents; no retired property routes or redirects are restored.

## Ownership and source inventory

Migrate content, presentation and interaction together. A lookup page deserves a designed visual explanation. A teaching selection may be rich and self-contained; its size is determined by the task, not an arbitrary specimen limit. Before removing a presentation, mount its replacement on its public destination and verify its appearance and behavior.

| Original source at `fef197a78` | Public destination | Preserved or restored presentation |
| --- | --- | --- |
| `docs-shell/components/ColorPalette{,Item}.tsx`; Guide Colors `PresetThemeColors`, `NaturalMaterials` | `/reference/tokens/color`; `/guide/colors` | Complete 30 × 13 fixed hue matrix; hue names and step labels; CSS value and variable copy. Guide uses three explicit hue rows and retains the natural-material compositions. Aliases and special values have separate previews. |
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
