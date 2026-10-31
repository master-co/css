# Guide, Reference and Blog quality review — 2026-10-31

Completed the current 137 canonical URLs: 89 Guide pages (including the overview and all 49 installation pages), 44 Reference documents plus its overview, and two published Blog articles plus the Blog index. Each URL has its own task, decision, source evidence and validation record in `site/tests/docs-quality-review.json`. The old 359-page report remains historical. The unpublished `blog/v2` scaffold remains unpublished.

## Reference consolidation

Twenty package API pages, three CLI pages and sixteen MCP pages now lead through three catalogs: `/reference/packages`, `/reference/tools/cli`, and `/reference/tools/mcp`. Reference has 44 documents. Package exports and the API census supply import paths and symbol discovery; public help and `tools/list` supply commands and tool names. Full declarations and schemas are no longer generated for the website. The catalogs link to actual source on the verified `master-co/css` `rc` branch.

The production audit found all 39 retired paths absent from HTML, Markdown, search, sitemap and llms output, along with four earlier retired MCP paths. No redirects were introduced. All 6,382 locale-specific identifier destinations resolve to real anchors. Design System declaration examples use small public type references and no longer load the full API catalog.

## Editorial and illustration changes

Corrected invalid-value emission claims, hydration timing, independent pruning scopes, route stylesheet ownership, static argument exceptions, migration cascade/radius/preprocessor examples, framework startup gaps and installation asset publication. Shared summaries now match the tasks they describe. Long palette advice that repeated the same instruction hundreds of times was removed; exact values and dependencies remain.

Added editable pruning, route ownership and Next.js execution-boundary scenes. Redrew runtime, progressive and hydration as 3:2 scenes (600 × 400 editable SVG; 1200 × 800 PNG), with moderate whitespace, a compact 20px primary / 18px secondary type scale and identical light/dark geometry. All six have coordinated SVG/PNG light and dark versions, captions and text equivalents in HTML, search and portable output. One composition scales proportionally to fill the article media area, without a width cap or separate centered panel. Native text descriptions and system-theme artwork also work without JavaScript.

## Validation

- Complete workspace and website build passed; the final site build produced 368 static HTML pages and verified 91 referenced public assets.
- All 137 URLs passed 390/768/1280px in light and dark: 822 profiles, with 480 loaded demo-frame instances. Openings were inspected individually; meaningful figures and specimens had additional inspection. Automated captures were not used as a substitute for reading.
- Production cross-page checks passed for 26,224 internal links/anchors and 6,382 searchable identifier destinations in both locale outputs.
- Reference 24, documentation examples 26, llms 33, MDX imports 2 and syntax 14 tests passed. Site lint, type-check and AI context checks passed.
- Browser interactions passed: 48 demo cases, 20 search cases, 13 reading/clipboard cases and 8 no-JavaScript illustration cases.
- Actual production fixtures passed for React/Vue/Lit (5), Webpack/Rspack/Rsbuild (6), Next.js with Webpack (3) and Nuxt (3). The authored React Router and TanStack Start startup snippets also passed separate Vite client/SSR builds without HTML-entry injection.

The reproducible browser and link checks are `site/tests/docs-quality.e2e.mjs`, `site/tests/docs-quality-links.mjs` and `site/tests/docs-illustration-fallbacks.e2e.mjs`. Local captures and detailed results are under `site/test-results/docs-quality-production/`.

## Existing failures and coverage limits

- **Next.js Turbopack integration:** with installed Next.js 16.4.3, the production fixture reproduces a generated `.master/stylesheets/...-entry.css` resolution failure. All three Webpack modes pass. Installation pages and the Blog now disclose the limitation and verified build path. Core integration code was not changed.
- **Global exact CSS snapshot:** `test:css-contract` stops at a pre-existing manifest difference: `--opacity-media-ring` is already present in `HEAD:site/styles/docs-shell/materials.css` but absent from the approved snapshot. The snapshot also spans unrelated homepage work, so it was not regenerated to accept that difference. CSS variable-reference unit checks pass. The new illustration sizing/theme rules are intentional site presentation changes, covered by the production browser checks.
- Native Angular/.NET/CMS/Rails/Laravel/Svelte/Storybook environments were not all run end to end. Their instructions and source contracts were read, and every article received the six-profile browser checks. The two router bootstrap fixtures test the client/SSR import boundary, not the framework CLIs. Browser coverage is Chromium, not a certification of every browser or a remote CDN release.

