# Maintaining the Reference

Reference verifies language and tool behavior during writing, explanation and review. Guide pages teach a workflow and link to the formal contract. Avoid separately maintaining the same rule in both places.

## Sources and outputs

| Content | Source | Generated facts |
| --- | --- | --- |
| Existing utilities | `app/[locale]/reference/*/{metadata.ts,syntaxes.ts,content.mdx}` | Public tooling declarations, aliases, examples and full CSS |
| Language rules | `app/[locale]/guide/*/contract.mdx`, routed by `editorial.ts` | Complete `Class2CSS` and configured examples |
| Directives | `app/[locale]/guide/directives/contract.mdx` | Named sections in the directive Reference |
| Tokens | Public preset manifest and tooling builtins | Names, values, modes, conditions and consumers |
| CLI | Public `master-css` binary | Actual `--help` output |
| MCP | Public stdio `tools/list` protocol | Actual tool descriptions and input/output schemas when advertised |
| Package APIs | Published exports and public TypeScript entrypoints | Declarations, overloads and public names; API census controls visibility |

The declarations, selectors, conditions and directives Guide routes redirect through `utils/legacy-syntax.json`: known rule anchors lead to Reference, while other visits lead to a step in the Getting Started Syntax Tutorial. They have no indexed teaching body. Other Guide locations retain their workflow content and old anchor entrances. Rule registry entries separate the `source` contract path from the `guide` learning URL. The `contract.mdx` files remain beside existing MDX includes during migration. They are the single authored source consumed by Reference, not a second copy of the Guide.

`prepare-app` builds `.generated/reference.json`, the searchable documents, `public/reference/index.json`, per-page English and Traditional Chinese Markdown URLs, and section text bundles. `build:llms` reuses the same normalized Reference in `llms.txt` and `llms-full.txt`. Generated outputs are ignored; edit their sources.

The current source revision and semantic/content digests identify the build inputs. Current-version URLs can change between builds; these are not historical version snapshots. A local dirty checkout is not a published immutable document.

Individual document pages render their authored or generated body directly. Do not inject a version/source/Markdown toolbar, a page-level copy-example control, a generic Related reference section or an extra alias list. Keep the body as the reading source of truth; search and machine exports derive from the existing shared content model.

## Editing safely

1. Keep existing utility URLs. Add new contracts through the section registry instead of creating a URL for every alias or token.
2. Preserve explicit heading IDs. In MDX, write `## New title \{#stable-id\}`. The braces must be escaped for MDX; the visible title and exported Markdown omit the marker. Add an old anchor entrance when moving a section.
3. Add prose for prerequisites, exceptions and intended use. Placeholder syntax rows describe declaration shapes, not the full grammar of accepted values.
4. Keep a text equivalent for every meaningful component. `markdown.ts` handles `Overview`, `Class2CSS`, literal `Code`, local MDX includes, token tables and configured examples. Unsupported components are reported and fail the coverage test. Do not execute arbitrary JSX to extract prose.
5. Use `ConfiguredExample` for classes that depend on custom theme settings. It compiles the configuration through the public compiler before generating CSS with the public engine.
6. Add identifiers and task vocabulary in `editorial.ts` only when useful. Search performs retrieval, not syntax interpretation. Project-specific validation belongs in existing CLI, MCP or Play workflows.
7. When changing tool registrations or exports, rebuild their packages before generating docs. CLI/MCP descriptions come from the built public binaries. API declarations resolve public entrypoint source files, with published declarations used for entries without a source counterpart.

The first content language is English. Traditional Chinese navigation remains available and per-page Markdown explicitly identifies English fallback. Preserve semantic IDs and identifiers when adding a translated body; do not silently label English prose as a completed translation.

Guide and Reference overviews share `site/components/DocumentationIndex.tsx` and `site/styles/documentation-index.css`. Reference adapts its catalog in `reference/Index.tsx`; Guide derives its primary teaching entries from existing category metadata through `site/utils/guide-overview.ts`. That Guide model also supplies overview search nodes during `prepare-app` and its body in llms exports. Keep category anchors and metadata-derived links aligned when changing either overview. Section icons are keyed by section ID. The old `#syntax-tutorial` overview anchor belongs to Getting Started. `utils/syntax-tutorial.ts` uses the Reference component adapters to include generated CSS and complete configured examples in tutorial search and llms output.

Design Foundations use `utils/foundation-content.ts` for search and llms bodies. Its strict adapters expand local MDX and generated CSS without executing JSX. Guide-local data modules supply the same token values, descriptions and namespace groups to SSR tables and exports. Register new data-bearing components there; visual recipes may be omitted only when their lesson and portable code are in the adjacent authored body. Search keeps explicit heading markers; portable Markdown converts them into anchor elements. Reference's `Overview` syntax-table behavior remains the default and Guide includes opt into their own handling.

