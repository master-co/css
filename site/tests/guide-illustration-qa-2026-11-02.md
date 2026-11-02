# Guide illustration expansion and validation

## Scope

Thirty additional figures across 22 Guide articles; 60 PNG assets are 30 light/dark pairs, not 60 figures. Existing figures remain. Integration articles receive no new diagrams; the top-level Installation guide remains eligible.

Editable scene entries live in `site/assets/images/guide-studies/source/`. Shared lessons in `site/content/guide/studies.ts` feed images, captions, independent HTML descriptions, search and Markdown. `GuideStudy` adds no client-side diagram code or preview controls.

## Lessons

| Figure | Guide | Reader inference |
| --- | --- | --- |
| `pipes-and-quotes` | [syntax-tutorial](/guide/syntax-tutorial) | A pipe changes meaning inside quotes |
| `conditions-intersection` | [syntax-tutorial](/guide/syntax-tutorial) | Both conditions must match |
| `inherited-alias` | [theme](/guide/theme) | An inherited alias keeps its computed value |
| `delivery-substitution` | [theme](/guide/theme) | Choose retention and substitution independently |
| `reuse-ownership` | [reusing-styles](/guide/reusing-styles) | A utility owns a class; a mixin fills a selector |
| `independent-parameters` | [reusing-styles](/guide/reusing-styles) | One definition, separate call values |
| `local-color-scheme` | [colors](/guide/colors) | The nearest color scheme selects the paint |
| `palette-or-role` | [colors](/guide/colors) | Separate a fixed hue step from a semantic role |
| `width-cap-growth` | [layout-system](/guide/layout-system) | A width cap leaves room for smaller parents |
| `grid-long-content` | [layout-system](/guide/layout-system) | A shrinking track still needs wrapping text |
| `type-content-height` | [typography](/guide/typography) | Keep the text measure, let the height grow |
| `named-container-target` | [responsive-design](/guide/responsive-design) | A named query can reach past a nearer container |
| `responsive-local-change` | [responsive-design](/guide/responsive-design) | Change the layout without restating the surface |
| `unlayered-obstacle` | [cascade-layers](/guide/cascade-layers) | An unlayered rule sits above normal layered rules |
| `defaults-inheritance` | [global-styles](/guide/global-styles) | Document defaults flow down the DOM |
| `delivery-not-scope` | [route-level-styles](/guide/route-level-styles) | Loading a route stylesheet does not scope its selector |
| `stable-dynamic-value` | [scanning-and-pruning](/guide/scanning-and-pruning) | Change a variable while keeping the rule stable |
| `source-and-policy` | [scanning-and-pruning](/guide/scanning-and-pruning) | Discovery and retention answer different questions |
| `static-late-class` | [rendering-modes](/guide/rendering-modes) | A late class cannot extend a static stylesheet |
| `progressive-known-class` | [rendering-modes](/guide/rendering-modes) | A known class reuses delivered CSS |
| `installation-observation` | [installation](/guide/installation) | Verify the whole path with one small edit |
| `fallback-addition` | [compatibility](/guide/compatibility) | An enhancement starts from a working fallback |
| `migration-local-scope` | [migration](/guide/migration) | Move one component boundary at a time |
| `shared-source-inputs` | [monorepo](/guide/monorepo) | Shared CSS and shared markup are separate inputs |
| `consumer-override` | [authoring-packages](/guide/authoring-packages) | Override the value, keep the component |
| `editor-build-boundary` | [language-service](/guide/language-service) | An editor preview does not deliver a stylesheet |
| `lint-ownership` | [code-linting](/guide/code-linting) | A conflict needs a design choice |
| `inspection-coverage` | [ai-coding](/guide/ai-coding) | A checked set is smaller than the whole project |
| `transition-name-uniqueness` | [view-transitions](/guide/view-transitions) | Reuse an identity across views, not within a view |
| `language-and-delivery` | [introduction](/guide/introduction) | The class vocabulary survives a delivery choice |

## Evidence and visual decisions

