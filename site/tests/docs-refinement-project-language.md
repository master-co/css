# Project and language documentation refinement

Continuation of [the documentation refinement review](./docs-refinement.md).
The route inventory in `docs-refinement.json` remains authoritative.

## Project styling guide review

Theme, Variables & Modes, Global Styles and Cascade Layers are reviewed, bringing
this pass to **220/359**. Five site-owned configured recipes cover tokens, shared
spacing, root modes, component states and normal utility overrides. The Design
System exposes each recipe and its Guide source. Literal configuration and HTML
produce both the isolated preview and complete portable generated CSS.

All four complete desktop/light and mobile/WebKit/dark reading views were inspected.
The full six-project matrix passed **54/54** native behavior, anchor, keyboard,
search, overflow and runtime checks. All five gallery specimens, switched modes
and search compositions were inspected at 390/768/1280px in both themes.

Visual inspection found low contrast in the fixed blue token label on a dark card.
Its semantic alias now uses the preset link-text color: measured contrast is
**6.11:1 light / 6.99:1 dark**. The final affected matrix passed **18/18**, including
a native contrast assertion and refreshed gallery screenshots in all six variants.
Evidence: `refinement-project-complete` and `refinement-project-contrast`.

Reference **14/14**, documentation examples **6/6**, LLMs **20/20**, prepare-app,
type-check and actual LLM generation pass. Full site lint on frozen source passed
with zero errors and 31 warnings outside this batch; the final contrast refinement
also passes scoped lint. Production build and CSS contract review remain pending.

The two formal Variables & Modes and Cascade Layers rules are now in progress;
137 other documents remain pending. Their initial review found incomplete namespace
consumer extraction, a duplicate summary anchor, and overly broad cascade wording.

## Formal modes and layers review

Both formal project rules are reviewed, bringing this pass to **222/359**.
Cascade wording now distinguishes normal and important layer precedence, regular
unlayered declarations, and the stable five-layer order. Existing anchors remain;
the duplicate summary heading has a separate final checklist ID. Literal configured
HTML now produces complete current CSS, replacing four obsolete cached CSS files.
The site-owned renderer supplies public native-declaration capabilities.

Namespace consumers come from the actual registry, including aliases and namespaces
without preset values. A shared server-rendered table uses native keyboard disclosure
for long lists while retaining every key in HTML and portable exports. The Design
System documents this table, its variants, and literal configured examples. A scoped
hydration exception preserves a native disclosure opened before streamed hydration.
Mode trigger descriptions use a readable list instead of narrow table labels.

- Final rules matrix: **24/24 passed**, all six width/theme combinations, complete
  headings, consumer inventory, keyboard disclosure/link navigation, runtime errors
  and strict table/page overflow checks. Evidence: `refinement-rules-ready`.
- Shared configured-renderer regression: **54/54 passed** across four Guide pages,
  native token geometry/contrast, root modes, hover/focus, layered overrides, five
  gallery recipes and keyboard search. Evidence: `refinement-rules-project-final`.
- Both complete desktop/light and mobile/WebKit/dark documents were visually read;
  all six namespace specimens and refreshed trigger-list compositions were inspected.
- Reference **15/15**, docs examples **6/6**, LLMs **20/20**, prepare-app and types pass.
  Frozen full site lint passes with zero errors and 31 warnings outside this batch;
  the final narrow changes also pass scoped lint.
- The first browser runs exposed a native pre-hydration disclosure warning and an
  independent development CSS-runtime startup timeout. The disclosure was corrected;
  the full final reruns pass without changing runtime behavior or weakening checks.

The remaining four formal language rules are now in progress, with 133 other
routes pending. Production build and CSS contract review remain pending.

## Formal declarations, selectors, conditions and extraction

All four language contracts and declarations includes are reviewed, bringing this
pass to **226/359**. Complete desktop/light and mobile/WebKit/dark reading views
were inspected, including the final native syntax mapping tables in all six
width/theme combinations. Existing section anchors and portable examples remain.

Corrections include native odd/even selectors, complete labeled form states,
valid feature queries, named container containment, honest layer/starting-style
explanations, exact declaration values, and runtime-only CSS variables through
`var()`. Accessible progress examples clamp finite values and honor reduced motion.
The site guidance now distinguishes inline custom properties from manifest tokens.

`DocumentCodeTable` is shared through MDX and the Reference renderer, with a Design
System recipe. It preserves short tokens, wraps native CSS naturally, and adapts
only explicit syntax/CSS table shapes. Authored Markdown remains complete in exports.

- Six-project browser matrix: **54/54 passed** (`refinement-language-final`).
  Final class-order changes: **18/18 passed** (`refinement-language-close`).
- Native checks cover labeled validity/focus, checkbox keyboard state, odd/even
  geometry, variable colors, support/media/named-container conditions, popovers,
  reduced motion, accessible progress and actual width updates.
- Reference **16/16**, docs examples **6/6**, LLMs **20/20**, prepare-app, types,
  actual LLM generation and AI context pass. Frozen full site lint: **zero errors,
  27 warnings outside this batch**; final MDX registration receives scoped lint.
- An initial export assertion assumed every automatic heading had an explicit HTML
  anchor. It now checks both natural heading IDs and explicit IDs without changing
  export behavior. Earlier runtime-variable and class-order issues were corrected.

The CSS, CSS-in-JS, Tailwind CSS and v1 migration guides are next. Their complete
source and desktop/light plus mobile/WebKit/dark baselines have been inspected.
Production build and CSS contract review remain pending until the document pass ends.