The four project styling guides use `utils/project-style-content.ts` with the same strict parser. `ProjectStyleExample` reads the literal configuration and HTML from `components/demo/project-style-examples.ts`; that data supplies the iframe, code blocks and portable export. `DemoConfiguredExample` also has a direct literal-prop adapter. Keep full configuration and generated CSS in exports even when the page collapses the generated output.

`ConfiguredExample` accepts either a class array or trusted literal HTML, including local raw HTML specimens. It compiles with the public render session and tooling native-declaration support, matching iframe previews. Generate CSS from the displayed source instead of maintaining cached CSS specimens; keep any configuration required by the output, such as `mode-trigger`, explicit.

Namespace consumers come from `utils/variable-namespace-sources.ts`, which combines the public native-value and utility registries. Do not derive this index from defined preset values: registered consumers such as `order:` may have no preset token. The normalized Markdown retains every consumer. `DocumentNamespaceTable` renders the same rows with native disclosures for long lists; its focused parser only recognizes the explicit Namespace/Consumers table shape.

`DocumentCodeTable` keeps short syntax tokens intact while native CSS wraps at spaces. Reference adapts only two-column Token/CSS or Syntax/CSS tables whose cells each contain one code span. Keep long generated rules in code blocks; the authored Markdown remains the export source.

`DocumentComparison` is an opt-in wrapper for two-column Markdown reading tables. Its native table remains intact; scoped styles remove size containment, wrap long syntax and keep both columns visible. Put longer multi-part decisions in prose lists. The four reviewed migration guides use `utils/migration-content.ts` to preserve their complete authored comparisons and code in search and llms output.

## Validation

Start from the usual package-warmed workspace (`pnpm build:site` performs the full orchestration). Focused commands:

```sh
pnpm --filter site prepare-app
pnpm --filter site test:reference
pnpm --filter site test:syntax
pnpm --filter site test:llms
pnpm --filter site test:docs-examples
pnpm --filter site lint
pnpm --filter site type-check
pnpm --filter internal test
pnpm run check:ai-context
```

After a full static build, `pnpm --filter site test:syntax-migration` checks the retired routes’ noindex/canonical metadata, no-JavaScript links and sitemap exclusion, including canonical route copies.

`internal` has no package-local lint script. Shared search, heading and table changes also require Guide regression checks. Inspect 390px, 768px and 1280px layouts, keyboard selection, one-press Escape, focus restoration, direct row links and reopening search with its query preserved.

`search-tasks.ts` is the fixed 30-query acceptance set. `reference.test.ts` covers corpus completeness, aliases, source metadata, stable anchors, relationships, pilot rendering/Markdown parity and complete configured examples. The tests fail on missing adapters instead of claiming an incomplete export is complete.

## Outcome evaluation

Automated checks establish content and implementation correctness. They do not establish human task completion times or agent success rates. Use `evaluation.json` for the pending outcome study:

- Recruit at least five new and five experienced users. Record success and time for simple lookup (target median ≤30s), variant selection (≤60s) and cross-concept review (≤3min); target ≥80% correct completion.
- Run the twelve fixed tasks through two actual agent retrieval workflows: HTML/browser retrieval and per-page Markdown/index retrieval. Record model/version, available tools, retrieved documents, answer, generated changes and behavioral check results. Target at least ten passing tasks in each workflow.
- Keep failures, rewritten queries and incorrect assumptions. Evaluate semantic retrieval or deeper Play integration only after the lexical index and authoritative content fail a concrete task.

No chat interface, vector database, new docs MCP, new CMS or runtime semantic implementation is introduced by this work.

Migration guides use `utils/migration-content.ts` for strict search and portable
exports, including the overview. `MigrationGuides` reads the literal
`utils/migration-guides.ts` catalog through `DocumentChoices`; its extraction
adapter emits the same titles, destinations and descriptions without executing JSX.
Use `DocumentChoices` for short related-link groups, outside demo geometry.

`DocumentFlow` presents short, static ordered processes outside demo geometry.
`DeliveryFlow` reads six literal recipes from `utils/delivery-flows.ts`;
`utils/delivery-content.ts` exports the same titles, ordered steps and captions
for the delivery guides. Keep future recipes paired with a Markdown adapter.
The strict extractor recurses through `StepSection`, `Step` and heading children,
removing decorative `StepNum` while preserving authored headings and code fences.

`DemoWaterfall` is a conceptual resource-discovery diagram, not a measured chart.
`ResourceWaterfall` reads literal illustrative rows and their text descriptions
from `utils/first-paint-examples.ts`; the delivery adapter exports the same
explanation. `DemoStyleComparison` renders identical trusted HTML in two iframes,
with author CSS only in the second. `FirstPaintComparison` uses generated CSS
from the same literal classes and exports both HTML and CSS. Keep these server
recipes registered explicitly in MDX; the client-safe demo barrel exports only
the presentation components, not the compiler-backed recipes.


Package authoring and monorepo guides use `DocumentFileTree` through the shared
`package-trees` data. Keep its nested-list UI and plain-text export aligned.
`project-style-content` exports both guides, including the shared literal package
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