- Existing article examples and the passing documentation-example suite establish the class, source, project and delivery semantics; no engine or public API changes were made.
- The palette uses `generatePresetCSS` for actual `bg-blue-60` and `bg-surface-base` paint. The local scheme example intentionally compares two schemes; the site frame still follows the active theme.
- Padding and font-size comparisons use actual CSS geometry at a 16px root. Equal widths isolate wrapping or width caps. Internal heights follow content; drawing height is the fixed 720 × 480 canvas.
- The named-container drawing pairs the query and ancestor through position, the literal name and blue marks. It does not draw an execution arrow through the nested containers.
- Utility and mixin examples retain the caller's selector in the expanded result. The parameter example matches `action-size()` and `action-size(3rem)` from the article, including minimum height and half-height inline padding.
- Static and progressive drawings explicitly assume the stated source/manifest coverage. A late class in the static example is the valid preset `p-lg`, absent from build inputs; it is not an unknown-token error.
- Scope, comparison, matrix, tree, sequence and identity drawings have separate meanings. Colors identify relationships, not decoration. Captions describe measurement washes so they cannot be mistaken for generated paint.
- All 60 initial variants were reviewed on six paired contact sheets. Refined utility/mixin, parameter, palette and named-container variants were reviewed again; the installation result now shows the measured padding difference. Actual article-scale desktop/dark and mobile/light specimens were also inspected.

## Shared repairs

- Removed the unreferenced legacy `contents.svg` and `search.svg`; current controls use their existing icon components.
- Replaced equivalent raw spacing, duration, weight and size values with existing tokens, and the pixel-width test class with `w(240)`. No rem size was converted to a pixel value.
- Remaining intentional geometry is approved by exact, escaped value patterns in specific files, each with its reason. The raw-value rule remains enabled; neither wildcard values nor blanket file disables were introduced.
- Footer columns now fall back to the intrinsic single-column layout below 18rem of available width. At 320px with doubled root text, Trademark Policy wraps within the page.
- Long technical identifiers in tray captions use `overflow-wrap:anywhere`, preserving the complete caption at 200% text without clipping or widening the document.
- Titles, short navigation subjects, category names, link labels and dictionary keys use sentence case; proper names and identifiers retain their spelling. No URL redirects were added.
- Five stale design-system links now reach the current typography, AI coding, language-service, container-size and layout-verification sections.

## Validation

- Production preparation, llms generation, Astro build and static postbuild pass: 241 HTML routes; 85 referenced public assets, with no missing or unused assets.
- Site lint passes with zero errors and zero warnings. Type-check, MDX import validation (2), documentation examples (30), Reference tests (27), LLM/search tests (35), Demo tests (3), CSS-variable helper tests (2) and AI context checks pass.
- The exact CSS contract passes for all 241 routes, 121 deduplicated delivery contracts and 2,571 exact segments; review and refresh rationale is in `css-contract-qa-2026-11-02.md`.
- All 224 browser profiles pass: 132 English Guide profiles at 390/768/1440px in both themes, 44 Traditional Chinese narrow profiles, 36 shared-page profiles and 12 320px/200%-text profiles. Each new figure has one visible theme asset, a 3:2 ratio and a keyboard-operable full text description. Shared pages cover home, Blog, Brand, design-system overview/motion, Reference and a Vite integration.
- The whole-site link and asset-path audit checks 241 HTML routes and 12,142 local links, with zero missing destinations, anchors or image files. No redirects are used.
- Another 14 checks pass: ten manual light/dark selections across five Guide routes, plus four authoring-handbook profiles confirming the token-sized avatar remains 48 × 48px and circular at 390/1440px in both themes.
- Search was also exercised through the live dialog using a new figure title; the corresponding Guide article is found in both English and Traditional Chinese sessions.

Working evidence: `/tmp/docs-illustration-expansion/` contains the scene contact sheets, 120 actual figure screenshots, browser/links JSON and command logs. These temporary artifacts supplement the committed sources and this record. Browser assertions check mechanics and layout, not measured reader comprehension or accessibility certification. Raster text scales with the figure; the independent HTML description remains available for magnification and keyboard access.