## CSS, CSS-in-JS, Tailwind CSS and v1 migration review

All four guides are reviewed, bringing this pass to **230/359**. Complete source,
desktop/light and mobile/WebKit/dark documents were read. Final Tailwind and v1
tables use a shared, static `DocumentComparison`: a 40/60 split, natural code
wrapping and native headers replace clipped three-column audit tables. All six
Design System specimens and final affected document tables were visually inspected.

Corrections include two malformed CSS-in-JS examples, native prop and class
forwarding, exact card dimensions, visible keyboard outlines, complete responsive
content, separate compiler inputs and truthful coexistence guidance. Runtime
progress values are finite, clamped and accessible, with native custom properties
and reduced-motion support. Both search locales and portable exports retain every
authored fence, comparison and explanatory paragraph.

- Final six-project browser matrix: **54/54 passed** (`refinement-migration-final`).
- Native checks cover exact card geometry, 72rem viewport conditions, compact
  spacing, visible focus, progress width and reduced motion. The first pilot exposed
  inherited table containment and a fixture selector collision; both were corrected.
- Docs examples **7/7**, Reference **16/16**, LLMs **21/21**, prepare-app, types,
  actual LLM generation, AI context (2732 files) and whitespace pass.
- Frozen full site lint: **zero errors, 23 warnings outside this batch**.

The migration overview, Bootstrap, Material UI and Sass guides are in progress.
Their full desktop/light and mobile/WebKit/dark baselines have been inspected.
Production build and CSS contract review remain pending until the document pass ends.

## Migration overview, Bootstrap, Material UI and Sass

All four routes are reviewed, bringing this pass to **234/359**. Complete source,
desktop/light and mobile/WebKit/dark documents were read. Dense audit tables are
now prose lists. The shared server-rendered `DocumentChoices` supports plain and
branded links, native keyboard navigation and complete portable catalog output.
All six width/theme gallery variants and the final Bootstrap layout were inspected.

Corrections cover normal vendor layer precedence, Bootstrap's `.container` name
collision and intentionally different grid geometry, MUI's numeric spacing and
radius multipliers plus 900px breakpoint, and separate Sass compiler inputs.
Buttons retain visible focus; framework-owned widgets retain their original
behavior. The overview distinguishes an MCP prompt from actual tool execution.

- Full six-project matrix: **60/60 passed** (`refinement-migration-vendors-final`).
- Final gallery with runtime-error capture: **6/6 passed**
  (`refinement-migration-vendors-close`). Screenshots preserve native caret styles
  to avoid Playwright mutating unhydrated controls during capture.
- Docs examples **9/9**, Reference **16/16**, LLMs **21/21**, prepare-app, types,
  actual LLM generation, AI context (2737 files) and whitespace pass.
- Frozen full site lint: **zero errors, 23 warnings outside this batch**. Final
  prose and capture corrections also pass scoped lint.

Rendering Modes, Scanning Latent Classes, Native CSS Pruning and Route-level Styles
are in progress. Their full desktop/light and mobile/WebKit/dark baselines were
inspected; rendering currently overflowed to 598px at a 390px viewport.
Production build and CSS contract review remain pending until the document pass ends.


## Rendering, scanning, pruning and route delivery

All four routes are reviewed, bringing this pass to **238/359**. Complete source,
desktop/light and mobile/WebKit/dark documents were read. Six shared
`DocumentFlow` recipes replace outdated illustrations and keep ordered process
text in search and portable output. Desktop stages align in a row; narrow
containers use one column. Every actual recipe and all six Design System
width/theme variants were inspected, including the optional-caption variant.

The content now matches current generated CSS, asynchronous DOM observation,
actual SSR hydration asset publication, root-scoped pruning, conservative selector
filtering, route CSS ownership, keyboard focus and reduced motion. Unsupported
performance promises were removed. Existing section anchors remain intact.

- Final six-project browser matrix: **42/42 passed** (`refinement-delivery-final`).
- Docs examples **10/10**, Reference **16/16**, LLMs **22/22**, prepare-app, types,
  actual LLM generation, AI context (2744 files) and whitespace pass.
- Frozen full site lint: **zero errors, 23 warnings outside this batch**; scoped
  lint also passes.

Critical Resources and Preventing Flash of Unstyled Content are in progress.
Their complete original desktop/light and mobile/WebKit/dark baselines were read.
The mobile waterfall cuts off its later requests, and the FOUC guidance understates
blank-screen and failed-loading behavior. Production build and CSS contract
review remain pending until the document pass ends.


## Critical resources and first paint

Both routes are reviewed, bringing this pass to **240/359**. Complete source,
desktop/light and mobile/WebKit/dark documents were read. `DemoWaterfall` keeps
request labels above tracks in narrow containers; `DemoStyleComparison` renders
identical HTML with browser defaults and actual authored CSS. All three waterfall
recipes and both comparison variants were inspected at 390, 768 and 1280px in both
themes. Neither component invents loading measurements or flashes content.

The copy distinguishes resource discovery from execution, JSON module reuse,
project and hydration manifests, and the real runtime visibility lifecycle. The
complete hidden-page example includes a bounded failure fallback and a no-script
style. Stable anchors and full portable examples remain intact.

- Final six-project browser matrix: **30/30 passed** (`refinement-first-paint-final`).
  Tests serve the actual built runtime, manifest and Wasm assets, confirm early JSON
  discovery and reuse, and verify failed-download and disabled-JavaScript fallback.
- Docs examples **10/10**, Reference **16/16**, LLMs **22/22**, prepare-app, types,
  actual LLM generation, AI context (2750 files), whitespace and scoped lint pass.