## Independent page decisions

The JSON ledger contains the reader task, evidence and per-page results. Each row below is a separate completed review; “no change needed” means the page was read and checked.

| URL | Decision | Browser |
| --- | --- | --- |
| `/guide/ai-coding` | Renamed the generic client configuration example; separated utility recipes from CSS mixins. | 6/6 |
| `/guide/authoring-packages` | Retained executable source-package recipe; clarified production output checks and standalone inspection limits. Added production delivery verification; an empty standalone inspection is not proof that package CSS is unused. | 6/6 |
| `/guide/benchmarks` | Qualified CSSOM and runtime tradeoffs; the historical sample size is no longer a general site-size claim. | 6/6 |
| `/guide/breakpoints` | Content-first threshold advice and custom-media versus sizing-token distinction are consistent. Reviewed custom media, viewport versus container boundaries and the resize demo; no body change needed. | 6/6 |
| `/guide/cascade-layers` | Normal utility override is demonstrated; importance and unlayered CSS are delegated to the contract. Reviewed the live padding comparison and shared contract; corrected token retention and keyframe placement. | 6/6 |
| `/guide/code-linting` | Added the ESLint dependency; canonicalization prose now matches preferStaticUtilities. | 6/6 |
| `/guide/colors` | Complete palette and adaptive roles retained; alias inheritance, system/manual schemes and conditional contrast claims are explicit. Read palette, role, contrast and manual-theme guidance; retained the real palette and composition demos. | 6/6 |
| `/guide/compatibility` | Corrected functional-utility terminology and used a defined preset token in the CSS module example. Removed the false invalid-value rejection guarantee; fixed the CSS Modules color token and utility terminology. | 6/6 |
| `/guide/containers` | Replaced the main ellipsis with two complete child regions and added an observation procedure at 28rem. Replaced the main empty specimen with two real regions and explained the 28rem observation. | 6/6 |
| `/guide/corner-radius` | Retained complete radius comparison and pills/circles demo; dimensions are independent of radius. Reviewed the equal-size corner, pill and circular specimens; no change needed. | 6/6 |
| `/guide/elevation` | Full six-level comparison retains room for shadows; state and adaptive scheme behavior match preset data. Reviewed six real shadow levels, surface roles and interaction advice; no change needed. | 6/6 |
| `/guide/flash-of-unstyled-content` | Simulated comparison, hidden-root startup failure and disabled-JavaScript limitation are explicit. Reviewed the visual comparison, runtime pending behavior and no-JavaScript limitations; no change needed. | 6/6 |
| `/guide/global-styles` | Read all examples and the maintenance composition; retained the existing working demonstrations. | 6/6 |
| `/guide/installation/cdn` | Reviewed matching release assets, runtime pending behavior and the need to verify the published program contract. | 6/6 |
| `/guide/installation/cli` | Reviewed output publication, explicit source scope and watcher behavior; updated command catalog links. | 6/6 |
| `/guide/installation/integrations` | Reviewed every integration destination and the static-default explanation; retained the existing directory. | 6/6 |
| `/guide/installation` | Reviewed detection, CSS entry and complete-class requirements; broadened the shared installation summary. | 6/6 |
| `/guide/installation/angular` | Updated the CLI invocation and current app.html filename; retained explicit generation and watch steps. | 6/6 |
| `/guide/installation/angular/runtime` | Corrected the native base import, current template filename and custom-program compilation boundary. | 6/6 |
| `/guide/installation/aspnet-core` | Added relative asset base, a non-destructive output directory and the explicit Vite build step. | 6/6 |
| `/guide/installation/aspnet-core/runtime` | Added relative asset URLs and explicit asset publication; retained host ownership of HTML. | 6/6 |
| `/guide/installation/astro` | Read installation, entry and complete-class steps; no change needed. | 6/6 |
| `/guide/installation/astro/progressive` | Read explicit progressive mode and first-response CSS handoff; no change needed. | 6/6 |
| `/guide/installation/astro/runtime` | Read explicit runtime mode and its distinction from middleware pre-rendering; no change needed. | 6/6 |
| `/guide/installation/blazor` | Added deployment/build steps and preserved the framework bootstrap script. | 6/6 |
| `/guide/installation/blazor/runtime` | Added relative assets and build steps; explicitly retained _framework/blazor.web.js. | 6/6 |
| `/guide/installation/express` | Added explicit Vite build/watch and relative resource delivery without clearing host assets. | 6/6 |
| `/guide/installation/express/progressive` | Read server creation/disposal and HTML injection; added the separate client asset build and resource publication. | 6/6 |
| `/guide/installation/laravel` | Read installer changes, Blade classes and host build ownership; no change needed. | 6/6 |
| `/guide/installation/lit` | Read the full shadow stylesheet import example and verified its production fixture; no change needed. | 6/6 |
| `/guide/installation/nextjs` | Added complete asynchronous config, CSS and layout examples; documented the reproduced Turbopack asset failure. | 6/6 |
| `/guide/installation/nextjs/progressive` | Added complete async config and clarified the request-time boundary; documented the bundler limitation. | 6/6 |
| `/guide/installation/nextjs/runtime` | Added complete async config and CSS loading examples; documented the bundler limitation. | 6/6 |
| `/guide/installation/nuxtjs` | Corrected app/app.vue, explicitly loaded the root CSS entry and added production delivery checks. | 6/6 |
| `/guide/installation/nuxtjs/progressive` | Corrected the application file and root CSS alias; added deployment and production verification. | 6/6 |
| `/guide/installation/nuxtjs/runtime` | Corrected app/app.vue and explicit stylesheet loading; separated runtime-only verification from SSR CSS. | 6/6 |
| `/guide/installation/php` | Added explicit Vite build/watch, relative assets and non-destructive output. | 6/6 |
| `/guide/installation/php/runtime` | Added explicit asset build and publication with relative resource URLs. | 6/6 |
| `/guide/installation/rails` | Added relative resource URLs, asset build/watch and host-output preservation. | 6/6 |
| `/guide/installation/rails/runtime` | Added asset publication and relative resource delivery; retained Rails page lifecycle ownership. | 6/6 |
| `/guide/installation/react` | Read all setup steps and verified the authored production fixture; no change needed. | 6/6 |
| `/guide/installation/react/runtime` | Removed an unsupported Next performance recommendation and explained the SSR choice by need. | 6/6 |
| `/guide/installation/react-router` | Read installer and CSS entry steps; no change needed. | 6/6 |
| `/guide/installation/react-router/runtime` | Added the guarded virtual runtime import and types so framework SSR does not skip browser startup. | 6/6 |
| `/guide/installation/rsbuild` | Read the setup and verified a real production build; no change needed. | 6/6 |
| `/guide/installation/rsbuild/runtime` | Read explicit runtime setup and verified a real production build; no change needed. | 6/6 |
| `/guide/installation/rspack` | Read the setup and verified its real production fixture; no change needed. | 6/6 |
| `/guide/installation/rspack/runtime` | Read explicit runtime configuration and verified the production fixture; no change needed. | 6/6 |
| `/guide/installation/shopify` | Added relative resource URLs, non-destructive output and an explicit build before theme publication. | 6/6 |
| `/guide/installation/storybook` | Read preview setup, native CSS context and separate Vite ownership; no change needed. | 6/6 |
| `/guide/installation/svelte` | Corrected manifest-loader wording to the actual program-loader contract. | 6/6 |
| `/guide/installation/tanstack-start` | Read the complete setup and checked the framework’s build-tool boundary; no change needed. | 6/6 |
| `/guide/installation/tanstack-start/runtime` | Added the guarded virtual runtime import and type reference to preserve server/client separation. | 6/6 |
| `/guide/installation/vite` | Read installer output, entry and production behavior; verified current installation fixtures. | 6/6 |
| `/guide/installation/vite/runtime` | Read explicit mode selection, stylesheet loading and default program delivery; no change needed. | 6/6 |
| `/guide/installation/vscode` | Read the full extension setup, string completions and sort-on-save instructions; no change needed. | 6/6 |
| `/guide/installation/vuejs` | Read setup and single-file component usage; verified the authored production fixture. | 6/6 |
| `/guide/installation/vuejs/runtime` | Read explicit runtime setup and verified its production fixture; no change needed. | 6/6 |
| `/guide/installation/webpack` | Added the missing HTML plugin, native CSS handling, entry and explicit serve/build commands. | 6/6 |
| `/guide/installation/webpack/runtime` | Added complete HTML/CSS entry configuration and serve/build commands; verified the real bundle. | 6/6 |
| `/guide/installation/wordpress` | Added relative asset delivery, non-destructive output and an explicit Vite build. | 6/6 |
| `/guide/installation/wordpress/runtime` | Used wp_enqueue_script_module, stated the 6.5 minimum, and explained pending/no-JavaScript behavior. | 6/6 |
| `/guide/introduction` | Task-led token/native CSS example, evidence limits and delivery choice remain coherent. Read the full introduction and inspected its real panel; no change needed. | 6/6 |
| `/guide/language-service` | Verified settings against the extension configuration and kept ESLint responsibilities distinct; no change needed. | 6/6 |
| `/guide/layout-system` | Corrected divisibility advice: four/eight support halves and quarters, twelve also supports thirds. Corrected the claim that every four/eight/twelve-column grid supports thirds. | 6/6 |
| `/guide/mcp-server` | Separated the generated server registration from the manually added startup timeout; updated catalog links. | 6/6 |
| `/guide/migration/bootstrap` | Explained that unlayered Bootstrap cannot be lowered by import order; supplied an explicit layered import. | 6/6 |
| `/guide/migration/css` | Matched the converted radius class to the authored .75rem project token. | 6/6 |
| `/guide/migration/css-in-js` | Clamped the meter value and added progress semantics; broad visual defaults now use the defaults layer. | 6/6 |
| `/guide/migration/material-ui` | Corrected the radius translation for MUI’s multiplier and linked its official contract. | 6/6 |
| `/guide/migration` | Moved the custom-engine forwarding example into Rendering Modes and retained its old anchor as a pointer. | 6/6 |
| `/guide/migration/sass` | The coexistence example now imports compiled legacy.css and explains the preprocessing boundary. | 6/6 |
| `/guide/migration/tailwindcss` | Separated compiler outputs, removed the unsupported container class and added bounded progress semantics. | 6/6 |
| `/guide/monorepo` | Independent app roots and shared CSS import order remain clear; fixture exercises app-root overrides. Reviewed workspace selection, package boundaries and examples; made the summary describe the task. | 6/6 |
| `/guide/motion` | Finite entrances, shorthand reset ordering and managed keyframe policy are explicit; live demos remain the teaching medium. Read the shorthand, longhand and keyframe guidance; kept the working playback and native dialog demos. | 6/6 |
| `/guide/native-css-pruning` | Added per-file/import/resource illustration; made each root’s @source explicit and connected the referenced token/keyframe stylesheet. Added the per-file graph; made independent source scopes explicit and fixed reference reachability. | 6/6 |
| `/guide` | Read each section and checked the live inventory, category view and Reference handoff. | 6/6 |
| `/guide/preload-critical-resources` | Removed idle-after-paint guarantee and distinguished deferred-engine requests from application-module preload. Removed an after-paint guarantee and a blanket modulepreload prohibition; qualified eager engine/program loading. | 6/6 |
| `/guide/rendering-modes` | Checked deferred-engine and hydration boundaries against runtime core; updated API source destinations. Moved the engine-forwarding example here. Redrew all three figures at 3:2 with moderate whitespace and consistent 20/18px labels; inspected 18 light/dark figure captures at 390/768/1280px, preserving full media width and text equivalents. | 6/6 |
| `/guide/responsive-design` | Actual viewport and ancestor-container previews explain the two boundaries; ranges and thresholds have generated CSS. Read condition syntax and responsive examples; retained the working gallery and controls. | 6/6 |
| `/guide/route-level-styles` | Added compilation/delivery illustration; clarified that route imports do not isolate selectors and native pruning can remove local rules. Added an ownership diagram; clarified that import delivery does not isolate selectors or force preservation. | 6/6 |
| `/guide/scanning-latent-classes` | Complete-string task and diagnostic sequence remain focused; updated MCP catalog destination. Read discovery, extraction and troubleshooting contracts; updated CLI links to the consolidated command section. | 6/6 |
| `/guide/sizing` | Fluid caps, fixed geometry and flex minimum sizing are explained with generated CSS; container thresholds stay independent. Read sizing and logical-axis examples and inspected the live measured avatar; no change needed. | 6/6 |
| `/guide/spacing` | Working form connects spacing hierarchy to a shared scale; logical px/py and explicit native units are distinguished. Read all comparisons and token guidance; existing striped specimens explain the actual distance. | 6/6 |
| `/guide/syntax-tutorial` | Qualified static argument guidance with the verified single-declaration symbolic-var exception. | 6/6 |
| `/guide/theme` | Token lifecycle, native aliases, static/inline independence and explicit query thresholds agree with contracts and compiler examples. Read the full token workflow and real card demo; removed breakpoints from the @theme summary. | 6/6 |
| `/guide/typography` | Kept treatment/property distinction and font namespace ambiguity; clarified that tiny scale steps do not guarantee readability. Qualified the tiny-scale guidance so it does not imply a readability guarantee. | 6/6 |
| `/guide/variables-and-modes` | Kept the working token and nested-scheme lesson; complete lookup remains with Reference. Completed the derived-token and Shadow DOM examples, cleaned malformed indentation and clarified the summary. | 6/6 |
| `/guide/view-transitions` | Unique snapshot names, root pseudo-elements, focus restoration and fallback/reduced-motion behavior remain demonstrated. Read same-document and navigation examples, naming boundaries and reduced-motion behavior; no change needed. | 6/6 |
| `/blog/bootstrapping-master-css-with-vite` | Checked the full argument and setup against integration examples; corrected startup versus deferred hydration timing. Next.js has a new build/request-time boundary figure. Corrected hydration timing and source-catalog links; retained the mode comparison table and linked the deeper delivery workflow. | 6/6 |
| `/blog/master-css-next` | Checked the full argument and setup against integration examples; corrected startup versus deferred hydration timing. Next.js has a new build/request-time boundary figure. Added the execution-boundary diagram; corrected hydration timing, async config and the bundler support claim. | 6/6 |
| `/reference/screen-readers` | Read purpose, real button, parameter absence, preset definition and scope; shortened the duplicated summary. | 6/6 |
| `/reference/grid-columns` | Read the complete six-cell example, integer parameter, generated CSS and source definition; shortened the summary. | 6/6 |
| `/reference/grid-rows` | Checked the real placement order, positive count, complete definition and generated output; shortened the summary. | 6/6 |
| `/reference/grid-column` | Read the two-track feature example, exact-line alternative and source expansion; shortened the summary. | 6/6 |
| `/reference/grid-row` | Read the two-row feature example and both span declarations; shortened the summary. | 6/6 |
| `/reference/clamp-lines` | Read the WebKit pattern, positive count, full text availability and preset definition; shortened the summary. | 6/6 |
| `/reference/text-size` | Read the composition, string key, fallback and replacement rules; shortened the summary. | 6/6 |
| `/reference/rules/declarations` | Read every local include; corrected @utility ownership and replaced manually incomplete generated CSS. | 6/6 |
| `/reference/rules/selectors` | Verified emitted selectors; replaced false :rtl/:ltr aliases with native :dir() while retaining the old anchor. | 6/6 |
| `/reference/rules/conditions` | Removed an empty upgrade section while preserving its anchor; corrected the fixed red alias explanation. | 6/6 |
| `/reference/rules/modes` | Completed derived-token and Shadow DOM examples and clarified readable formatting. | 6/6 |
| `/reference/rules/layers` | Corrected delivered-native token roots and keyframe layer/condition preservation. | 6/6 |
| `/reference/rules/extraction` | Read the complete extraction contract and examples; no semantic change needed. | 6/6 |
| `/reference/tokens/families` | Read every family mapping, example and shared-prefix branch; retained the generated inventory. | 6/6 |
| `/reference/tokens/animate` | Read every value, live example and resource contract; kept the paused/reduced-motion specimen. | 6/6 |
| `/reference/tokens/color` | Read the palette values and aliases; removed hundreds of repetitive advice bullets and retained the copyable palette. | 6/6 |
| `/reference/tokens/color-line` | Read all three roles, consumer mappings and equal-width boundary specimens; no change needed. | 6/6 |
| `/reference/tokens/color-surface` | Read every value and consumer and compared real surfaces; retained role guidance without a contrast guarantee. | 6/6 |
| `/reference/tokens/color-text` | Read every text role and dependency and inspected the real text specimens; no change needed. | 6/6 |
| `/reference/tokens/container` | Read every length, dimension consumer and relative-size specimen; no change needed. | 6/6 |
| `/reference/tokens/duration` | Read every value, delay/duration consumer and live travel specimen; removed irrelevant contrast boilerplate. | 6/6 |
| `/reference/tokens/easing` | Read all curves and consumers, including overshoot; removed irrelevant contrast boilerplate. | 6/6 |
| `/reference/tokens/font-family` | Read all three stacks and consumer mapping; retained native font availability guidance. | 6/6 |
| `/reference/tokens/font-size` | Read all 16 sizes and the font family branch; removed irrelevant contrast boilerplate. | 6/6 |
| `/reference/tokens/font-weight` | Read all nine values, actual specimen and face-availability caveat; removed irrelevant contrast boilerplate. | 6/6 |
| `/reference/tokens/leading` | Read all five values, actual multi-line specimens and consumer; removed irrelevant contrast boilerplate. | 6/6 |
| `/reference/tokens/order` | Read both extreme order tokens and the explicit DOM-order comparison; removed irrelevant contrast boilerplate. | 6/6 |
| `/reference/tokens/radius` | Read all nine values and physical/logical consumers; retained the equal-geometry corner specimen. | 6/6 |
| `/reference/tokens/shadow` | Read all six complete shadows and their paired light/dark colors; retained the spread-room specimen. | 6/6 |
| `/reference/tokens/spacing` | Read all 12 values and every consumer; retained the striped scale and real form example. | 6/6 |
| `/reference/tokens/text` | Read all primary and companion declarations; added direct recipe guidance and a Typography handoff. | 6/6 |
| `/reference/tokens/tracking` | Read all seven values and the equal-phrase specimen; removed irrelevant contrast boilerplate. | 6/6 |
| `/reference/tokens/breakpoints` | Read all 17 conditions; corrected the initial browser font-size basis and linked the official media-query rule. | 6/6 |
| `/reference/directives/entry` | Read marker, path bases, prepared-file delivery and host-transform boundaries; no change needed. | 6/6 |
| `/reference/directives/reference` | Read local/package references, ownership and scoped-host delivery; no change needed. | 6/6 |
| `/reference/directives/theme` | Read modifiers, native keyframes and custom media; no additional figure needed. | 6/6 |
| `/reference/directives/definitions` | Read every recipe, argument, replacement, ambiguity and contents rule; retained complete executable examples. | 6/6 |
| `/reference/directives/source` | Read ordered scope and path rules; no change needed. | 6/6 |
| `/reference/directives/candidates` | Read precedence and exact quoted-name rules; no change needed. | 6/6 |
| `/reference/directives/variant` | Read the complete selector/media/supports example and false-condition behavior; no change needed. | 6/6 |
| `/reference/directives/preserve` | Read preserve/prune precedence and package ownership; linked to the illustrated pruning workflow. | 6/6 |
| `/reference/tools/mcp` | Consolidated 16 tools; names come from tools/list, full schemas stay in the server and verified GitHub source. | 6/6 |
| `/reference/tools/cli` | Consolidated three commands; read actual help, verified basic calls, and linked source and complete installed help. | 6/6 |
| `/reference/packages` | Replaced 20 declaration pages with one census/export-driven catalog; retained package and qualified-symbol search anchors. | 6/6 |
| `/reference` | Reduced the live directory to 44 entries and made the Tools/API description point readers to source. | 6/6 |
| `/blog` | Reviewed both cards, dates, authors and current links; no index change needed. | 6/6 |
