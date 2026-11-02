# View transitions Guide verification — 2026-11-02

## Result and intended changes

The Guide recommends layout utilities in markup, stable capture identities in native styles, and feature-owned native CSS for transition pseudo-elements. It retains a compiled Master CSS equivalence example and explains the document-root requirement and static-scanning boundary. The complete same-document example includes image preparation, focus, reduced motion, skipped transitions and update errors. The cross-document recipe uses actual links and CSS opt-in; no new public navigation demo routes were added.

The embedded article demo previously resized its iframe from 494px to 702px during a nominal 500ms transition. Browser probes observed `ready` followed by cancellation at approximately 54ms. Holding the viewport at 640px allowed opening and returning to finish at approximately 560ms and 531ms. Both demo wrappers now use viewport sizing, with internal scrolling for longer content. Ordinary user resizing can still skip an animation by platform design.

Both React scenes use route-owned native transition CSS. Article IDs supply inline `viewTransitionName` values, `.article-capture` supplies the `article` transition class, and the article groups use 500ms ease-in-out timing, matching the public CSS recipe. The shared hook no longer adds classes to the document root; it reports actual update errors separately from animation skips. There are no Master CSS package, syntax or public API changes.

## Figures and visual review

Five figures are embedded: the retained named-captures composition, plus capture-lifecycle, capture-identity, capture-tree and capture-navigation. Each has a 720×480 scene, paired 1440×960 PNGs, editable source under `site/assets/images/view-transitions/source/`, and an independent HTML/portable text explanation. The former `transition-name-uniqueness` GuideStudy and its unused source/assets were replaced by the richer identity and grouping figure.

Reviewed both theme renders and article-scale crops. The lifecycle distinguishes DOM commitment from the visual handoff; identity pairs use matching labels and connecting lines, with an enclosing styling family; duplicate identity is isolated as an invalid state; the tree shows old/new layers apart explicitly rather than implying that the DOM contains two interactive copies. The navigation figure contrasts one document boundary with two opted-in documents.

Browser checks captured all five figures at 390, 768 and 1280px in both schemes (30 crops), plus six article-detail states. Each figure exposes one visible theme image, preserves its 3:2 ratio and fits its container. Six 200% root-text profiles found no horizontal overflow in the article main region. Small bitmap labels scale on mobile; the HTML caption and expandable text explanation remain independently readable. This was author visual review, not observed reader research.

Demo references: `controls.css` `.ui-button` and `surfaces.css` `.ui-sheet[data-elevation="1"]`, inspected in the design-system gallery. The rendered default button and demo button both measured 13.5px type, weight 460, height 38px and radius 6px. Sheets, regular headings, contours and light/dark states retain the existing system. Intended differences are the photos, article layout and fixed scrollable viewport; there are no added ornamental controls.

Temporary visual evidence is in `/tmp/vt-visual/` (including figure crops, detail states, system controls and measurement report). Sources and final figures are retained in the repository.

## Executed checks

- `node --test site/tests/view-transitions.e2e.mjs`: 17 passing cases in Chromium and 17 in WebKit. Covers embedded/standalone, 390/768/1280px, light/dark, both articles, keyboard focus, real intermediate animations, fixed viewport height, fallback, duplicate names, rapid input and preference changes.
- `node --test site/tests/view-transition-snippets.e2e.mjs`: seven passing cases in each engine, executing the actual article fences on a temporary HTTP server. Covers native/no-API/reduced/broken-image paths, one reported update failure without retry, and real cross-document navigation with and without reduced motion.
- Additional timing assertions passed in both engines: route-owned CSS reaches named pseudo-elements with a computed 0.5s duration.
- Production output served independently: six focused Chromium cases and one WebKit article case passed, including native animation timing and fallback/error paths.
- Documentation examples: 30 passed. MDX imports: two passed. Portable/search/llms content: 37 passed, including all five figure lessons and the native CSS recipes.
- Site lint and type-check passed. AI/source budgets passed. `git diff --check` passed.
- Full `bun run build:site`, followed by a site build after the final article refinements: 241 routes built; the public-asset check passed for 85 referenced assets.
- An HTML audit checked 80 Guide/Reference links and anchors across the English and Traditional Chinese article routes with no missing destinations.

To rerun browser checks on another server, set `MASTER_TRANSITION_URL`; select WebKit with `MASTER_TRANSITION_BROWSER=webkit`. The snippet tests start and close their own local server.

## Remaining full-site limitation

`test:css-contract` passes its two variable-parser tests but the exact full-site snapshot differs. The first reported mismatch is `/blog/bootstrapping-master-css-with-vite`, with a native component-layer segment formatted as `@layer components{` instead of `@layer components {`. This workspace contains concurrent documentation and shared-style work. The transition routes also intentionally replace generated transition utility selectors with native CSS and inline identities. The full snapshot was not regenerated to absorb unrelated changes; the scoped production browser assertions above verify this task's emitted styles and behavior.