- Frozen full site lint: **zero errors, 11 warnings outside this batch**.
  Fresh isolated page/gallery checks have no loading or hydration errors.

Monorepo and Authoring Packages are in progress. Their full original desktop/light
and mobile/WebKit/dark views were read, with no overflow or page errors. Temporary
compiler fixtures confirmed separate app token overrides and build-host package
compilation, and exposed existing standalone discovery/inspection limitations.
Those package behaviors remain outside this site's change scope. Production build
and CSS contract review remain pending until the document pass ends.


## Monorepo and package authoring

Both routes are reviewed, bringing this pass to **242/359**. Complete desktop/light
and mobile/WebKit/dark documents were read. The shared `DocumentFileTree` replaces
file explorer widgets with native lists, clear branch lines and optional descriptions.
Nested, flat and empty-folder variants plus the actual package preview were inspected
at 390, 768 and 1280px in both themes.

Examples now distinguish application roots, shared CSS vocabulary, local overrides,
package delivery and standalone project discovery. The authored button has actual
hover/focus styles and a supported easing token gated by reduced motion. The package
fixture verifies the real CSS export, native build import resolution and local
reference compilation. Existing bare-package discovery and inspection limitations
are documented without changing compiler or tooling behavior.

- Final six-project browser matrix: **24/24 passed** (`refinement-package-authoring-final`).
  Native keyboard focus also passes mobile WebKit's platform navigation shortcut.
- Docs examples **12/12**, Reference **16/16**, LLMs **22/22**, prepare-app, types,
  actual LLM generation, AI context (2758 files), whitespace and scoped lint pass.
- Frozen full site lint: **zero errors, 11 warnings outside this batch**.

Compatibility and View Transitions are the next batch. Their full original desktop/light
and mobile/WebKit/dark documents were inspected. Native examples contain a markup/CSS
mismatch, and mobile transition cards are cramped and clipped. Revised native
recipes and isolated transition previews are being validated. Production build and
CSS contract review remain pending until the document pass ends.


## Compatibility and native view transitions

Both routes are reviewed, bringing this pass to **244/359**. Complete desktop/light
and mobile/WebKit/dark documents were read. Native textarea sizing and relational
selectors use the actual CSS feature, with browser support reported independently.
View and article transitions run in isolated documents with unique snapshot names,
reduced-motion and absent-API fallbacks, rapid-selection handling and keyboard focus
restoration. Article cards become a single column in narrow containers.

All native specimens and the Design System gallery were inspected at 390, 768 and
1280px in both themes. Empty configuration blocks are omitted consistently from
rendered examples and portable output. Existing heading anchors remain intact.

- Final six-project browser matrix: **42/42 passed** (`refinement-platform-close`).
- Docs examples **12/12**, Reference **16/16**, LLMs **22/22**, prepare-app, types,
  actual LLM generation, AI context (2765 files), whitespace and scoped lint pass.
- Frozen full site lint: **zero errors, 11 warnings outside this batch**.

Code Linting and Language Service are in progress. Full original desktop/light and
mobile/WebKit/dark baselines were read. Long option tables conceal descriptions at
narrow widths; actual tooling probes also identify documentation drift. Production
build and CSS contract review remain pending until the document pass ends.


## Code linting and language service

Both routes are reviewed, bringing this pass to **246/359**. Complete revised
desktop/light and mobile/WebKit/dark documents were read. Long settings use a
native definition list with full-width descriptions. Server-highlighted code
pairs show verified source, result and diagnostic text, with keyboard copy,
announced success and visible clipboard failure feedback.

Actual tooling fixtures correct the invalid-class example, canonical options,
class helper defaults, completion details, hover CSS and formatting. The prose
separates ESLint's replacement arrays from the language service's extended arrays,
explains workspace discovery, and distinguishes semantic highlighting from color
previews. All examples and option descriptions survive search and Markdown export.

- Final six-project browser matrix: **24/24 passed** (`refinement-tooling-final`).
  Every specimen, gallery variant and copy-error state inspected at 390, 768 and
  1280px in both themes. No overflow, loading or hydration errors.
- Docs examples **14/14**, Reference **16/16**, LLMs **23/23**, prepare-app, types,
  actual LLM generation, AI context (2775 files), whitespace and scoped lint pass.
- Frozen full site lint: **zero errors, 11 warnings outside this batch**.

AI Coding and MCP Server are in progress. Their full original documents were
inspected in desktop/light and mobile/WebKit/dark. Prompt prose and long tool
catalogs need better wrapping; actual stdio probes validate the proposed examples.
Production build and CSS contract review remain pending until the document pass ends.


## AI coding and MCP workflows

Both guides are reviewed, bringing this pass to **248/359**. Complete revised
desktop/light and mobile/WebKit/dark documents were read. Wrapped prompts retain
exact copy text, full-width tool catalogs expose their descriptions, and shared
workflow and source/result components make preview review explicit. The configured
button demonstrates real hover, focus, disabled state and reduced-motion behavior.
All original anchors and full prompts, configuration and code survive search and
portable Markdown. Client setup is linked to official documentation.

- Final six-project browser matrix: **30/30 passed** (`refinement-agentic-final`).
  All gallery specimens and prompt variants inspected at 390/768/1280px in both
  themes; the final clipboard fallback wording passed another **6/6** focused checks
  and scoped lint (`refinement-agentic-copy-final`).
- Real stdio fixtures verify the catalog, scoped preview/apply, consumed tokens,
  unchanged results, stale-source rejection and in-memory formatting.
