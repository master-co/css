# Site AI Instructions

These instructions apply to the `site/` workspace. They extend the repository root `AGENTS.md`; follow the root instructions first, then apply these site-specific rules. Keep this file named `AI.md`.

## Responsibility

The `site` workspace owns the public Master CSS documentation site, examples rendered inside docs, user-facing guide content, and site-specific visual demo implementation.

## Document Shell Ownership

- Master owns reusable navigation, layouts, contexts, MDX rendering, page factories, styles, fonts, artwork and presentation primitives in `@master/internal-site`.
- Consume an exact published package version. Edit the source in the Master repository and validate a packed consumer before upgrading; do not copy shared implementation back into this repository or use a cross-repository source submodule.
- Product guides, generated reference, semantic examples, real benchmark inputs, preparation adapters and homepage composition remain here. Master owns organization Blog articles, `/brand` and `/design-system`; preserve old URLs with redirects only after verifying their destinations.
- The shared `styles/system/DESIGN.md` owns `ui-*` and `--ui-*` contracts. Import component styles at their owning boundary; do not reintroduce `doc-*`, `app-*` or `code-*` shell classes.
- Shared skills are distributed by `@master/internal-skills`. Run `skills:sync` explicitly and commit the managed files and hash lock. Keep Master CSS-specific extensions in their own skill directories.

## Owns

- Public guide/reference content and product-specific examples under `site/content`.
- Product data, navigation, dictionaries, preparation and export adapters.
- Homepage composition and Master CSS semantic/benchmark demonstrations.
- Consumer configuration in `site.config.ts` and Cloudflare/Astro build settings.
- Product verification scripts; shared component tests belong in the Master package.

## Does Not Own

- Core package behavior; verify behavior from source/tests before documenting it.
- Root-level public docs outside `site/` unless maintainers request them.
- Package-local AI instructions.
- Compiler, runtime, scanner, integration, or engine fixes unless explicitly requested as part of the same task.

## Astro Architecture

The site is an Astro static build (`astro.config.ts`, output `site/out`). Astro owns routing, the document head, the build and server-rendered markup (`.astro`); Svelte 5 (runes) renders interactive islands (`.svelte`).

