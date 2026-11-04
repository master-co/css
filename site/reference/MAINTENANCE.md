# Maintaining the Reference

Reference verifies language and tool behavior during writing, explanation and review. Guide pages teach a workflow and link to the formal contract. Avoid separately maintaining the same rule in both places.

The canonical content policy is [Guide and Reference ownership](../AI.md#guide-and-reference-ownership). The [content inventory](../../.ai/reports/reference-content-inventory.md) records the current catalog and its source ownership. The catalog documents Master CSS capabilities; native CSS declarations retain their native meaning.

## Sources and outputs

| Content | Source | Generated facts |
| --- | --- | --- |
| Utilities | Local Reference MDX prose, `reference/sheet-editorial.ts`, preset `utilities.css` and manifest | Actual definitions, parameter syntax and complete generated CSS; includes recipes and single-declaration numeric functions |
| Fixed utilities | Preset static utilities and public Rust declaration validation, adapted by `reference/fixed-utilities.ts` | Complete class-to-declaration lookup shared by `<FixedUtilities />` and portable exports |
| Language rules | `content/guide/*/contract[.<locale>].mdx`, routed by `editorial.ts` | Complete `Class2CSS` and configured examples |
| Directives | `content/guide/directives/contract[.<locale>].mdx` | Stable section IDs in the directive Reference |
| Tokens | Public preset manifest and build-time language-session `tokenFamilies()` | Names, values, modes and consumers |
| Named conditions | `reference/named-conditions.ts`, preset `customMedia` and `customContainers` | Independent media/container registries, expanded queries and complete suffix lookup |
| CLI | Public `master-css` binary and concise catalog guidance | Command discovery and invocation; complete options remain in `--help` and GitHub |
| MCP | Public stdio `tools/list` protocol and concise catalog guidance | Tool discovery and file effects; complete schemas remain in the server and GitHub |
| Packages | Published exports, API census and package editorial | Public import paths, searchable symbols, lifecycle guidance and GitHub source destinations |

The declarations, selectors, conditions and directives contracts have no Guide route; Reference publishes them and the Getting Started Syntax Tutorial teaches them. Rule registry entries separate the `source` contract path from the `guide` learning URL. The `contract.mdx` files are the single authored source consumed by Reference. A neighboring `content.mdx` owns the Guide learning workflow. Named-condition lookup is a structured Syntax sheet, independent of token values; do not restore a second manual threshold table in Conditions. Every top-level section in the directive contract has an explicit, language-independent heading ID and exactly one published owner in `directivePages`. Generation partitions by these IDs, never by translated heading text, and rejects unassigned or multiply assigned sections. Put host API details in Packages and integration workflows in their Guide instead of appending unpublished contract sections.

`prepare-app` builds `.generated/reference.json` and `reference.<locale>.json` catalogs, a compact `.generated/reference-route-index.json` and locale-aware `reference-route-indexes.json`, individual `.generated/reference-documents/<locale>/*.json` files, the searchable documents, `public/reference/index.json`, per-page locale-specific Markdown URLs, and section text bundles. Every catalog, route index and prepared document identifies its locale. The route reads only its selected document and locale; generated files whose content has not changed keep their modification time. `build:llms` reuses the same normalized Reference in `llms.txt` and `llms-full.txt`. Generated outputs are ignored; edit their sources.

Private document payloads also contain the parsed Markdown tree and prepared code HTML, copy text and preformatted-element attributes. `prepare-app` reuses these trees when the Markdown, document kind and rendering inputs have not changed. The rendering fingerprint includes the local parser/highlighter/formatters, package and TypeScript resolution configuration, lockfile, preset, language/tooling sources and native/Wasm artifacts. Run `prepare-app` after editing those inputs; Guide MDX continues to highlight live. Public Markdown, search and catalogs retain their original content model.

Generated output uses `GeneratedCSS`, a closed native `DocumentDisclosure` titled
**Generated CSS**. `Class2CSS`, configured examples and demos already supply it;
do not add an outer disclosure. Source/result examples opt in with
`resultKind="generated-css"`; ordinary tool results remain visible. Normalized
output fences carry `disclosure=generated-css`, including `stylesheet=result`
fences. Pair recognition must accept that extra metadata, and prepared highlights
must match the live rendering path. Keep the full CSS in server HTML, search and
portable exports.

General Reference, token and recipe pages have separate route modules under `content/reference/`, with the same public URLs and shared `ReferencePage.astro` shell; a structured sheet view is its default slot. Keep specimen imports in their owning route entry so ordinary rules and package pages do not compile the specimen graph. Brand icons belong to the pages that request them: pass the brand name as the page's `icon` prop, and the article header renders it with `docs-shell/components/HeaderIcon.astro`. File badges use the existing public SVG URLs at their existing CSS dimensions; other SVG imports are Astro SVG components.

The current source revision and semantic/content digests identify the build inputs. Current-version URLs can change between builds; these are not historical version snapshots. A local dirty checkout is not a published immutable document.

Authored rule figures use `<ReferenceIllustration id="…" />`. Their localized titles, alt text, captions and text equivalents live in `reference/content/illustrations/<id>/content[.<locale>].mdx`; `reference/illustrations.ts` selects that copy alongside shared English diagram labels, with editable scenes and theme images under `assets/images/`. The strict MDX adapter preserves the explanation between presentation markers; `ReferenceBody` replaces that range with the figure, and portable Markdown removes only the markers. Keep the full explanation searchable and test it alongside compiled examples. Unknown figure IDs fail generation rather than silently dropping content.

Token value sheets keep their focused explanation in `reference/content/<document-id>/content[.<locale>].mdx` and their shared figure and data selection in `sheet-editorial.ts`; `TokenSheetView` and `tokenSheetMarkdown` render the same fields and illustration text. Keep necessary layout or border prerequisites in a specimen's `keep` list so source abbreviation preserves them in both HTML and compiled exports. The complete family index uses namespace identity when grouping consumers; never merge distinct namespaces solely because their prefixes or properties match.

`TokenSurfaceScale` preserves complete radius and shadow comparisons behind a disclosure, using the adjacent table's values directly. Samples share geometry, follow the site scheme and leave room for shadow paint. Their values already belong to the portable table; do not add a second token list or theme control to support this presentation.

`TokenTypeScale` preserves every family, size, weight, text treatment, leading and tracking value at its actual size. Text specimens read all three table cells, including companions. Wide samples scroll in a labelled keyboard-accessible stage; never shrink the scale to fit a phone. Typography Guide owns composition and font loading; these Reference sheets own independent properties, recipe companions, namespace ambiguity and inheritance contracts.

`TokenMotionScale` reuses the foundation scenes and native playback controller for the complete animation, duration and easing collections. The lookup retains preset infinite shorthand values; the comparisons explicitly run once and begin paused. Playback controls serve the lesson, with no theme toggle. Verify generated shorthand/longhand order from actual output before describing overrides; animation duration utilities currently follow the animation shorthand under equal conditions.

Utilities include both multi-declaration recipes and single-declaration numeric functions. Their focused explanation uses `SheetExplanation` and the same Markdown adapter as token sheets. Keep prerequisite layout, width constraints and border styles in visible source when the lesson depends on them. Clipped text needs a real path to its full content; visually hidden text needs an actual accessible-name check.

Individual document pages render their authored or generated body directly. Do not inject a version/source/Markdown toolbar, a page-level copy-example control, a generic Related reference section or an extra alias list. Keep the body as the reading source of truth; search and machine exports derive from the existing shared content model.

## Editing safely

1. Retain URLs for continuing content. Remove retired Reference routes and update active internal links to their replacement content. The user explicitly waived redirect handling for this migration; do not add navigation-only pages or anchor redirect maps merely for compatibility. Keep removed articles out of navigation, search, sitemap and machine exports.
2. Preserve useful semantic heading IDs when their sections remain. In MDX, write `## New title \{#stable-id\}`. The braces must be escaped for MDX; the visible title and exported Markdown omit the marker. When moving a section, update its incoming links to the new owner; this refactor does not require legacy anchor entrances.
3. Add prose for prerequisites, exceptions and intended use. Placeholder syntax rows describe declaration shapes, not the full grammar of accepted values.
4. Keep a text equivalent for every meaningful component. `markdown.ts` handles `Overview`, `Class2CSS`, literal `Code`, local MDX includes, token tables and configured examples. Unsupported components are reported and fail the coverage test. Do not execute arbitrary JSX to extract prose.
5. Use `ConfiguredExample` for classes that depend on custom theme settings. It compiles the configuration through the public compiler before generating CSS with the public engine.
6. Add identifiers and task vocabulary in `editorial.ts` only when useful. Search performs retrieval, not syntax interpretation. Project-specific validation belongs in existing CLI, MCP or Play workflows.
7. When changing tool registrations or exports, rebuild their packages before generating docs. CLI/MCP names come from the built public binaries; catalog descriptions remain concise authored guidance. Package discovery reads public export contracts without compiling declaration presentation. Tool queries still use freshly built public binaries.

English is the source language. Local editions use `tw`, `ja`, `ko` and `cn`, with language tags `zh-TW`, `ja`, `ko` and `zh-CN`. Contracts retain their owning directories and use `contract.<locale>.mdx`; other authored Reference prose lives in `reference/content/<document-id>/content.<locale>.mdx`, beside English `content.mdx`. The prose files use stable `copy-*` sections, read by `reference/copy.ts`; translate their bodies and retain the section IDs. These are authored sources, not generated translation responses. Product facts, parameter names, code and CSS remain shared.

`referenceCopyResources()` supplies the prose inventory to the shared translation review gate. A missing or changed source or translation requires explicit review before production builds. Preparation never stamps reviews. Development prepares only complete editions, without replacing missing prose with English. HTML, search, Markdown and llms consume the same localized document model; portable links receive the matching locale prefix. Structured tables use cell shapes and explicit mode data rather than visible English labels to choose their behavior.

Guide and Reference overviews share `site/components/DocumentationIndex.svelte` and `site/styles/documentation-index.css`. Reference adapts its catalog in `reference/Index.svelte`; Guide derives its primary teaching entries from existing category metadata through `site/utils/guide-overview.ts`. That Guide model also supplies overview search nodes during `prepare-app` and its body in llms exports. Keep category anchors and metadata-derived links aligned when changing either overview. Sections are numbered by their order; neither overview uses icons. The old `#syntax-tutorial` overview anchor belongs to Getting Started. `utils/syntax-tutorial.ts` uses the Reference component adapters to include generated CSS and complete configured examples in tutorial search and llms output.

Design Foundations use `utils/foundation-content.ts` for search and llms bodies. Its strict adapters expand local MDX and generated CSS without executing JSX. `common/foundation-data/tokens.ts` supplies token facts to `FoundationTokens`, Reference catalogs and specimens; other shared presentation data lives beside it. Reference owns complete collections; Guide passes explicit task-specific keys, identical in HTML and portable/search output. Register changed data-bearing components in the strict adapters; never let a selected visual subset export a full catalog. Visual recipes may be omitted only when their lesson and portable code are in the adjacent authored body. Search keeps explicit heading markers; portable Markdown converts them into anchor elements. Reference's `Overview` syntax-table behavior remains the default and Guide includes opt into their own handling.

The four project styling guides use `utils/project-style-content.ts` with the same strict parser. `ProjectStyleExample` reads the literal configuration and HTML from `components/demo/project-style-examples.ts`; that data supplies the iframe, code blocks and portable export. `DemoConfiguredExample` also has a direct literal-prop adapter. Keep full configuration and generated CSS in exports even when the page collapses the generated output.

`ConfiguredExample` accepts either a class array or trusted literal HTML, including local raw HTML specimens. It compiles with the public render session, matching iframe previews; tooling validates every expanded declaration without filtering emission. Generate CSS from the displayed source instead of maintaining cached CSS specimens; keep any configuration required by the output, such as `@mixin`, explicit.

Namespace consumers come from `utils/variable-namespace-sources.ts` and build-time `tokenFamilies()` metadata. Do not derive this index from defined preset values: a registered consumer can exist without a matching token. Reference Markdown retains every consumer; Guide exports only its selected rows. `DocumentNamespaceTable` renders the same rows with native disclosures for long lists; its focused parser only recognizes the explicit Namespace/Consumers table shape. Do not add native query examples to token-consumer lists: explicit container-query values do not read or track container tokens.

`DocumentCodeTable` keeps short syntax tokens intact while native CSS wraps at spaces. Reference adapts only two-column Token/CSS or Syntax/CSS tables whose cells each contain one code span. Keep long generated rules in code blocks; the authored Markdown remains the export source.

`DocumentComparison` is an opt-in wrapper for two-column Markdown reading tables. Its native table remains intact; scoped styles fix both columns and wrap long syntax. Put longer multi-part decisions in prose lists. The migration guides use `utils/migration-content.ts` to preserve their complete authored comparisons and code in search and llms output.

Guide authors wrap short two-column reading comparisons explicitly; Reference's
renderer selects the same component after recognizing API, parameter, namespace
and code-table shapes. Wider matrices retain the normal scrolling table.
Language-service settings use the shared option list inside `DocumentDisclosure`;
AI and migration requests use `DocumentPrompt` with their original text.

`components/demo/specimens/` owns the authored examples still used by the Design System gallery. These are not indexed articles. Do not restore retired property MDX just to feed a gallery; add a focused specimen when a real demonstration needs one.

## Content migration sequence

1. For future content migrations, reconcile the inventory with completed canonical-syntax work, public families, preset utility recipes and current APIs. Do not change semantics or force the catalog to a fixed page count.
2. Extract shared foundation data using existing theme/manifest helpers. Move reusable MDX before removing source routes; Typography and Corner Radius own their teaching MDX locally after this migration.
3. Populate complete family/namespace lookups and recipe contracts. Preserve full values, scopes, modes, dependencies, minimal examples and useful lookup specimens; Guide keeps task-specific selections and compositions.
4. Split `tokens/containers`: values/consumers belong to `tokens/container`, query contracts to `rules/conditions`, and teaching to `/guide/responsive-design#based-on-container-sizes`. Responsive design owns query-based layout choices; Layout owns width caps and sizing. Keep breakpoint definitions identified as custom media.
5. Identify the actual owner of useful content before retiring pages. Preserve Master-specific behavior found inside native CSS articles in its owning contract; retain only demos that support a concrete teaching task. Do not create placeholder property catalogs to replace retired pages.
6. Update Guide/Reference navigation, internal links, search tasks, sitemap, Markdown and llms together. Rebuild from authored sources, verify active link targets and remove retired route files.

Completion requires full family/recipe coverage; successful property, prefix and namespace lookup; runnable self-contained Guide examples; identical selected facts across HTML/search/portable output; and no broken imports or meaningful anchors. A preset-value change must update all related presentations without implying that a literal container-query threshold changes with it. Validate lookup by `padding`, `p`, `px` and `padding-inline` alongside concrete design tasks. Preserve the documented conditions on mode and accessibility claims when relocating them.

## Specimen restoration and maintenance

- Move visual content and interactions with the lookup data; validate the public destination before removing the source presentation. Gallery-only retention is insufficient.
- `components/demo/foundations/FoundationTokens.astro` selects a subject-specific presentation. `common/foundation-data/specimens.ts` supplies the same authored scenes to Guide previews and Guide export adapters. Palette rows preserve full hue groups and copy original CSS or variable references with truthful status feedback.
- Reference uses complete collections; Guide passes explicit keys. Reuse typography, role, scale and numeric-table designs with equal care for either selection. A subset has no arbitrary count limit.
- `reference/named-conditions.ts` owns the media and container lookup sheet and its Markdown. Its row anchors, aliases and compiled query coverage must stay complete when the preset changes.
- `reference/sheet-editorial.ts` lists every token and recipe page, its groups and its Usage and Customize examples; `reference/sheets.ts` builds one model per page that renders the HTML view and the portable Markdown. Examples compile through `configuredExampleCSS`, which rejects any invalid class; the displayed source keeps the page's own classes and the generated CSS covers only them.
- Verify semantic effects as well as layout: actual text and border colors, multi-line leading, unclipped actual font sizes, distinguishable shadows in both modes, and actual timing values. Keep animation controls paused initially and respect reduced motion.
- [Restoration inventory](../../.ai/reports/foundation-visual-restoration.md) maps the pre-migration baseline to public destinations and records comparison evidence. Update it when a presentation moves.

## Validation

For policy/inventory-only changes, run site lint and `bun run check:ai-context`. The following content/build/browser checks apply when the corresponding public sources or rendering pipeline migrate; recording the policy alone does not establish their results.

Start from the usual package-warmed workspace (`bun run build:site` performs the full orchestration). Focused commands:

```sh
bun run --filter site prepare-app
bun run --filter site test:reference
bun run --filter site test:syntax
bun run --filter site test:llms
bun run --filter site test:docs-examples
bun run --filter site lint
bun run --filter site type-check
bun run --filter internal test
bun run check:ai-context
```

`internal` has no package-local lint script. Shared search, heading and table changes also require Guide regression checks. Inspect 390px, 768px and 1280px layouts, keyboard selection, one-press Escape, focus restoration, direct row links and reopening search with its query preserved.

`search-tasks.ts` is the fixed acceptance query set. Technical queries run in every edition; visible-title queries use that edition’s authored title. `reference.test.ts` covers corpus completeness, aliases, source metadata, stable anchors, relationships, pilot rendering/Markdown parity and complete configured examples. The tests fail on missing adapters instead of claiming an incomplete export is complete.

## Outcome evaluation

Automated checks establish content and implementation correctness. They do not establish human task completion times or agent success rates. Use `evaluation.json` for the pending outcome study:

- Recruit at least five new and five experienced users. Record success and time for simple lookup (target median ≤30s), variant selection (≤60s) and cross-concept review (≤3min); target ≥80% correct completion.
- Run the twelve fixed tasks through two actual agent retrieval workflows: HTML/browser retrieval and per-page Markdown/index retrieval. Record model/version, available tools, retrieved documents, answer, generated changes and behavioral check results. Target at least ten passing tasks in each workflow.
- Keep failures, rewritten queries and incorrect assumptions. Evaluate semantic retrieval or deeper Play integration only after the lexical index and authoritative content fail a concrete task.

No chat interface, vector database, new docs MCP, new CMS or runtime semantic implementation is introduced by this work.

Migration guides use `utils/migration-content.ts` for strict search and portable
exports, including the overview. `MigrationGuides` reads the literal
`utils/migration-guides.ts` catalog through the shared `ui-logos` navigation;
its extraction adapter emits the same titles and destinations, with descriptions
for the text-only reading context, without executing JSX.
Use `DocumentChoices` for short related-link groups, outside demo geometry.

`tests/docs-quality.e2e.mjs` enumerates the current build's document routes,
including localized routes. Run it after building; `MASTER_DOC_BUILD` and
`MASTER_SITE_URL` also let it audit Master. Historical review JSON files do not
control route coverage. `MASTER_DOC_CAPTURE=0` runs the geometry and runtime
checks without retaining screenshots; inspect captures for affected components
separately before claiming visual approval.

`DocumentFlow` presents short, static ordered processes outside demo geometry.
`DeliveryFlow` reads six literal recipes from `utils/delivery-flows.ts`;
`utils/delivery-content.ts` exports the same titles, ordered steps and captions
for the delivery guides. Keep future recipes paired with a Markdown adapter.
The strict extractor recurses through `StepSection`, `Step` and heading children,
preserving authored headings and code fences.

`DemoWaterfall` is a conceptual resource-discovery diagram, not a measured chart.
`ResourceWaterfall` reads literal illustrative rows and their text descriptions
from `utils/first-paint-examples.ts`; the delivery adapter exports the same
explanation. `DemoStyleComparison` renders identical trusted HTML in two iframes,
with author CSS only in the second. `FirstPaintComparison` uses generated CSS
from the same literal classes and exports both HTML and CSS. Keep these server
recipes registered explicitly in MDX; the client-safe demo barrel exports only
the presentation components, not the compiler-backed recipes.


File and directory structures use the shared `ExplorerView`, including package
authoring, monorepo and route-level styles. `reference/markdown.ts` reads the
component's literal `items` and exports that same hierarchy through `fileTreeText`;
do not map an `ExplorerView` to a fixed, separately maintained tree.
`project-style-content` exports the first two guides, including the shared literal package
source, HTML and generated CSS. The package recipe stays outside client barrels.
Its focused fixtures compile the actual package entry through the public build
resolver and verify independent app-root overrides. Browser checks exercise the
real keyboard focus, hover and motion preference. Standalone package discovery
and inspect-report limitations are documented separately from the site tests.

### Native feature and view-transition recipes

Compatibility reuses `ProjectStyleExample` for the native textarea and relational
selector examples. `DemoFeatureSupport` reports `CSS.supports()` without altering
their CSS; portable content retains the condition and fallback explanation.
An empty configured source omits the Configuration block in both HTML and Markdown.

`DemoViewTransition` loads dedicated example documents for view selection and article
navigation. The small shared hook owns only that iframe's root classes, native
transition lifecycle, reduced-motion handling and focus restoration. Keep snapshot
names unique, preserve immediate updates, and check both card columns and focus at
narrow widths. The guide's full framework-neutral examples remain in its MDX.
`guide-platform.spec.ts` covers native snapshots, absent APIs, native form controls,
portable guide anchors and the six-size/theme gallery matrix.

### Tooling documentation

`DocumentOptions` presents identifiers beside their defaults and descriptions (`ui-params`).
`DocumentCodeExample` pairs server-highlighted source and result in one `ui-tray`; each
named code block carries its label and copy control. `tooling-guide-data` supplies the literal recipes to the UI and
the strict `tooling-content` export adapter. Keep settings, complete code and actual
diagnostic messages available in both search and portable Markdown.

`tooling-examples-checks` runs the documented fixes through ESLint and verifies
completion, hover and formatting against the language service. The browser matrix
checks readable option widths, complete code, stable anchors, keyboard copying and
clipboard failure at 390, 768 and 1280px in both themes. These are static tool-output
examples, not a simulated editor or a browser lint runtime.


### Agent workflow documentation

`DocumentPrompt` renders wrapped, copyable prose without implying an editable or
executable field. `agent-guide-data`, `agent-options`, and `agent-style-example`
feed both the site-owned recipes and strict `agent-content` export adapter.
Preserve every prompt, tool identifier, workflow step, and configuration example
in search and portable output. Keep client setup instructions linked to their
primary documentation; registration does not imply a loaded project manifest.

`agent-examples-checks` verifies the actual stdio server catalog and documented
preview/apply request in a temporary workspace, including unchanged previews,
consumed tokens and stale-file rejection. The browser matrix checks wrapped prose,
clipboard keyboard feedback and failure, stable anchors, and native button states.


### CLI and MCP catalogs

The CLI and MCP catalogs each occupy one page. `tool-contracts` discovers current
commands and tools through public help and `tools/list`; concise guidance identifies
purpose, file effects and how to obtain the full contract from the installed tool
or GitHub. Do not embed complete schemas or command help in website or portable
output. Keep literal examples checked in disposable projects through the existing
CLI/MCP fixtures. The Guide owns setup and the complete preview/apply workflow.

### Directive examples

`StylesheetExample` accepts literal standalone CSS and renders complete source/result
blocks using the public compiler and render session with the current preset.
The fixture checks parity with `compileRenderedStylesheet`, including resources. Its strict MDX
adapter emits the same CSS to Reference, search and portable Markdown. Use temporary
file fixtures when a lesson depends on imports, references or resource ownership.
Keep this compiler-backed component outside client barrels.

The directive renderer keeps the opening section anchor without repeating the page
title. All published headings remain in the exported contract. Imports owns
stylesheet delivery; Theme owns token declarations; Query definitions owns custom
media and containers; Utilities and mixins owns reuse definitions; Scanning owns
file and candidate filters; Native CSS pruning owns per-file policy and keyframes.
Update incoming links directly when moving an entry. The source contract also
retains compiler-delivery fixtures used by documentation tests; these appendices
are not separate public directive pages. Only the exact Setting/Default/Effect table shape becomes
`DocumentOptions`; inline code and links remain part of the description.

Stylesheet pairs use explicit `stylesheet=source` and `stylesheet=result` fence
metadata beneath their bold title. The renderer recognizes that trio independently
of additional disclosure metadata and reuses `DocumentCodeExampleView` with prepared
highlights; the source block carries its copy control and the result sits in the closed
Generated CSS disclosure. Plain source fences
retain their normal code rendering. Keep source strings literal; JSON string
expressions preserve indentation that MDX can strip from multiline attributes.

### Package source catalog

`package-contracts` builds one `/reference/packages` document from public API census,
package exports and `package-editorial`. Import paths and qualified symbol aliases
point to their owning package section. That section explains purpose and lifecycle
and links to current `rc` source and export mappings. Full declarations remain in
GitHub and installed packages. The Design System uses small public type references;
it does not load a generated declaration catalog. The standard document renderer
keeps indexes, anchors and source links in search and portable output.

### Installation sequences

The document shell's `StepSection`, `Step`, `StepL` and `StepR` keep setup prose
and native headings in the MDX document. `Step` with `$row` responds to the reading
container; the `ui-steps` list numbers each step in CSS. The
Design System review uses these same Guide components. Keep preview geometry outside these steps.
The strict extractor preserves each native heading and code block. `DocumentChoices` accepts literal string entries for both
navigation and portable link lists; extraction never executes JSX expressions.
`DemoIndex` uses the same literal-only extraction for grouped catalog links. Keep
group titles and destinations in authored MDX so portable output retains the index.
`DemoCatalog` uses native disclosures for independent specimens; complete lesson
content remains in the linked Reference documents and is never inferred from a
collapsed preview or a gallery title.

`installation-content` normalizes reviewed setup routes for search and LLM output.
`InstallationGuides` shares its complete framework link catalog with its Markdown
adapter. Register subsequent installation routes as they are reviewed. Temporary
fixtures run the public installer plan/apply APIs, actual Vite builds in runtime and
static modes, and the documented CLI command; they do not install packages or alter
the repository. CDN browser tests serve the actual packaged runtime, manifest and
Wasm locally and separately verify failed requests and disabled JavaScript.

Framework fixtures compile the authored React, Vue and Lit components and load the
resulting assets in browser tests. Lit checks the actual shadow-root runtime, class
mutation and disconnect/reconnect cleanup. Its example explicitly loads the generated
CSS entry and emits shared tokens with `@theme static` at `:root,:host`, including
the shadow host. The configured preview's `shadow`
variant is a generated-CSS appearance specimen, with that limitation stated in its
caption; it is not the framework lifecycle test.

Bundler fixtures build the complete Webpack, Rspack and Rsbuild examples. Standalone
HTML-plugin templates require an explicit CSS-relative source because they are
outside the app module graph. Rspack uses the installed public core API when its
optional CLI is unavailable. Compare exact class token sets, since production HTML
minifiers may reorder them.

Astro and SvelteKit fixtures build authored pages, verify initial CSS without
JavaScript where applicable, and exercise post-load class mutation. SvelteKit
requires the explicit virtual runtime import in its root layout. The Astro 7 static
production asset-delivery limitation is documented with a tested CLI fallback; do
not silently replace that check with an appearance preview.

Server-host fixtures build the authored Vite configurations into a dedicated public
subdirectory and preserve unrelated host assets. Express and PHP run actual local
servers. Rails assets use native Ruby ERB with explicit host-helper stubs because
Rails is not installed; this verifies templates and browser assets, not Rails or
Turbo integration. Runtime paths check class mutation and node replacement; all
paths check content visibility without JavaScript, and static/progressive paths
additionally check initial styling. Follow every emitted CSS import when checking
output, not only the entry stylesheet.

Theme fixtures run actual Laravel Vite, WordPress Vite and Shopify Vite builds.
WordPress PHP hooks execute against explicit argument-recording stubs; Blade and
Liquid asset tags have small literal adapters. These checks do not replace full
CMS/storefront tests. Browser delivery uses a separate asset origin and nested
child-theme paths to verify relative runtime resources and CSS imports. Keep the
WordPress module enqueue API and version requirement in the authored guide.

.NET fixtures build the authored Vite files and scan Razor source. The local
machine lacks the .NET SDK: explicit literal adapters resolve host tags for the
asset-only browser test. They do not verify Razor compilation, `@Assets`
fingerprinting, Blazor startup or enhanced navigation. Check relative assets under
a nested path, visibility without JavaScript, static initial styling and runtime
DOM observation. Keep build-before-publish ordering in the authored guides.

Storybook is not installed locally. Its fixture executes the authored Vite config
and viteFinal hook, imports the preview stylesheet, and mounts the authored React
story through an explicit small adapter. This validates actual runtime/static CSS
inside an iframe and prevents leakage into the parent, but does not validate the
Storybook builder, manager or CSF loader. Use the workspace Vite version rather
than whichever transitive Vite version sorts first in the package store.

Angular fixtures use the installed Angular 22 CLI and compiler to build the actual
authored templates and index documents. Runtime checks serve the packaged CDN
script, manifest and Wasm through intercepted requests; they cover DOM updates and
Angular mounting after runtime failure, not external CDN availability or SSR.
Static checks run the real CSS CLI before Angular copies public assets and verify
that no Master CSS runtime or Wasm request occurs. Neither path claims that a
client-rendered Angular app mounts without JavaScript. The earlier direct installer
probe built successfully but omitted its browser Wasm asset; keep that package
limitation separate from the verified site examples.

Next.js fixtures build all three authored configurations with the real Next.js 16
App Router and run production servers. They verify initial CSS with JavaScript
disabled, runtime DOM updates, and the request-time response boundary through an
extra dynamic route. Progressive build output styling does not imply dynamic SSR
transformation. Static TypeScript config uses an async function: the installer’s
top-level await form fails in the TypeScript config loader. Test that documented
correction without changing the integration package. Fixture apps live in workspace
scratch space for Turbopack’s symlink boundary; browser setup builds each once and
shares read-only production servers across viewport/theme projects.

Nuxt fixtures build the authored Nuxt 4 config, root stylesheet and app/app.vue
through the installed module, then run actual Nitro production servers. All modes
retain framework SSR. Browser checks cover initial styling without JavaScript,
runtime DOM updates and keyboard mode navigation. The root CSS alias is explicit:
the installer creates assets/css/master.css but does not add the entry to an
existing config. Progressive startup currently reads an absolute build-time
manifest path; a separate relocation probe fails with ENOENT when that manifest
is removed. Keep this documented package limitation distinct from successful
in-place production checks; the fixture does not claim portable deployment.

React Router's framework CLI is not installed locally. Its fixture explicitly
supplies Vite client/server entrypoints and a route/asset manifest, then executes
the installed public createRequestHandler, ServerRouter and HydratedRouter APIs.
Authored root and route modules, Master CSS compilation and virtual runtime startup
are unchanged. This validates real SSR, hydration, initial CSS without JavaScript
and runtime DOM observation, not framework CLI loading or a host deployment.
Runtime setup imports virtual:master-css-runtime once because framework HTML does
not pass through Vite's index.html injection hook. Keep that step in portable prose.

TanStack Start fixtures compile the literal authored Vite config and routes with
its installed compiler, then serve the generated fetch entry and client assets
through a local Node HTTP adapter. Browser tests require successful real SSR,
hydration, initial static CSS without JavaScript and runtime class observation.
Host-provider adapters and CLI scaffolding remain outside this fixture. Runtime
uses a dynamic virtual-module import guarded by !import.meta.env.SSR; an eager
root import makes the server request a manifest asset that TanStack emits only
for the client. Keep the browser-only guard in both visible and portable examples.


Master owns Blog, Brand and Design System content, portable exports and browser
review fixtures. Product navigation links to master.co; keep legacy published
paths in scripts/organization-redirects.ts. The product importer still verifies
committed icons and download archives, with authored asset guidance supplied by
the Master repository. Shared MDX extraction is provided by
@master/internal-site/css/markdown.ts; reference/markdown.ts supplies only
product-specific study, illustration and token adapters.

Benchmarks uses utils/benchmark-content.ts to export the authored static chart
models and complete tables to Markdown and search. Keep its explicit component
registry strict: never execute arbitrary MDX or client components. Values come
from the same committed snapshot-backed props used by the page. Add an adapter
and export test whenever a new presentation component contains meaningful data.
Snapshot dates and sources stay beside each suite; source commands belong in
portable document content. Do not regenerate benchmark measurements for a visual
or editorial change.

Authored `DocumentOptionList` / `DocumentOptionEntry` compositions retain each literal name and all MDX description paragraphs in portable output. Use them for interfaces whose constraints must remain readable at narrow widths.