- Docs **16/16**, Reference **16/16**, LLMs **24/24**, prepare-app, actual LLM
  generation, types, AI context (2788 files), whitespace and scoped lint pass.
- Frozen full site lint: **zero errors, 11 warnings outside this batch**.

The 23 CLI/MCP references are in progress. All original desktop/light and mobile
/WebKit/dark documents were read. Raw schemas need readable parameter descriptions;
the longest tool title overflows at 390px. Complete contracts, literal requests,
CLI commands and their actual output/file effects are being checked against the
public binaries and stdio protocol. Production build and CSS contract review
remain pending until the document pass ends.

## CLI and MCP tool references

All 23 routes are reviewed, bringing this pass to **271/359**. Complete revised
desktop/light and mobile/WebKit/dark documents were read. Native parameter lists
expose nested paths, types, requirements and full descriptions. Native disclosures
retain the complete public help and protocol schemas. Gallery variants and all nine
CLI command specimens were inspected at 390, 768 and 1280px in both themes.

Literal requests and commands now describe actual output, file effects and lifecycle
boundaries. All 20 MCP examples execute against the real stdio protocol; all nine
CLI examples execute in disposable fixtures. Shell continuations preserve authored
indentation, and the command examples fit the mobile reading column. Original
anchors, complete contracts, search and portable examples remain intact.

- Final six-project browser matrix: **150/150 passed**
  (`refinement-tool-contracts-final`); final CLI polish **18/18 passed**
  (`refinement-cli-wrap-complete`). No overflow, loading or hydration errors.
- Docs **18/18**, Reference **18/18**, LLMs **25/25**, prepare-app, actual LLM
  generation, types, AI context (2798 files), whitespace and final scoped lint pass.
- Full site lint: **zero errors, 11 warnings outside this batch**. Final CLI
  source and renderer polish also passes scoped lint and actual command fixtures.

The ten directive references are next. All original desktop/light and mobile
/WebKit/dark documents were inspected. Settings tables break narrow labels, repeated
utility catalogs obscure the teaching sequence, and file delivery prose is stale.
Production build and CSS contract review remain pending until the document pass ends.


## Directive references

All ten directive routes are reviewed, bringing this pass to **281/359**. Complete
revised desktop/light and mobile/WebKit/dark documents were read. Settings now keep
identifiers, defaults and descriptions together; nine source/result specimens show
complete compiler output. The shared server component and its accessible clipboard
controls are documented in Design System. Original anchors, search and portable
Markdown remain intact.

The prose now distinguishes entry recognition from delivery, uses actual `on`/`off`
settings, and explains native preservation as pruning policy. Compiler fixtures
verify all nine examples, rendered resource parity, temporary reference imports,
safelist behavior and native preservation. No compiler or package API changes.

- Final route matrix: **60/60 passed**. Final gallery repeated matrix: **12/12
  passed** (`refinement-directives-copy-final`), following one transient initial
  desktop copy-feedback failure and a successful independent rerun. No test
  expectations were relaxed. All gallery variants inspected in six size/theme
  combinations; source/result page polish re-read in both reading layouts.
- Docs **19/19**, Reference **19/19**, LLMs **26/26**, prepare-app, actual LLM
  generation, types, scoped lint, AI context and whitespace pass.
- Full site lint: **zero errors, 11 warnings outside this batch**.

The 20 package API references are in progress. Their declarations and all original
desktop/light and mobile/WebKit/dark opening views were audited. Six mobile pages
overflow on long symbol headings; several declaration blocks contain private or
executable implementation. Site-owned declaration emission and entrypoint navigation
are being refined. Production build and CSS contract review remain pending until
the document pass ends.


### Package API validation in progress

All 20 revised normalized bodies have been read. Desktop/light and mobile/WebKit/dark
opening and ending views were inspected for every package, with middle-page samples
for the long contracts. Six-size/theme route checks compare every displayed fence
and heading with the catalog, including hidden complete declarations. The first
matrix passed all 120 route checks; its desktop gallery exposed a first-click
clipboard initialization race. Copy controls now stay disabled until hydrated.
A subsequent test exposed the development host's intentional hidden root before
runtime startup; the delayed-script fixture now checks SSR control state before
release and native interaction afterward, without overriding host visibility.

Visual reading also found defining-module default modifiers on publicly named
re-exports. Declaration presentation now leaves default/named mapping to the public
entrypoint builder, with a regression fixture. Identifier headings and navigation
prefer native word-break opportunities at camel-case and path boundaries, preserving
exact text. Final browser and lint results are still pending; this batch remains
in progress. Installation route baselines are being captured for the next batch.

### Package API review complete

All 20 package references are reviewed, bringing this pass to **301/359**. Final
browser checks pass **132/132** (`package-apis-verified`), plus **6/6** shared
clipboard regression and **6/6** final gallery captures (`package-apis-gallery-ready`).
Gallery capture now waits for font and copy-control initialization before recording
its first specimen; two earlier blank captures were not accepted as visual evidence.
The initial readiness check used an incorrect accessible label, corrected to the
actual specimen label. Final captures, expanded declarations and clipboard fallback
were read in all six width/theme combinations; narrow identifier wrapping was
rechecked on Schema, Language Service and Engine pages.

Reference **20/20**, docs **19/19**, LLMs **27/27**, prepare-app, actual LLM generation,
types, AI context, whitespace and scoped lint pass. Full site lint completed with
**zero errors and 11 warnings outside this batch**. No package semantics or API
changed; declaration presentation is owned by the site.