`DocumentOptions` presents long identifiers above their defaults and descriptions.
`DocumentCodeExample` pairs server-highlighted source and result with a small client
clipboard control. `tooling-guide-data` supplies the literal recipes to the UI and
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


### CLI and MCP contracts

`mcp-editorial` and `cli-editorial` own site explanations, literal requests,
command examples, output interpretation and file effects. `tool-contracts` merges
them with actual public `tools/list` and command help. `tool-parameters` is a
presentation adapter; it never supplies protocol semantics. Missing or stale MCP
field descriptions fail generation. Keep the complete original schemas and help
in normalized Markdown even when the page initially collapses them.

The renderer recognizes only the exact Parameter/Type/Requirement/Description
table shape for `DocumentParameters`, and explicit code-fence disclosure metadata
for `DocumentDisclosure`. Other tables and code keep their existing rendering.
The native disclosure and definition lists remain server components. Narrow MCP
identifier titles use a site-scoped fluid font size; title text remains unchanged.

`tool-contract-examples` exercises all documented MCP requests in a disposable
workspace, then runs only read-only contributor requests against this repository.
`cli-contract-examples` runs the literal curated shell commands in a temporary
project, including watcher startup and shutdown. Share the stdio fixture with
the agent guide checks. Do not run preview/apply examples against this checkout.


### Directive examples

`StylesheetExample` accepts literal standalone CSS and renders complete source/result
blocks using the public compiler and render session with the current preset.
The fixture checks parity with `compileRenderedStylesheet`, including resources. Its strict MDX
adapter emits the same CSS to Reference, search and portable Markdown. Use temporary
file fixtures when a lesson depends on imports, references or resource ownership.
Keep this compiler-backed component outside client barrels.

The directive renderer keeps the opening section anchor without repeating the page
title. All headings remain in the exported contract. The old `related-contracts`
anchor remains available; authored links replace the generic related-contracts
paragraph. Only the exact Setting/Default/Effect table shape becomes
`DocumentOptions`; inline code and links remain part of the description.

Stylesheet pairs use explicit `stylesheet=source` and `stylesheet=result` fence
metadata beneath their bold title. The renderer recognizes only that exact trio
and reuses `DocumentCodeExample` with native keyboard copy buttons. Plain fences
retain their normal code rendering. Keep source strings literal; JSON string
expressions preserve indentation that MDX can strip from multiline attributes.

### Package API presentation

`package-declarations` emits TypeScript declarations in memory before resolving
public entrypoint exports. Never print implementation AST as a declaration: actual
emission owns overloads, inferred types, optional parameters and default expressions.
Presentation removes private class members while retaining constructor restrictions
and protected members. Parameter wrapping changes whitespace only. Named aliases
remain explicit; a default export sharing a named declaration links to that symbol.
`package-editorial` owns the purpose and usage of each public import path.

The exact Import path/Purpose and Export/Kind tables become `DocumentAPIIndex`.
Explicit `typescript declaration` fences become `DocumentDeclaration`; contracts
over 40 lines use a native disclosure with complete server-rendered content and
keyboard copying. Copy controls stay disabled until their event handlers are ready.
`DocumentIdentifier` adds native word-break opportunities at identifier boundaries
without inserting copied characters. The page TOC lists entrypoints; each large entry has its own
symbol index. Full declarations, indexes and stable anchors remain in search and
portable Markdown. `PackageDeclarationExample` reads the generated contract for
the Design System gallery instead of duplicating a long specimen.

### Installation sequences

`DocumentSteps` and its heading, text and body primitives keep setup prose in the
MDX document. Optional columns respond to the reading container; decorative numbers
are hidden from assistive technology. Keep preview geometry outside these steps.
The strict extractor preserves each native heading and code block and omits only
the decorative counter. `DocumentChoices` accepts literal string entries for both
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
CSS entry and emits shared tokens with `@theme static`: a generated `:root` inside
a shadow stylesheet does not select the host. The configured preview's `shadow`
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


Brand asset metadata is exported through utils/brand-content.ts. Keep asset labels,
URLs and policy in portable/search output; preview components must preserve the
original artwork and native download behavior. DocumentationIndex group IDs use
canonical source names, independent of translated labels. Keep both category and
A–Z destination sets complete. The final-pages dogfood matrix serializes the large
Design System SSR workload; retain runtime error assertions and use production
output for concurrent/cold-load validation.

Benchmarks uses utils/benchmark-content.ts to export the authored static chart
models and complete tables to Markdown and search. Keep its explicit component
registry strict: never execute arbitrary MDX or client components. Values come
from the same committed snapshot-backed props used by the page. Add an adapter
and export test whenever a new presentation component contains meaningful data.
Snapshot dates and sources stay beside each suite; source commands belong in
portable document content. Do not regenerate benchmark measurements for a visual
or editorial change.

Authored `DocumentOptionList` / `DocumentOptionEntry` compositions retain each literal name and all MDX description paragraphs in portable output. Use them for interfaces whose constraints must remain readable at narrow widths.