- `@master/internal-site/astro` injects the route and owns the document shell. `site.config.ts` supplies content, app, sections, navigation, styles and server-only highlighter module URLs. Ordinary guide documents use `content.mdx` and `metadata.ts`; specialized pages retain `page.astro`. Dynamic routes enumerate from lightweight `params.ts` modules without importing page or specimen catalogs. Nested `layout.astro` modules wrap pages; `(group)` directories add no URL segment. The product-specific Reference section remains local; bare examples use the shared section.
- English is unprefixed; Japanese uses `/ja`, Taiwan Traditional Chinese `/tw`, Korean `/ko`, and Simplified Chinese `/cn`. HTML/SEO language tags are `en`, `ja`, `zh-TW`, `ko`, and `zh-CN`. `@master/internal-site/astro/site-context.ts` derives the locale, canonical pathname and translations from the URL: `.astro` components read them with `siteOf(Astro)`, Svelte components with `getSite()` from `@master/internal-site/site` (the server renderer `@master/internal-site/astro/svelte-renderer.ts` provides it as context; hydrated islands read the page's serialized `#site-context`).
- Components that only render markup are `.astro`. Interactive components are `.svelte` and hydrate with an Astro directive where an `.astro` or MDX file uses them: `client:load` for shell chrome visible at first paint, `client:idle={{ timeout: 500 }}` otherwise (an animated page may never be idle without the timeout). Canvases and figures watch their own visibility before painting; avoid `client:visible`, which waits for the island's own box and leaves surrounding server-rendered parts of a figure inert. Svelte components imported by another Svelte component hydrate with it; Svelte components used from `.astro` without a directive render statically. Island props must be serializable; slots reach Svelte as snippets (`children`, or the slot's name) and stay static HTML. Delegated document behavior lives in `@master/internal-site/docs-shell/scripts/document.ts`.
- MDX compiles through `@astrojs/mdx` with the `unified` processor. `@master/internal-site/docs-shell/remark/markdown-components.js` turns fences, inline code and `(o)`/`(x)`/`(i)`/`(!)` paragraphs into site components and generates static imports and a `components` export for only the transformed Markdown elements and built-in JSX components used by that module; the legacy component map remains an explicit compatibility export. Markup passed as a prop to an `.astro` component renders with `@master/internal-site/docs-shell/components/RenderNode.astro`; to a Svelte component, pass it as a named slot.
- Pages, layouts and sections load through `@master/internal-site/astro/propagated-assets.ts` so each page links only its own stylesheets. Keep that private Astro contract in one module. Import page content statically (`import * as content from './content.mdx'`): Astro collects the stylesheets when the page module loads, so CSS behind a pending dynamic import is missing in development.
- Master CSS is pre-rendered (`@master/internal-site` uses `masterCSS({ mode: 'prerender' })`): each page receives the rules for the classes in its server HTML, and no browser runtime generates later ones. Every class an island can show must be in that HTML. Keep complete class names in markup and select states with attributes (`invisible[data-lifted]` with `data-lifted={…}`), render alternate views with `hidden` instead of `{#if}` when they introduce classes, and pass unbounded values through CSS variables. Do not build class names from state or add them with `classList`.
- Island props are serialized into every page's HTML. Pass islands only the fields they render; `define()` metadata carries a repository-relative `sourcePath`, never a machine path.
- Public build values are `import.meta.env.PUBLIC_*`, resolved by `utils/public-env.js`. Server bundles keep source `import.meta.url` values (`@master/internal-site/astro/source-url.ts`).
- `prepare-app` projects committed benchmark reports into per-suite `.generated/benchmarks/` display data before loading the content generators. Page rendering, search and Markdown share these synchronous aggregates; source timestamps use a separate small index. Import the generated data rather than raw benchmark reports in presentation modules, and rerun `prepare-app` after updating a committed report.
- SVG imports are Astro SVG components (optimized with the site's SVGO config) usable from `.astro` and MDX; Svelte components import SVG markup with `?raw`. Bitmap imports are Astro image metadata rendered with `@master/internal-site/components/Image.svelte`. Raw text imports use `?raw`; Node scripts load these through `scripts/bundler-imports.ts`. Icons come from `@tabler/icons-svelte-runes` by deep import (`@tabler/icons-svelte-runes/icons/<name>`).

## Local translations

- Complete editions live beside their source: `content.mdx` and `content.{ja,tw,ko,cn}.mdx`. Canonical metadata, authors, dates, categories and ordering stay in `metadata.ts`; translated titles, summaries, figure copy and example descriptions belong in localized MDX frontmatter.
- `@master/internal-site` owns discovery, localized modules and metadata, link localization and the read-only production review gate. `i18n/resources.ts` adds product UI and Reference prose; every published edition needs an explicit independently reviewed record in `i18n/reviews.json`. English metadata and imported prose participate in source fingerprints. Builds never refresh review records.
- Missing or stale translations must fail production. Development may omit incomplete routes, but must not publish English body fallback under a translated URL. Keep drafts outside public output and preserve stable source anchors.
- Short interface and homepage copy uses local dictionaries through `t()`. Shared shell copy stays in the Master repository. Remove obsolete article prose keys only after their consumers have moved to local MDX.
- Code, comments and sample UI remain English. English diagram and social artwork stays shared; localize its surrounding text, alt text, captions and social metadata. `figureCopy()` and `demoCopy()` make HTML/search/Markdown consume the same article-owned prose without duplicating executable data.
- Search, per-page Markdown, per-locale llms, SEO and sitemaps must use the same edition. See `i18n/README.md` for review policy and Taiwan terminology. Do not restore external Batch translation scripts or generated translation exchange files.

## Key Files And Patterns

- Guide pages: `site/content/guide/<slug>/{metadata.ts,page.astro,content.mdx}` plus optional `components/`.
- Example iframe pages: `site/content/examples/<slug>/`.
- Demo images: `site/assets/images/<guide-or-feature>/`.
- Master owns the organization brand handbook and the Master CSS identity page at `https://master.co/brand/master-css`. Interface materials, controls, layout and motion belong to `https://master.co/design-system`; product token values remain in Reference.
- Category data is generated; run `bun run --filter site prepare-app` when adding or renaming pages.

## Risk Areas

- Docs drifting from source behavior.
- Generated CSS examples that do not match current engine/compiler output.
- Interactive demos that fail in the narrow doc content column.
- Token and visual choices that conflict with Design Foundations guidance.
- View Transition API examples with duplicate `view-transition-name` values or missing fallback behavior.
- Site type-check can have unrelated existing errors; do not hide new errors introduced by a change.

## Safe Changes

- Content-only docs updates verified against source/tests.
- Guide page additions using the established page shape.
- Local demo components that follow existing site primitives.
- Data-driven token overview tables using existing helpers.

## Dangerous Changes

- Documenting behavior from memory instead of source/tests.
- Creating a root `docs/` directory without request.
- Exposing framework-specific code in reader-facing examples unless the section is about that integration.
- Using site tokens (`--ui-*`, the `materials.css` and demo-theme utility tokens such as `shadow-raised` or `bg-surface-shell`) in reader-facing example classes. Example frames load them, so they render on the site but fail in a reader's project; teach the preset vocabulary. `reference-demo.test.ts` compiles every taught class against the preset alone.
- Hard-coding preset token rows when they can be read from preset manifest data.
- Placing guide demo images in `site/public/` unless they need stable public URLs outside the bundle.

## Documentation Architecture

Guide pages live under:

```txt
site/content/guide/<slug>/
```

Use this shape:

```txt
metadata.ts
content.mdx
page.astro (optional specialized page)
components/
```

- `metadata.ts` defines public title, description, category, reference links, and `fileURL`.
- Ordinary guides need only `metadata.ts` and `content.mdx`; the shared route renders them using the Guide document configuration in `site.config.ts`. Add `page.astro` only for a specialized page, using the shared Page factory and the local document layout.
- `content.mdx` contains guide copy, code examples, generated CSS examples, and imported local demos.
- `components/` contains interactive demos and guide-local presentational components.

For the View Transitions guide: route slug is `/guide/view-transitions`, title is `View Transitions`, category is `Fundamentals`, and references to the platform feature should use `View Transition API`.

## Content Strategy

For Guide, Reference and Blog research, writing, editing, translation and review, use the project [master-css-writing skill](../.agents/skills/master-css-writing/SKILL.md). It provides editorial methods and task-specific references; the content policies below remain canonical.

Every Guide, Reference and Blog article, except pages in the Integrations category, must include at least one authored explanatory image before it can be delivered as complete. This is a hard minimum, including short and lookup articles. Use [master-css-doc-illustrations](../.agents/skills/master-css-doc-illustrations/SKILL.md) to produce and embed a figure explaining a concrete flow, relationship, scope boundary or comparison beside the relevant text. Interactive demos, code blocks, tables, icons, decorative covers and placeholders do not satisfy the image requirement. Preserve valuable demos in addition to the image; do not replace them just to meet the count. Light/dark variants of the same figure count as one image. Retain editable source, verify both themes and article-scale readability, and preserve meaningful text equivalents in search and Markdown/llms output. An existing qualifying figure may be retained when revising an article; the requirement is a minimum per article, not a new image for every wording edit. Do not waive the minimum based on article length or perceived need.

Integration guides stay code-first: do not add explanatory image assets by default. Use executable commands, configuration, code examples and useful live previews to show setup and verification without maintaining diagrams for each framework. This exception covers all framework/tool pages in the Integrations category; the top-level Installation guide remains subject to the image requirement.

Use [master-css-integrations](../.agents/skills/master-css-integrations/SKILL.md) for integration writing and decorative Master × partner covers. New integration guides include a Hero-material cover; retain suitable covers for wording edits. Covers use paired light/dark artwork below the page header and a light social preview, independently of the explanatory-image exception. Do not replace setup evidence with a cover or add its decorative description to search/Markdown teaching content.

An illustration must pass both explanatory and visual review: matching design tokens does not make a generic box diagram sufficient. Its geometry should reveal the intended relationship or difference. Explanatory colour is allowed through theme-aware roles, with meaning also conveyed by labels, shape or position; follow the illustration skill for composition and verification.

### Current documentation and migration ownership

Public Guide, Reference, Blog, examples and package READMEs describe current behavior only. Describe supported syntax directly; never mention retired syntax, retired API names or version history. Migration Guide covers converting external styling systems. General article bodies do not link to Migration Guide; navigation, catalogs and search may expose it.

MCP Guide and README may list `migrate-to-mastercss` and its purpose of converting external styling systems to current Master CSS. Keep its instructions, examples and comparisons in Migration Guide. Ordinary CSS diffs, fix previews and class-to-generated-CSS teaching remain valid. Preserve native CSS concepts and current failure conditions; do not ban words such as “before”, “after” or “removed” indiscriminately.

### Guide and Reference ownership

The 2026-11-01 consolidation keeps Guide small and Master-specific: fewer, denser task pages, with Reference as the complete lookup source for styling contracts, tokens, recipes, directives, tools and packages. Package APIs, CLI and MCP use concise source catalogs. Syntax Tutorial teaches reusable syntax; Guide teaches design and implementation decisions; Reference defines names, values, mappings and behavior. The [content inventory](../.ai/reports/reference-content-inventory.md) records the audited baseline, the implemented Reference catalog and the disposition of all existing first-level pages. Its size follows current capabilities, not a permanent page budget. The public source migration implements this catalog; retired Reference routes are removed without redirect compatibility, per the user’s implementation clarification. Update active links and exports to their actual content owners.

| Content | Primary owner | Use in Guide |
| --- | --- | --- |
| Complete token names, values, scopes, modes and dependencies | Token Reference | Select the keys needed for the current example |
| Complete canonical prefix / property / namespace mappings | Family index and namespace Reference | Explain the example's mappings and link to the full index |
| Mixin parameters, output, defaults and restrictions | Recipe or directive Reference | Apply the recipe to a concrete task |
| Visual palettes, type specimens and shadow/radius scales | Token Reference | Show one composed usage; link to the complete scale |
| Choosing and combining tokens in a composition | Design Foundations Guide | One decision and one working composition per subject |
| Component, page and responsive compositions | Guide | Keep the complete task and its demo together |
| Grammar, exceptions and failure conditions | Syntax Reference | Explain the constraints needed to complete the task |

Interactivity does not determine ownership. Reference owns complete scales, palettes, values, namespaces, customization blocks and formal contracts; Guide does not repeat them. Guide examples remain self-contained, with practical markup and inspectable generated CSS. Teach each lesson once: when another page owns it, link to that page instead of repeating its example.

### Guide reading flow

- Render file and directory structures with `@master/internal-site/components/ExplorerView.astro`, following [Monorepo](content/guide/monorepo/content.mdx). Do not use plain-text code fences for trees in rendered articles. Keep names and nesting in the component's `items`; the shared product Markdown adapter exports those same items for search and Markdown/llms. Check the rendered tree and exported hierarchy when editing it.
- Use `DocumentOptionList`/`DocumentOptionEntry` or `DocumentOptions` for long settings and defaults, `DocumentDisclosure` for secondary details, and `DocumentPrompt` for copyable prose instructions. Short two-column reading comparisons use `DocumentComparison`; multi-column matrices keep their scrollable table. Ordinary fences and callout markers already use shared renderers. Preserve visible labels and the complete content in search and Markdown; check keyboard disclosure and clipboard behavior when changing these surfaces.
- Start with the reader's task and its result. For visual subjects, show the comparison beside the lesson; for setup subjects, reach the working configuration before listing every tool or diagnostic field.
- Keep the main example, its explanation and its code together. Place independent compiler options, machine-readable contracts and contributor details after the ordinary workflow.
- Use native disclosures for long secondary examples or lookup indexes when they improve reading. Preserve useful content, stable anchors and search/Markdown output; keep the first working task visible.
- Verify hierarchy, line wrapping and controls in the actual documentation column, including mobile and enlarged text. Do not shrink headings or body text to make dense content fit.

### Preserve visual teaching and lookup quality

A documentation migration moves content, visual specimens and interactions together. Before deleting an original presentation, its public replacement must pass visual and functional comparison. Keeping a component only in the Design System gallery does not preserve the documentation experience. Use the task's approved visual reference; `fef197a78` records the original 2026-09-29 restoration baseline. The unified `components/demo/` primitives remain the implementation owner.

Reference pages are structured sheets (`reference/sheets.ts`; pages, groups and examples in `reference/sheet-editorial.ts`) that document only Master CSS syntax, tokens, recipes and directives, never native CSS behavior. Token and recipe pages read Classes → Values → Usage → Customize: Classes maps each class pattern to its declarations; Values lists one token per line without previews; Usage previews several values in one quiet composition whose displayed source keeps only the page's own classes (`…` stands for the rest) beside their generated CSS; Customize shows the `@theme` or `@utility` change. Tables use `ui-table` and bleed with code; each Usage example is one `ui-tray` (stage, source, Generated CSS), like the Guide's demos. Guide keeps the visual comparisons needed to make a design decision.

`FoundationTokens` renders selected Guide scales and `FoundationPalette` renders the full Guide palette from shared facts; the Reference Color page reuses the same palette matrix. `@master/internal-site/css/foundation-data/specimens.ts` owns the Guide's presentation models; the public compiler resolves their classes. Match those selections and example sources in HTML, search and Markdown/llms. Test semantic coverage and text equivalence, not bans on presentation component names. Keep preset facts separate from editorial advice.

For a visual migration, record old → new destinations and compare complete sections at 390, 768 and 1280px in light and dark. Verify actual effects, native keyboard focus, clipboard success/failure, paused motion, reduced motion, responsive controls and anchors. A compiling page without overflow is not sufficient evidence of visual quality. See the [restoration inventory](../.ai/reports/foundation-visual-restoration.md).

Package APIs, CLI and MCP each use one Reference entry: `/reference/packages`,
`/reference/tools/cli` and `/reference/tools/mcp`. Keep purpose, public names,
necessary lifecycle/file effects and links to Guide there. Full declarations,
options and schemas belong to GitHub or the installed tool’s `--help`/`tools/list`.
Preserve package, symbol, command and tool search through section anchors. Do not
restore per-symbol, per-package or per-tool pages to mirror the source.

### Page admission and retirement

- A new standalone Reference must document a public Master-specific contract that native CSS knowledge, an existing general rule or one registry row cannot fully explain. Cover verifiable inputs, output, scope, defaults, dependencies, overrides or errors as applicable.
- New token families enter the complete generated index and namespace consumers first; one added family does not require a new URL. A preset namespace with its own value collection and contract may have a data-driven lookup page. Keep closely related recipe variants together.
- Retire standalone references whose purpose is native property/value/selector instruction, including `/reference/display`. Teach direct declarations and selector composition once, link to authoritative native CSS sources, and preserve any Master-specific output differences in the owning contract.
- Property pages containing token mappings contribute that information to the family index and namespace pages. Preserve embedded recipe contracts before retiring or narrowing their old pages. Removed capabilities belong in Migration Guide.
- Existing demos, another framework's page list, CSS property coverage and anticipated SEO exposure do not independently justify a page. The documentation catalog is not a browser or engine support whitelist.
- A new Guide must serve a concrete task with an executable example and a verifiable result. Existing and new pages follow the same admission rules; retain content for its present purpose rather than prior production effort.

Design Foundations has four guides: Color (roles, hue aliases, surfaces with radius and elevation, light/dark modes), Typography (text treatments vs font tokens, site typeface), Layout (composition, spacing and sizing decisions, page wrapper) and Responsive design (viewport breakpoints from custom media, container queries, strategy). Motion facts live in Reference `tokens/motion`. Complete lookup tables, scales and consumer mappings live in Reference only.

Merge `/reference/tokens/containers` into the appropriate destinations: size values and consumers in `tokens/container`, query contracts in `rules/conditions`, and component adaptation in `/guide/responsive-design`. Explicit container-query thresholds do not consume or track theme tokens. Preset breakpoints come from custom media, not theme custom properties. Keep color role lookup groups without implying alternate token prefixes or independent family resolution.

### Shared facts and presentation

Use preset data for values, scopes and dependencies; Rust-inferred `tokenFamilies()` metadata for families; and public compiler/engine output for CSS examples. `@master/internal-site/css/foundation-data/tokens.ts` supplies shared facts through existing preset/manifest helpers. Keep shared presentation data under `@master/internal-site/css/foundation-data/`. Reference renders complete collections; Guide selects explicit keys from the same source. Do not introduce TypeScript semantic parsing or hand-maintained copies of preset values.

Distinguish curated design advice from executable contracts: a suggested card size is not a fixed meaning of its token. Keep selected keys identical in Guide HTML, search, Markdown and llms output. Relocate shared MDX/data dependencies before retiring a source page, including Typography and Corner Radius imports. Follow [Reference maintenance](reference/MAINTENANCE.md) for URL, anchor and export migration.

### Teaching sequence

Use sentence case for public documentation headings in guide `content.mdx`: capitalize only the first word and proper nouns. Avoid title case such as `Root Options`; prefer `Root options`. In article titles, navigation labels and editorial headings, write the conjunction `and`, not `&` (for example, `Variables and modes`). Preserve literal ampersands in code and syntax examples.

Guides should teach in this order:

1. State the task. Do not teach native CSS, browser behavior or general design, UX or accessibility practice: link to MDN or web.dev and explain only what Master CSS adds or changes.
2. Show the smallest Master CSS syntax needed.
3. Provide a working in-page demo.
4. Show generated CSS with `<Class2CSS>` when introducing new Master CSS classes.
5. Cover Master-specific constraints and failure conditions after the core flow is clear.

Keep reduced-motion handling and progressive hardening after the primary example unless the guide is specifically about accessibility. For guide layout, visual design, responsive behavior, and token choices, inspect the current Design Foundations guides and the Reference token pages instead of duplicating their rules here.

## Example Code

Visible documentation examples should be as framework-neutral as practical:

- Prefer native `html`, `css`, and `js` blocks.
- Use `class`, not `className`, in visible HTML examples.
- In `/guide` pages, describe default integration and CLI scanning as zero-configuration for ordinary app sources. Use CSS scanner directives such as `@source`, `@source not`, `@safelist`, and `@blocklist` for explicit exceptions or scoped examples over JavaScript scanner options unless the section is specifically about integration configuration. Do not present broad `src/**/*` includes or test-file excludes as setup boilerplate.
- Prefer the preset's fixed utilities (`block`, `flex`, `hidden`, `relative`, `items-center`, `justify-between`, `flex-col`, `box-border` and the rest of the declarations contract table) for those exact declarations; write every other native declaration as `(property:value)`. Keep `(property:value)` where a page teaches native syntax or needs a shorthand's resets, such as `(text-decoration:underline)`.
- Use native CSS references such as `(width:var(--size))` for custom properties assigned inline or by JavaScript. Use explicit `var(--name)` for every custom-property reference. Preserve native resolution `x`.
- Use `document.startViewTransition()` with a direct DOM update and fallback in visible JavaScript examples.
- Avoid exposing framework state or site image components in visible examples unless the section is about that framework integration.
- Implementation demos are Svelte components; displayed code does not need to match exactly.
- Import every custom MDX component explicitly in the page or fragment that uses it. Guide-local components can use relative `./components/*` imports; shared presentation components live under `@master/internal-site/components`, and site demos under `@master/internal-site/demo`. The injected MDX `components` only supply Markdown renderers and `Image`.

For View Transitions examples, keep `view-transition-name` values unique, prefer article-specific names such as `article-image`, use `view-transition-class` to group related snapshots, and avoid broad `::view-transition-group(*)` in shared demos unless intentionally documenting global behavior.

## Demo Implementation

Before authoring or revising a demo, read the active rules in [the design system](styles/system/DESIGN.md#rules) and inspect the relevant component source. Check the preview's contents as well as its tray: using `<Demo>` does not establish visual conformity.

Interactive demos should be local Svelte components under the guide's `components/` folder, hydrated where the MDX uses them. Use existing site primitives:

- Wrap demos in `<Demo>`: one example is one `ui-tray` with a head (`title`, `description`, `controls`), a `ui-stage`, an optional `source` (code window plus a closed `DemoGeneratedCSS` disclosure) and a caption. Use `frame="none"` when the content owns its frame, such as a `DemoViewport` browser or a comparison.
- Use the specimen primitives from `@master/internal-site/demo` (`DemoItem`, `DemoSurface`, `DemoBadge`, `DemoLabel`, `DemoLegend`, `DemoMeasure`, `DemoAxes`, …); they render the `ui-*` components in `styles/system/specimens.css` and `surfaces.css`. Teaching hue uses a named `tone` and is always named by a legend or label.
- Use `@master/internal-site/components/Image.svelte` for local bitmap images.
- Use `@tabler/icons-svelte-runes` for icon buttons and icon+text controls when an appropriate icon exists.
- Use the `ui-*` controls (`ui-button`, `ui-segmented`, `ui-range`, `ui-select`, `ui-check`) and `ui-sheet` panels; do not add demo-specific button, panel or color classes. `styles/system/DESIGN.md` is the markup contract.

Distinguish the interface operating the demonstration from the subject being taught. Preview controls and supporting presentation use the site's components. A component class or utility that is itself the lesson must remain reproducible from the displayed public CSS and markup; do not insert private `ui-*` dependencies to make that sample look correct. Use the public preset to express the system's restrained materials, type and geometry, varying only what the lesson needs. A saturated button is not justified merely because it is example content. For supporting buttons inside a `demoDocument` iframe, opt into `DemoScene.systemButtons` and use the canonical `ui-button`; keep this out of public teaching markup. Inspect the existing iframe materials bridge before adding presentation overrides; it must not supply a missing declaration essential to the lesson.

Optional preview controls start absent. Add Theme only when the section explicitly teaches color schemes, width controls when resizing demonstrates the stated viewport or container behavior, and replay or other actions when their outcome is part of the lesson. State what readers should change and observe. Supporting both themes is a verification requirement, not a reason to expose a local theme switch; ordinary previews follow the site's theme. Keep useful source tabs, copying and Generated CSS inspection.

Before delivering a new or rewritten article, include its retained and reused demos in visual acceptance. For each specimen, record the reference selector, the intended teaching difference, observed deviations and their resolution in temporary review notes; use the writing skill’s [demo design check](../.agents/skills/master-css-writing/references/review-and-validation.md#demo-design-check). Contrast, overflow and compilation results cannot substitute for this comparison. A contrast repair must preserve the intended role: do not promote an incidental link into a saturated primary action merely to make its text legible.

Before delivering a changed demo, compare its rendered contents with the relevant system component at article scale: type weight and size, control geometry, surfaces, contours, spacing, and affected interaction states. Check light/dark and narrow layouts separately from compilation and export validation. A working interaction or an overflow-free screenshot does not establish that its visual design passes. Record the reference used and any unverified visual states in the delivery note, not the article.

Design demos for the doc content column, not the viewport. A `<Demo>` inside guide content is roughly `674px` wide on desktop and narrower on mobile. Prefer container queries over viewport breakpoints, add `container` when using `@container(...)`, keep mobile single-column by default, and use two columns only when the container has room.

For View Transition demos, keep the iframe viewport stable throughout capture and animation; use `DemoViewport` with `sizing="viewport"` rather than resizing it to changing content. Prefer route-owned native CSS for transition pseudo-elements, and stable data-derived names through native styles. If teaching equivalent pseudo-element utility classes, attach them to the document root and clean up any client-added classes on unmount. In Svelte state demos, wrap the update passed to `document.startViewTransition()` in `flushSync()` so the DOM update happens inside the transition callback. Provide no-API and reduced-motion fallbacks, and distinguish skipped animations from failed DOM updates.

For Layout System and similar foundation demos, prefer one polished practical UI composition over abstract placeholder grids when teaching product layout decisions. Use `DemoPageViewport` (or `DemoViewport` with `src` and `responsive`) for primary responsive demos when the lesson depends on viewport width, and `DemoContainer` when it depends on a container. Keep iframe pages under `site/content/examples/<slug>/`. Isolated documents from `components/demo/reference/document.ts` receive `styles/system/tokens.css`, the materials bridge and `reference/frame.css`; frame paint uses `--ui-*` roles only. Pair practical demos with reduced code samples that expose layout strategy, not every decorative class.

## Design References

Before changing guide demo layout, spacing, sizing, color, radius, typography, or responsive behavior, inspect the relevant Design Foundations guide pages and follow current patterns.

The site interface (shell, examples, data views, demo primitives) uses the Moonstone system in `@master/internal-site/styles/system/`: `ui-*` components with variants on `data-*` and state on native/ARIA attributes, painted only with `--ui-*` roles. Follow its `DESIGN.md`. `specimens.css` and `data.css` are imported by the components that use them. `--ui-*` roles are not utility tokens: teaching and content markup keeps the preset vocabulary below.

Follow the public Design Tokens policy when writing site code, demos, and examples:

- Prefer configured foundation tokens from `packages/preset/src/theme.css`.
- Prefer preset palette, surface, line, and text aliases such as `fg-blue-60`, `fg-text-body`, `fg-text-muted`, `fg-text-blue`, `bg-surface-raised`, `bg-surface-base`, `bg-blue`, `bg-blue-5`, and `b(1) b-line-divider b-solid`.
- Use project semantic tokens such as `divider`, `accent`, or `danger` only when the page or project defines those tokens in `@theme`.
- Preserve typography semantics: use `(font-size:<value>)` for raw font-only replacements, and `text-<token>` only when the complete type treatment is intended.
- Prefer scale tokens such as `p-sm`, `gap-md`, and `mt-lg` over routine raw spacing, color, shadow, or timing values.
- Author Master CSS classes around independent styling decisions. Single-setting native declarations such as `(animation:none)@media(print)` and `(transition:none)` are allowed; do not mechanically expand them into reset declarations because CSS categorizes their property as a shorthand. Keep single-aspect, uniform-value families such as `p-sm`, `gap-md`, and `b-line-divider`; split different edge or axis values without changing physical/logical meaning. Use `b(1) b-line-control b-solid`, not a compound border class. Prefer the preset's fixed utilities (`flex`, `text-center`, `mx-auto`, `whitespace-nowrap`, `truncate`) and direct-value functions (`m(0)`, `p(4)`, `b(1)`, `grow(1)`) over the equivalent native declarations. Native CSS files, CSS examples and inline style objects may use ordinary CSS shorthands. Do not expand native CSS as part of class migrations.
- Low-level values are acceptable when teaching syntax, no token exists, the value is local measured geometry, or the value is structural layout such as `(width:50%)`, `(height:100dvh)`, `m(0)`, `m(1)`, `(z-index:1)`, or `(opacity:.64)`.
- Promote reused visual low-level values to named tokens.
- Use docs callout markers as regular text paragraphs: `(x)`, `(o)`, `(!)`, and `(i)`.

For numeric theme variable tables, read values from `site/utils/theme-variables` or a narrow derived helper. Reference owns complete numeric lookup tables; Guide keeps the values or comparisons its lesson needs. Use the existing table primitives and label display conversions as reference values rather than compiler semantics. Guide may omit optional reference-unit conversions to keep a visual comparison readable on small screens. Keep value tables separate from generated CSS examples. Breakpoints show custom-media names, never invented theme-variable names.

Complete namespace-consumer tables belong in Reference. Use canonical keys from `site/utils/manifest-utilities` and build-time `tokenFamilies()` metadata, including registered families without preset values. Guide may select relevant rows and link to the complete table. Keep grouping labels curated and reader-facing; never imply unsupported consumers, alternate spellings or a token dependency in an explicit native query. Value tables explain available values; consumer tables explain the properties and families using them.

## Homepage Map

The homepage is `content/page.astro`, importing `@master/internal-site/home/design.css` (home tokens and primitives) and `@master/internal-site/home/home.css`. Product components live in `content/components/`; reusable hero, lamp, footer and their styles belong to the shared package in the Master repository. `content/components/DESIGN.md` is the design language. Read its Principles and the relevant section rather than the whole file. Canonical copy and sample data are in `home-content.ts` (guarded by `home-content.test.ts`); each section's own `*-content.ts` holds the rest. Translate interface copy through the site dictionaries while keeping executable samples shared.

| Area | Components | Logic and styles |
| --- | --- | --- |
| Hero | `HeroSection`, `HeroCanvas`, `HomeLamp` | `hero-shaders.ts`, `hero-title-mask.ts`, `home-lamp.ts`, `hero.css` |
| 01 Design system | `DesignSystemSection`, `DesignSystemFigures`, `HomeBento`, `ThemeModesPreview`, `ArtGalleryPreview`, `CascadeLayers` | `design-system-content.ts`, `palette-*.ts`, `theme-split.ts`, `design-system.css` |
| 02 Editor | `LanguageServiceSection`, `EditorFigures`, `HomeEditorWindow` | `editor-*.ts`, `editor-tiles.css`, `home-editor-window.css` |
| 03 Rendering | `DeliveryModesSection`, `DeliveryStage`, `DeliveryFigures`, `DeliveryPreview` | `delivery-*.ts`, `delivery.css`, `delivery-preview.css` |
| 04 CSS size | `BenchmarkSection`, `BenchmarkSizeChart` | `benchmark.css` |
| 05 Lint | `LintSection`, `LintExplorer` | `lint-content.ts`, `lint.css` |
| 06 AI agents | `AgentsSection`, `AgentSession`, `AgentsFigures` | `agents-*.ts`, `agent.css`, `agents-protocol.css` |
| 07 Workflow | `WorkflowSection`, `WorkflowStage`, `WorkflowTrace`, `WorkflowRepo`, `WorkflowRoutes`, `WorkflowCanvas` | `workflow-*.ts`, `workflow.css` |
| Call to action | `CTASection`, `CTACanvas` | `cta-*.ts`, `cta.css` |
| Shared | `HomeAction`, `HomeSegmentedControl`, `HomeCodeWindow`, `HomeIllustration`, `HomeCompactIcon`, `CopyCommand`, `HomeFooter` | `pointer-motion.ts`, `footer.css` |

## Visual Iteration

Visual work keeps its full judgment: look at the result after every meaningful visual change, in the schemes and widths it affects. What it avoids is carrying superseded or oversized images through a long session.

- Capture with `node site/scripts/visual-capture.mjs <url> --name <name> --selector <element>`. It writes 2x PNG crops of one element or `--clip` region, takes `--scheme light,dark`, time-matched `--frames`, `--pointer`/`--hover` states and `--hide .home-header`, and prints JSON with `--measure`/`--props` boxes and computed values, page errors and each image's approximate tokens. Use `--ready <selector>` for a figure's hydration attribute. Never downscale or convert to JPEG: material, gradients and hairlines need the detail.
- Viewed images are resized to a 2000px long edge, so a 2x crop wider than 1000 CSS px loses detail; the script warns. Split wide regions into several crops instead of one full-viewport shot. Full-page captures can drop translated or composited layers; confirm a blank in a viewport or element capture before fixing it.
- Settle numeric questions numerically: alignment, size, spacing, overflow and contrast come from `--measure`, `--props` or `--eval`. Images decide appearance: material, light, rhythm, hierarchy and motion.
- Compare candidates with `node site/scripts/visual-diff.mjs before.png after.png --pair pair.png`. It reports whether and where pixels changed; open the side-by-side pair of the changed region instead of both captures. Do not reopen an unchanged state.
- Compare animated or WebGL candidates at the same frame times with page text hidden when only the surface matters. While other agents edit the same worktree, iterate a canvas island in an isolated page and confirm the final result on the dev server once.
- A polish session longer than about an hour works in rounds. At each commit, record the decisions, rejected directions with the reason, and open issues in the relevant `DESIGN.md` section or the commit body, then continue in a fresh session from that record rather than in an ever-growing context. Do not fork a long session to start parallel work.
- Brief each subagent with the files from the map above, the design direction, rejected directions, the capture commands and the checks to run, so it does not rediscover the codebase. Ask for findings, changed files and the paths of decisive captures, not pasted output. Do not cap design attempts or captures that a judgment needs.

## Assets

Local bitmap assets for demos belong under:

```txt
site/assets/images/<guide-or-feature>/
```

Import them statically and render with the site `<Image>`:

```astro
import Image from '@master/internal-site/components/Image.svelte'
import articleImage from '~/site/assets/images/view-transitions/article-aurora.jpg'
```

Set an appropriate `sizes` value for responsive images; Cloudflare builds add resized sources.

## Validation

Reference has a normalized build-time catalog in `reference/`. Read `reference/MAINTENANCE.md` before changing its content pipeline, navigation, search or exports. `reference/token-contracts.ts` builds family and namespace lookup documents; `reference/recipes.ts` reads the preset definitions and generates complete recipe CSS. Formal language/directive prose lives in the corresponding Guide directory's `contract.mdx`, while `content.mdx` teaches the workflow and preserves old anchor entrances. Keep explicit MDX heading IDs (`\{#stable-id\}`) when renaming or translating headings. `prepare-app` generates the catalog, search records and per-page Markdown; never edit those outputs directly. Run `test:reference` for Reference changes in addition to the relevant checks below. Policy-only changes require package lint and `check:ai-context`; run the public-content checks when the corresponding pages, examples or pipeline change.

Run site orchestration commands from the repository root (`/Users/aron/master-css`). Use `bun run dev:site` for normal development, `bun run dev:site:clean` when Astro or Vite caches must be reset, and `bun run build:site` for the full package-warmed site build. Only use `site/` as cwd for one-off local debugging. `dev` runs `astro dev --ignore-lock`: Astro otherwise detaches the server into the background when an AI agent starts it, where it outlives the agent, keeps port 3000 and the lock, and pushes later sessions to `--force` (which also discards the content cache). The Vite watcher ignores `out/`, so a concurrent build does not reprocess every written file.

For content-only guide updates, run:

```sh
bun run --filter site prepare-app
```

For interactive or visual demo changes, additionally verify:

```sh
curl -I http://localhost:3000/guide/<slug>
```

Use Playwright screenshots for desktop and mobile when layout, images, responsive behavior, or animation demos change; capture them as described in [Visual Iteration](#visual-iteration). If Playwright browser binaries are missing, install the required browser with `bun run playwright install chromium`.

Broader site checks are available when relevant:

```sh
bun run --filter site lint
bun run --filter site type-check
bun run build:site
```

Measure development memory from the repository root with `node site/scripts/profile-dev-memory.mjs --runs 3 --output /tmp/site-memory.json`. Add `--http-only` for comparable server-only runs, and `--assert-lazy` to enforce homepage import boundaries. Each run owns its port and temporary Astro/Vite caches. The report separates RSS, post-GC heap, physical footprint on macOS, module counts, request times, repeated requests and watcher-triggered invalidations; optional browser checks run in a separate process. Watcher invalidation does not edit sources and is not a substitute for a multi-hour editing test.

Measure cold development startup with `node site/scripts/profile-dev-startup.mjs --runs 3 --output /tmp/site-startup.json`. It reports preparation, readiness, browser first response/interactivity, warm requests, emitted-globals HMR, and post-GC memory separately, using fresh processes and isolated caches. Interactivity requires working search results; island preparation flags are recorded separately. It also verifies homepage lazy imports and later Guide/Reference navigation. Compare the same entry and machine; timings are advisory measurements, not CI thresholds.

`bun run --filter site type-check` may have unrelated existing errors. Report those separately and do not hide new errors introduced by the current change.