Seven installation routes are in progress. All 51 installation routes completed
a 102-view desktop/light and mobile/WebKit/dark baseline with no errors or page
overflow. The seven selected sources and complete baseline reading views were
inspected; shared step spacing, exact utility previews, installer outcomes, CLI
delivery, CDN first-paint visibility and editor save-action settings are being
refined. Production build and CSS contract review remain pending.

### First installation batch complete

Seven routes are reviewed, bringing the pass to **308/359**. Complete desktop/light
and mobile/WebKit/dark documents were read; the shared DocumentSteps gallery was
inspected at 390, 768 and 1280px in both themes. Final browser matrix **60/60**
(`installation-ready`) verifies original anchors, exact utility previews, step
geometry, accessible editor links, the real CDN runtime and readable failure/no-JS
content. A transient blank CLI code capture was rejected and the final capture
visually verified. The first capture readiness assertion incorrectly included
inactive package-manager tabs; it now checks visible code lines while retaining
nonempty source assertions for all tabs.

Actual public installer, Vite runtime/static builds and CLI output fixtures pass.
Reference **20/20**, docs **20/20**, LLMs **29/29**, prepare-app, actual LLM generation,
types, scoped lint, whitespace and AI context pass. The full site lint completed
earlier in this pass with zero errors and 11 existing warnings; all subsequent
installation edits passed scoped lint. No package API or runtime behavior changed.
Production build and CSS contract review remain pending.

### Framework installation verification

React and Vue runtime/static routes and Lit now use the site-owned step sequence,
exact component output and portable setup content. Complete original and revised
desktop/light and mobile/WebKit/dark documents were read. Shadow-preview variants
were inspected at 390, 768 and 1280px in both themes. The shared full-width text/body
gap and atomic short inline-code wrapping were also rechecked visually.

The five actual authored apps build through public installer plan/apply and existing
framework plugins. Browser checks cover React/Vue rendered classes, static builds
without runtime assets, and Lit class mutation plus disconnect/reconnect. Lit tests
found two omissions in the old setup: its generated CSS entry must be loaded, and
shadow-only generated `:root` tokens do not apply to the host. The guide now loads
`src/index.css` and uses explicit `@theme static` component aliases referencing
foundation tokens. This is a tested site-owned example; core behavior is unchanged.
The preview is clearly labeled as generated CSS inside a real shadow root, not a
Lit runtime demonstration.

Earlier fixture failures identified the missing Lit stylesheet connection and token
inheritance; both were resolved in the authored example before acceptance. A
transient MDX edit error and an unresolved package import in the appearance preview
were fixed; final output uses the existing preset base and literal token source.
The shared site-step regression covered all 12 migrated routes. Two development
checks failed in its 126-case run: a mobile Vue overflow reading and the existing
host runtime's 3000ms startup deadline on Quick Start. The same Vue checks passed
12/12 repeated cases without relaxed assertions; its independent width probe was
390/390px. Quick Start repeat verification is tracked in the final closure below.

### Framework installation review complete

The five routes are reviewed, bringing this pass to **313/359**. All actual framework
build/lifecycle and shadow gallery cases passed. The final 12-route matrix passed
**124/126** (`installation-complete-12`); both transient failures passed unchanged
repeated six-size/theme matrices: Vue **12/12** (`installation-vue-confirmed`) and
Quick Start **12/12** (`installation-quick-confirmed`). Lit and shared steps also
passed **12/12** after the source/spacing corrections. No assertions or startup
thresholds were relaxed. Complete revised reading views and all six shadow-gallery
variants were visually inspected; final inline-code wrapping rechecked on React
and Lit desktop/mobile views.

Docs **21/21** plus final affected **3/3**, Reference **20/20**, LLMs **29/29**,
prepare-app, actual LLM generation, types, scoped lint, whitespace and AI context
pass. Full site lint earlier in this pass had zero errors and 11 pre-existing
warnings; subsequent changed TypeScript files passed scoped lint.

Remaining: **39 installation routes and seven other documents**, then production
build and CSS contract review. Six Webpack/Rspack/Rsbuild sources and their owning
plugin/installer setup were read in preparation; their original screenshots were
composed but not yet visually reviewed, and those routes remain pending.

### Bundler installation review complete

Webpack, Rspack and Rsbuild runtime/static routes are reviewed: **319/359**.
Complete original and revised desktop/light and mobile/WebKit/dark pages were
read. All six use shared steps, literal heading previews, explicit stylesheet
imports and complete HTML templates. The static setup explicitly includes the
standalone template with a CSS-relative `@source`, because HTML-plugin templates
are outside the application module graph. Runtime delivery explains that only
compilation-emitted HTML receives injection. Existing framework config is retained.

Six authored fixtures build using the public installer and documented config.
Webpack and Rsbuild run their existing CLIs; Rspack uses its installed public core
API, since the CLI is unavailable locally. Its CLI command was source-checked but
not executed. The Webpack fixture disables monorepo TypeScript aliases, matching
the owning package's tests; that repository-only adapter is not setup boilerplate.

Document browser checks pass **36/36**. The first combined run was **60/72**: all
12 failures were Rspack's production class-token sorting versus a raw-string test.
The corrected test compares the exact token set and retains computed style and
no-JavaScript checks. All six actual production builds then passed **36/36** at
390, 768 and 1280px in both themes, including static output with JavaScript disabled.

Docs **22/22**, Reference **20/20**, LLMs **29/29**, prepare-app, actual LLM
generation, types, scoped lint and AI context pass. No public package behavior or
repository dependency changes. Remaining: 33 installation routes and seven other
documents, followed by production build and CSS contract review.

### Astro and SvelteKit review complete

Four routes are reviewed: **323/359**. Complete original and revised desktop/light
and mobile/WebKit/dark documents were read. Shared steps now show connected CSS
entries, exact route output and complete configuration. Astro's three mode labels
are concise enough to remain visible at 390px; all three revised headers were
visually checked and navigation bounds pass at every tested size and theme.

The current Svelte CLI creates the project. Its real add-on is applied in the
fixture, then the documented files build against SvelteKit and pass `svelte-check`.
The root layout explicitly imports `virtual:master-css-runtime`, with a standalone
TypeScript declaration. The existing add-on alone configured the server hook but
did not include the browser runtime in production; the authored import supplies
that missing connection. Existing hooks and layouts remain documented merge points.

Actual Astro 7.3.1 builds found an existing static-integration delivery defect:
default CSS inlining retained the internal placeholder; disabling inlining produced
a CSS import whose generated asset was missing. Neither output was accepted. The
static guide now explicitly states the limitation and uses the public CLI to build
`public/master.css` and its dependencies before Astro copies those files. The
progressive and runtime guides use their tested Astro integration. No core package
was changed or failure hidden behind the appearance preview.

Final browser checks: documents **24/24**, real build outputs **24/24**, and the
compact Astro mode navigation **18/18**, covering 390, 768 and 1280px in both themes.
The real output tests check initial styled HTML with JavaScript disabled for
progressive/static paths and actual post-load class mutation for runtime paths.
The initial combined browser run failed in fixture setup because the relocated
Svelte checker lacked its own dependency links; those local fixture links were
fixed before the successful 24-case production repeat. The checker uses the
already-installed TypeScript 6 it supports; site type checks still use the normal
workspace toolchain. No repository dependency or lockfile changes.

Docs **23/23** plus final affected **1/1**, LLMs **29/29**, prepare-app, actual LLM
generation, types, scoped lint and AI context pass. Full site lint earlier in this
pass had zero errors and 11 existing warnings; subsequent files pass scoped lint.
Remaining: **29 installation routes and seven other documents**, then production
build and CSS contract review. Express, PHP and Rails runtime/static source bodies
have been read for the next batch; their full baseline views remain to be reviewed.

### Express, PHP and Rails review complete

Six more routes are reviewed: **329/359**. Complete original and revised
desktop/light and mobile/WebKit/dark pages were read. Shared DocumentSteps keep
long configuration and template examples full width. The exact heading/classes
supply each isolated appearance preview, and existing section IDs remain intact.
The Design System records this server-template sequence beside the other real
installation examples.

Each route now includes required dependencies, complete entries/templates and
build/run/watch commands. Dedicated `public/master-css` output and `publicDir:
false` preserve the host's unrelated public assets; real fixtures verify that.
Static entries retain explicit CSS-relative template sources. PHP templates live
under `app/views` and are loaded by a real public PHP entry. A probe that scanned
PHP source directly under `public` emitted only base CSS with the current tooling;
the final conventional app-template layout produces the required utilities.
The Express example uses a complete native HTML document and `app.mjs`, removing
an unnecessary EJS dependency and ambiguous ESM package configuration. It explains
where an existing template engine's rendered document enters the same flow.
Runtime-only HTML stays visible without JavaScript. The Rails guide preserves
host metadata/importmap merge points and separates these assets from its pipeline.

Actual Vite builds and browser outputs pass **72/72** combined cases: 36 document
checks and 36 asset behavior checks at 390, 768 and 1280px in both themes. Express
and PHP use actual HTTP servers. Rails is unavailable locally, so its actual Ruby
ERB view/layout runs with explicit empty host-helper stubs and built assets are
served to the browser; full Rails/Turbo integration is not claimed. Checks cover
initial visibility without JavaScript, initial utility styles for progressive and
static delivery, and real class mutation/node replacement for runtime delivery.
The first combined run had 36 document passes and six fixture-setup failures (30
not run): the CSS assertion initially read only the entry import. The fixture now
follows its emitted CSS graph and the PHP source location was corrected before the
successful 72-case repeat.

Docs checks initially passed **23/24**; the sole failure identified a bad Express
related-guide URL. That URL now targets the existing rendering-modes section and
the affected check passes **1/1**. LLMs **29/29**, actual LLM generation, prepare,
types, scoped lint and AI context pass. The prior parallel prepare/Reference run
read intermediate search output and failed one comparison; after prepare completed,
Reference passed **20/20** without test or implementation changes. Avoid running
search-output consumers concurrently with prepare. Full site lint remains the
previous zero-error/11-existing-warning result; scoped lint has no errors.

Remaining: **23 installation routes and seven other documents**, then the full
production build and CSS contract review. No core package, internal submodule,
repository dependency or release-flow changes.

### Laravel, WordPress and Shopify review complete

Four routes are reviewed: **333/359**. Complete original and revised desktop/light
and mobile/WebKit/dark documents were read. Shared DocumentSteps now cover the host
asset-tag pattern, with full-width configuration, literal appearance previews and
preserved anchors. Dedicated WordPress assets preserve unrelated theme files;
Shopify retains its flat assets directory without clearing it. Laravel includes
the actual installer, Blade asset entry, route and development/production flow.
WordPress uses the 6.5+ module enqueue API, child-theme URLs and file versions;
runtime HTML remains visible without JavaScript. Shopify includes blocks and JSON
templates, a separate theme preview terminal and complete dependency deployment.

Actual Vite output and document browser checks pass **48/48**, plus **6/6** after
the final WordPress static prose correction, across 390/768/1280px and both themes.
WordPress runtime assets also load from a separate origin and nested child-theme
path. The fixtures execute authored PHP hooks with explicit host stubs and adapt
Blade/Liquid asset tags; full Laravel, WordPress or Shopify host integration is
not claimed. No dependencies were installed. Docs **25/25**, Reference **20/20**,
LLMs **29/29**, prepare, types, scoped lint and AI context pass.

Remaining: **19 installation routes and seven other documents**, followed by the
production build and CSS contract review. ASP.NET Core and Blazor source is read
and next in progress; their original full-page visual review is still pending.

### ASP.NET Core and Blazor review complete

Five routes are reviewed: **338/359**. Complete original and revised desktop/light
and mobile/WebKit/dark pages were inspected; final Blazor runtime alias images
are pixel-identical to the canonical page in both inspected projects. DocumentSteps
keep long configurations and layouts full width. Every preview uses the authored
heading, and all original anchors remain. Runtime pages no longer hide the whole
document. Razor Pages retain their route and Tag Helper requirements; Blazor Web
App examples preserve the base, head outlet, import map, routes and startup script.
Dedicated `wwwroot/master-css` assets preserve other host files. Source paths now
follow actual Razor directories, and commands build frontend assets before .NET
creates its static collection or publishes the app.

Actual Vite builds and browser delivery pass **60/60** at three widths in both
themes. Tests include nested asset paths, no-JavaScript visibility, initial static
CSS and real runtime class mutation/node replacement. The .NET SDK is unavailable;
literal host-tag adapters do not establish Razor compilation, .NET fingerprinting,
Blazor startup or enhanced-navigation correctness. These limits are explicit in
the fixture and maintenance guide. The site-owned InstallationModeTabs now selects
the canonical mode for the Blazor runtime alias, exposes aria-current and appears
in the Design System with usage and constraints. Final Blazor documents pass
**18/18** with selection checks.

Docs **26/26**, Reference **20/20**, LLMs **29/29**, actual LLM generation, prepare,
types, scoped lint and AI context pass. The first LLM run overlapped prepare and
read intermediate search data; rerunning after prepare completed passed without
changing its assertions. Do not run output consumers while prepare is writing.
Remaining: **14 installation routes and seven other documents**, then production
build and CSS contract review. Storybook source has been read for the next batch.

### Storybook and iframe lifecycle review complete

Storybook is reviewed: **339/359**. Complete original and revised desktop/light
and mobile/WebKit/dark documents were inspected. DocumentSteps, a literal React
story and isolated preview now explain the preview/manager boundary, one Vite
registration, optional viteFinal hook, static source discovery and full asset
deployment. Existing setup anchors remain. React/Vite builds execute the authored
preview and hook; Storybook itself is not installed, so its builder, manager and
CSF loader are explicitly outside the fixture's coverage.

Final asset/document browser checks pass **24/24**, followed by **6/6** final
document captures. An initial fixture selected a transitive Vite version; selecting
the workspace Vite fixed its build without modifying output targets. Docs had
26 passing tests plus that one fixture failure; the corrected fixture passes
**1/1**. Reference **20/20**, LLMs **29/29**, prepare, actual LLM generation, types,
scoped lint and AI context pass. Screenshots now wait two animation frames after
font readiness and scrolling to avoid capturing unpainted code blocks.

Keyboard navigation from the Design System uncovered queued iframe callbacks
reading detached windows. DemoViewport now checks that its document remains
connected and current before measuring or processing events. Measurement/motion
regressions pass **12/12**. Final gallery navigation passed four projects, with
the two tablet projects passing a focused rerun after runtime startup timeouts
under concurrent development-server load. A separate native-keyboard matrix
passes **6/6**; gallery captures at 390/768/1280px were inspected. No assertions or
runtime timeout policies were weakened. Full site lint remains running at this
checkpoint; its result is not yet claimed.

Remaining: **13 installation routes and seven other documents**, followed by the
production build and CSS contract review. Angular is next.

### Angular review complete

Three Angular routes are reviewed: **342/359**. Complete original and revised
desktop/light and mobile/WebKit/dark documents were inspected. DocumentSteps keep
long index documents full width, and shorter shared mode links fit the narrow
column. Quick start, runtime and static guides preserve every original anchor and
use the exact heading shown in the preview. The quick-start metadata no longer
claims progressive rendering. Runtime setup keeps the document visible and
preserves Angular bootstrap/providers; static setup generates CSS before Angular
copies public assets, with complete class strings and explicit build ordering.

The original direct installer was probed with the real Angular 22 CLI. Its build
succeeded but the browser requested a missing Wasm asset and never styled the
heading. The site now documents verified CDN runtime and CLI static workflows;
the package limitation remains outside this site's change scope. Browser fixtures
use actual Angular builds and locally served packaged CDN bytes, and do not claim
external CDN availability or Angular SSR. Runtime class changes and mounting after
runtime failure pass; static output makes no Master CSS runtime/Wasm requests.

Application checks pass **12/12** and quick/static documents **12/12**, followed by
final runtime documents **6/6**, across three widths and both themes. Initial
runtime document failures exposed text-only steps incorrectly wrapped as paired
columns. Corrected markup passes the unchanged spacing assertions. A transient
MDX edit also left the development server serving stale modules; restarting that
owned server without clearing its build output restored the current document.

Docs had **27** passing tests and one Angular fixture comparison failure while its
source was being edited; the final frozen Angular fixture passes **1/1**. Reference
**20/20**, final LLMs **29/29**, prepare, actual LLM generation, types, scoped lint
and AI context pass. Full site lint completed with **0 errors and 13 warnings**.
Two new Lit class-order warnings were then corrected in source and its exact-class
assertion; scoped lint is clean and Lit browser checks pass **6/6**. The remaining
11 warnings are outside these changes. No lint rules or behavioral assertions were
weakened, and no dependencies or package APIs changed.

Remaining: **10 installation routes and seven other documents**, followed by the
production build and CSS contract review. Next.js, Nuxt, React Router and TanStack
Start have not yet received their revised full-page review.

### Next.js review complete

Three Next.js routes are reviewed: **345/359**. Original and revised desktop/light
and mobile/WebKit/dark documents were read in full. The final manual-setup link
correction changes only its introduction paragraph in image comparisons; all six
changed areas were inspected. Shared DocumentSteps provide full-width config and
layout examples, exact utility previews and short mode navigation. Original
anchors remain, and keyboard links reach the manual setup in the same document.
The installer’s root `app` path is explicit; `src/app` instructions preserve the
existing app and stylesheet rather than creating a conflicting root directory.

Actual Next.js 16 builds and production servers verify all three modes. Progressive
styling is present in build-generated HTML, while a request-time dynamic route
depends on the runtime. Static mode styles both from scanned source and makes no
Wasm request. Runtime mode keeps the server-rendered heading visible without
JavaScript, with utility styling unavailable. The static installer’s top-level
await form fails in `next.config.ts`; the documented async configuration function
passes a real build. This is a site documentation correction; the package remains
unchanged. Browser fixtures build each mode once and share read-only servers.

Application/document checks pass **36/36**, and final document/keyboard navigation
checks **18/18**, across 390/768/1280px and both themes. Docs **29/29**, Reference
**20/20**, LLMs **29/29** plus the final installation export check, prepare, actual
LLM generation, types, scoped lint and AI context pass. A fresh full site lint is
still active (session 39319, PID 55437, `/tmp/master-next-site-lint.log`); do not
start a duplicate or claim its result before completion. The preceding full lint
had zero errors; the two Lit warnings it exposed have since been corrected.

Remaining: **seven installation routes and seven other documents**, followed by
the production build and CSS contract review. Nuxt source has been read: its
Nuxt 4 app/root aliases, explicit stylesheet registration and SSR-enabled module
requirement need attention. Nuxt's baseline panels exist but are not yet read.


## Nuxt installation review

All three Nuxt pages are reviewed, bringing this pass to **348/359**. Shared
DocumentSteps, compact mode links and literal configured previews replace the
old step rail and mismatched heading. Nuxt 4 uses app/app.vue; the documented
root stylesheet uses `~~/assets/css/master.css`. The installer creates that file
but does not register CSS in an existing config, so the complete configuration
makes the connection explicit. All modes retain Nuxt SSR: the module skips setup
when ssr is false. Existing four section anchors are preserved on every page.

The three authored configs, stylesheets and Vue components build with installed
Nuxt 4.5.2. Actual Nitro production servers pass **36/36** application/document
checks across 390/768/1280px and both themes, including no-JavaScript initial
styles, runtime class updates and absence of Wasm in static delivery. Progressive
server rendering works for actual Nitro responses. A separate deployment probe
removes the build-time manifest and reproduces startup ENOENT: progressive output
currently contains an absolute source manifest path. This limitation is documented
in the authored, exported prose; no package behavior was changed or deployment
portability claimed.

All three original and revised full desktop/light and mobile/WebKit/dark documents
were read. Final copy avoids fragmented inline code in the narrow desktop column.
Final document and keyboard mode navigation checks pass **18/18**. One offscreen
code paint artifact in a full-page capture led to a stronger shared reading check:
scroll each visible code block’s first line into the viewport before taking the
full-page screenshot. Refreshed static desktop code is visible. Evidence:
`installation-nuxt`, `installation-nuxt-final`, `installation-nuxt-close`, and
`installation-nuxt-painted`.

Docs **30/30**, Reference **20/20**, LLMs **29/29** plus the final installation export
check, prepare, actual LLM generation, types and scoped lint pass. The complete
47-route reading matrix and previous full site lint remain active at this point;
record their final results below rather than starting duplicate processes.

Remaining: **four installation routes and seven other documents**, followed by
production build and CSS contract review. React Router’s original source and
complete baseline desktop/light and mobile/dark documents have been read. The
installed router is 7.18.3 but @react-router/dev is absent; Vite runtime injection
uses transformIndexHtml, so framework SSR startup needs explicit verification.
Official installation/styling sources now list latest 8.4.0. Do not assume the
installer alone starts a runtime in framework-rendered HTML. TanStack Start is
installed and has a real integration-lab fixture available for the next pass.

The final shared reading matrix passes **282/282** checks across all 47 completed
installation routes and six viewport/theme projects. No assertion was weakened:
the extra native first-line viewport check now covers every displayed code block.
Scoped test lint, types and AI context (**2852 files**) pass. Full site lint has
now completed with **zero errors and 11 warnings** outside the Nuxt batch
(`/tmp/master-next-site-lint.log`). The earlier two Lit warnings are gone. The
remaining warnings are in the Next.js blog, Introduction, Spacing, Syntax Tutorial
and Sponsor components; this checkpoint does not silently autofix teaching syntax.
No validation process remains active. Production build and CSS contract review
remain deferred until the remaining eleven documents are finished.
