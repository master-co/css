# Guide and Reference content inventory

Decision date: 2026-09-29. Status: public source and shared-data migration implemented; local verification is recorded below. The canonical policy is [site/AI.md](../../site/AI.md#guide-and-reference-ownership); [Reference maintenance](../../site/reference/MAINTENANCE.md#content-migration-sequence) owns migration mechanics.

The subsequent [visual restoration inventory](foundation-visual-restoration.md) supersedes the initial migration’s generic specimen presentation and records the restored public locations. The 90-page ownership decision remains unchanged.

## Decision and scope

Keep Design Foundations in Guide for design and implementation tasks. Reference owns complete lookup data and Master CSS contracts; Syntax Tutorial teaches the general syntax. Move complete palettes, scales, consumer mappings and lookup specimens to Reference while Guide selects the facts needed to complete a task. Interactivity alone does not determine ownership.

Retire standalone native CSS property/value/selector instruction, including `display`. The user subsequently waived redirect handling: remove retired Reference routes rather than maintaining redirect entrances. Merge property-specific token information into canonical family and namespace lookups. Preserve mixin contracts embedded in property pages and move removed-capability explanations to Migration Guide. Master-specific behavior found in native articles must survive in its owning contract.

The expected benefit is a clearer learning path and less duplicated content to maintain. Reduced native-property search entrances are an accepted tradeoff, not a measured SEO improvement. The admission policy applies to existing and new pages; prior demo investment or anticipated search exposure is insufficient reason for a standalone page.

The public migration follows the completed canonical-syntax change `fef197a78`. It retires content routes, renames the Container queries Guide title, extracts shared data and rebuilds the catalog. It changes no engine behavior or public API. The resulting page count must not suppress future public contracts.

## Evidence and counting

This is a working-tree inventory, not an audit of a published deployment. The baseline catalog was audited before migration; its 174 first-level IDs matched the then-current `metadata.ts` sources. The migrated catalog is rebuilt from preset data, the public registry and formal contracts. Classification also checks the current Rust registry and preset mixin definitions. A generated document's existence is not evidence that all its prose already follows the final syntax.

| Evidence | Source |
| --- | --- |
| Current catalog ownership and generation | [reference/build.ts](../../site/reference/build.ts), local ignored `site/.generated/reference.json` |
| First-level authored pages | `site/app/[locale]/reference/*/metadata.ts` and adjacent MDX/syntax files |
| 138 canonical token families | [token_registry.rs](../../crates/mastercss-engine/src/token_registry.rs); public tooling builtins are the site-facing projection |
| 11 preset mixins | [utilities.css](../../packages/preset/src/utilities.css) |
| Foundation data and portable rendering | [foundation-content.ts](../../site/utils/foundation-content.ts), [theme-variables.ts](../../site/utils/theme-variables.ts) |
| Tool and package inventories | [tool-contracts.ts](../../site/reference/tool-contracts.ts), [package-contracts.ts](../../site/reference/package-contracts.ts), public registrations and API census |

Baseline catalog: 256 content documents = 171 utilities + 9 rules + 22 token documents + 10 directives + 24 tools + 20 packages. Three of the nine rule documents are first-level sizing migration pages. The 174 first-level documents partition into 113 native-focused pages, 49 token-property pages, 9 recipe-bearing pages and 3 migration pages.

The implemented catalog contains 90 content documents: retain/rework 88 existing documents and add `tokens/families` and `text-gradient`. Retire 168 catalog entries: 165 first-level entries plus `tokens/containers`, `directives/settings` and `directives/compose`. Retiring a document can mean moving its useful content, not discarding it.

Counts exclude `/reference`, category indexes, localized copies, Markdown/text copies and navigation-only old URLs. The current target follows capability coverage, not a quota.

## Implemented Reference catalog

| Group | Content pages |
| --- | ---: |
| Syntax and execution rules | 6 |
| Token families, values and presets | 22 |
| Preset recipes | 10 |
| Stylesheet directives | 8 |
| CLI | 4 |
| MCP | 20 |
| Package APIs | 20 |
| Total | 90 |

### Syntax and execution rules: 6

All paths below are relative to `/reference/`.

| Retained path | Contract |
| --- | --- |
| `rules/declarations` | Direct declarations, value encoding, functions, units and importance |
| `rules/selectors` | Class/selector composition, target identity and descendant encoding |
| `rules/conditions` | Media, container, named conditions and composition |
| `rules/modes` | Variables, namespaces, modes and resolution |
| `rules/layers` | Layer ownership, ordering and cascade |
| `rules/extraction` | Source scanning, complete classes and candidate boundaries |

### Token families, values and presets: 22

These slugs are relative to `/reference/tokens/`. Keep current URLs except for the new family index and retirement of `containers`.

| Group | Slugs | Count |
| --- | --- | ---: |
| Canonical lookup, new | `families` | 1 |
| Colors | `color`, `color-line`, `color-surface`, `color-text` | 4 |
| Space and appearance | `spacing`, `container`, `radius`, `shadow` | 4 |
| Typography | `font-family`, `font-feature`, `font-size`, `font-weight`, `leading`, `tracking`, `text` | 7 |
| Motion | `animate`, `duration`, `easing` | 3 |
| Other values | `content`, `order` | 2 |
| Preset custom media | `breakpoints` | 1 |

`families` covers all public canonical prefixes, target properties and namespaces, including consumers with no preset values. Full property names and prefixes both retrieve the same entry; searchable identifiers are not alternate legal token spellings. Namespace pages include complete values, scopes, modes, dependencies and relevant family/property consumers.

Color role groups remain useful lookup collections; they must not imply alternate prefixes or independent resolution namespaces for families that use the canonical color namespace. `tokens/text` and `tokens/animate` own their value/companion-token catalogs, while recipe pages own expansion behavior. Reuse data and cross-link these distinct tasks without duplicating full catalogs.

`breakpoints` describes actual custom media definitions, not `--breakpoint-*` theme properties. `tokens/container` describes size values and sizing consumers. Retire `tokens/containers`: query contracts go to `rules/conditions`, and component adaptation belongs in `/guide/containers`. Literal container-query thresholds do not read or automatically track theme tokens.

### Preset recipes: 10 pages for 11 mixins

Keep the nine existing paths and focus their titles/content on the actual recipes. Add only `text-gradient`.

| Path relative to `/reference/` | Covered preset mixins | Disposition |
| --- | --- | --- |
| `font-smooth` | `font-antialiased`, `font-subpixel-antialiased` | Retain |
| `screen-readers` | `sr-only` | Retain |
| `grid-columns` | `grid-cols(n)` | Retain |
| `grid-rows` | `grid-rows(n)` | Retain |
| `grid-column` | `grid-col-span(n)` | Retain recipe; move general Grid positioning instruction |
| `grid-row` | `grid-row-span(n)` | Retain recipe; move general Grid positioning instruction |
| `clamp-lines` | `clamp-lines(n)` | Retain |
| `text-size` | `text-*` | Retain treatment contract |
| `animate` | `animate-*` | Retain playback and resource contract |
| `text-gradient` | `text-gradient` | Add missing preset recipe contract |

### Stylesheet directives: 8

Slugs are relative to `/reference/directives/`.

| Slug | Contract |
| --- | --- |
| `entry` | Entry imports, loading and stylesheet boundaries |
| `reference` | `@reference` |
| `theme` | `@theme`, `@custom-media` |
| `definitions` | `@mixin`, `@apply`, `@contents` and native layers |
| `source` | `@source`, `@source not` |
| `candidates` | `@safelist`, `@blocklist` |
| `variant` | Native conditional blocks and mixin wrappers; the URL does not restore removed `@variant` syntax |
| `preserve` | `@prune native`, `@preserve native` |

Move `directives/settings` and `directives/compose` to the corresponding RC migration sections. Preserve their diagnostic/replacement explanations and old entrances without presenting removed features as active directives. Keep formal directive prose in its existing owning contract source.

### CLI, MCP and packages: 44

Retain all current tool and public-package pages. CLI paths under `/reference/tools/cli/`: `generate`, `lint`, `inspect`, `migrate` (4).

MCP paths under `/reference/tools/mcp/` use the `mastercss_` prefix before each suffix below (20).

| Group | Tool suffixes | Count |
| --- | --- | ---: |
| Project and style inspection | `workspace_info`, `setup_audit`, `inspect_class`, `trace_class`, `extract_classes`, `inspect_directives`, `render_css`, `scan_project` | 8 |
| Repository analysis | `repo_context`, `change_impact`, `test_router`, `package_graph` | 4 |
| Queries and comparison | `manifest_query`, `css_compare` | 2 |
| Lint and suggestions | `lint_project`, `lint_content`, `suggest_syntax` | 3 |
| Change workflow | `preview_fixes`, `preview_directive_format`, `apply_preview` | 3 |

Package paths under `/reference/packages/` correspond to `@master/<slug>` (20).

| Group | Package slugs | Count |
| --- | --- | ---: |
| Core and execution | `css`, `css-schema`, `css-preset`, `css-tooling`, `css-compiler`, `css-server`, `css-runtime` | 7 |
| Developer tools | `css-language-service`, `css-language-server`, `css-mcp`, `eslint-plugin-css`, `eslint-config-css`, `create-css` | 6 |
| Integrations | `css-astro`, `css-next`, `css-nuxt`, `css-svelte`, `css-svelte-addon`, `css-vite`, `css-webpack` | 7 |

## First-level page disposition

These lists exhaust the 174 baseline first-level metadata entries. They are an editorial inventory, not a support whitelist or a runtime property registry. The recipe table above accounts for nine entries; its tenth path is new.

### Token-property pages merged into lookup collections: 49

All listed slugs previously lived directly under `/reference/`. Destination names are under `/reference/tokens/`; every mapping also remains searchable through `families`. Color subgroups provide additional role-specific detail within the same canonical color lookup.

| Destination | Current property-page slugs | Count |
| --- | --- | ---: |
| `color` and its role groups | `accent-color`, `background-color`, `border-color`, `caret-color`, `color`, `fill`, `outline-color`, `stroke`, `text-decoration-color`, `text-fill-color`, `text-stroke-color` | 11 |
| `spacing` | `background-position`, `gap`, `inset`, `margin`, `object-position`, `outline-offset`, `padding`, `scroll-margin`, `scroll-padding`, `shape-margin`, `text-indent`, `text-underline-offset`, `transform-origin`, `word-spacing` | 14 |
| `container` | `background-size`, `flex-basis`, `height`, `max-height`, `max-width`, `min-height`, `min-width`, `width` | 8 |
| `radius` | `border-radius` | 1 |
| `shadow` | `box-shadow` | 1 |
| `duration` | `animation-delay`, `animation-duration`, `transition-delay`, `transition-duration` | 4 |
| `easing` | `animation-timing-function`, `transition-timing-function` | 2 |
| `font-family` | `font-family` | 1 |
| `font-feature` | `font-feature-settings` | 1 |
| `font-size` | `font-size` | 1 |
| `font-weight` | `font-weight` | 1 |
| `leading` | `line-height` | 1 |
| `tracking` | `letter-spacing` | 1 |
| `content` | `content` | 1 |
| `order` | `order` | 1 |

### Native-focused pages retired as standalone references: 113

Use the general declaration/selector contract for Master syntax and authoritative CSS sources for native semantics. Retain useful task examples in the relevant Guide; do not move every demo merely to preserve it. Before retirement, extract any Master-specific output behavior to its owning contract. Active links must lead to the subject’s current owner; no redirect map is maintained.

| Current category | Count | Page slugs |
| --- | ---: | --- |
| Flexbox & Grid | 20 | `align-content`, `align-items`, `align-self`, `flex-direction`, `flex-grow`, `flex-shrink`, `flex-wrap`, `grid-area`, `grid-auto-columns`, `grid-auto-flow`, `grid-auto-rows`, `grid-template-areas`, `grid-template-columns`, `grid-template-rows`, `justify-content`, `justify-items`, `justify-self`, `place-content`, `place-items`, `place-self` |
| Motion | 10 | `animation-direction`, `animation-fill-mode`, `animation-iteration-count`, `animation-name`, `animation-play-state`, `scroll-behavior`, `scroll-snap-align`, `scroll-snap-stop`, `scroll-snap-type`, `transition-property` |
| Interactivity | 8 | `appearance`, `cursor`, `overscroll-behavior`, `pointer-events`, `resize`, `touch-action`, `user-drag`, `user-select` |
| Sizing | 1 | `aspect-ratio` |
| Effects | 5 | `backdrop-filter`, `filter`, `mix-blend-mode`, `opacity`, `will-change` |
| Color & Backgrounds | 6 | `background-attachment`, `background-blend-mode`, `background-clip`, `background-image`, `background-origin`, `background-repeat` |
| Borders & Outlines | 11 | `border-collapse`, `border-image-outset`, `border-image-repeat`, `border-image-slice`, `border-image-source`, `border-image-width`, `border-style`, `border-width`, `box-decoration-break`, `outline-style`, `outline-width` |
| Layout | 16 | `box-sizing`, `break-after`, `break-before`, `break-inside`, `clear`, `column-count`, `column-span`, `column-width`, `contain`, `display`, `float`, `isolation`, `overflow`, `position`, `visibility`, `z-index` |
| Shapes & Masks | 4 | `clip-path`, `mask-image`, `shape-image-threshold`, `shape-outside` |
| Typography | 27 | `counter-increment`, `counter-reset`, `counter-set`, `direction`, `font-style`, `font-variant-numeric`, `hyphens`, `list-style-image`, `list-style-position`, `list-style-type`, `overflow-wrap`, `text-align`, `text-decoration-line`, `text-decoration-style`, `text-decoration-thickness`, `text-orientation`, `text-overflow`, `text-rendering`, `text-shadow`, `text-stroke-width`, `text-transform`, `text-wrap-mode`, `text-wrap-style`, `vertical-align`, `white-space-collapse`, `word-break`, `writing-mode` |
| Media & SVG | 2 | `object-fit`, `stroke-width` |
| Transforms | 3 | `transform`, `transform-box`, `transform-style` |

For `display`, preserve a minimal declaration/composition example in the syntax contract and useful layout teaching in Layout System. Its old general CSS value tour is not a new standalone task guide. Native text-clipping examples may inform the new `text-gradient` recipe document, but the recipe contract must come from the preset and verified output.

### Sizing migration pages: 3

`size`, `min-size` and `max-size` already explain removed built-ins. Move that content to `/guide/migration/v2-rc#sizing-and-resolution` and update active links to that section. Direct native dimensions and current token families remain documented in their proper owners.

## Design Foundations remain in Guide

Keep all ten existing Guide URLs. Move exhaustive data to Reference, retain the values and examples required for a self-contained task, and do not add filler after removing a table.

| Guide slug | Retained teaching task | Reference owns |
| --- | --- | --- |
| `spacing` | Component density, grouping and page rhythm; tokens versus local measured geometry | Complete spacing scale and consumers |
| `sizing` | Fluid/fixed dimensions, constraints and width caps | Container values and complete sizing-family mappings |
| `breakpoints` | Choosing viewport thresholds for content and layout decisions | Preset custom media names and exact conditions |
| `containers` | Portable responsive components; nearest and named query containers | Container size catalog and query grammar |
| `corner-radius` | Consistent shape language, nested surfaces, pills and circles | Full radius scale and corner-family mappings |
| `colors` | Palette versus roles, surfaces/text, themes and readable combinations | Complete palette, role catalogs and preset values |
| `elevation` | Surface relationships, shadows and state hierarchy | Complete shadow values and scale specimens |
| `typography` | Body/heading/display hierarchy; complete treatments versus individual settings | Full size, family, weight, leading and tracking catalogs |
| `motion` | Feedback, status and entrance choices; reduced motion | All animation/duration/easing values and recipe contracts |
| `layout-system` | Containers, gutters, columns, regions and responsive composition | Referenced lookup collections, not a repeated full scale |

Title `/guide/containers` **Container queries** without changing its URL; move width-cap design choices to Sizing. `/guide/responsive-design` remains the overall viewport/container strategy and links to the deeper Breakpoints and Container queries guides. Layout System combines foundations without reteaching their complete catalogs.

## Migration dependencies and acceptance

Source values/scopes/dependencies from the preset, canonical families from public registry projections and CSS from public compiler/engine output. Shared Guide-local data and curated descriptions move to common site foundation-data modules using existing theme/manifest helpers. Keep design recommendations separate from executable semantics. Reference renders complete sets; Guide requests explicit keys from the same data.

Shared MDX was relocated before retiring old routes: Typography and Corner Radius own their lessons locally, and the strict `foundation-content.ts` adapters use explicit selected keys. Keep HTML and search/Markdown/llms adapters aligned so a selected Guide subset remains the same subset everywhere. Keep minimal Reference examples and lookup specimens, rather than reducing Reference to bare variable dumps.

Update internal links, navigation, search, sitemap and all portable exports from their authored sources; do not hand-edit generated catalogs. Retired Reference pages and prior compound-property redirect entrances are removed. The pre-existing Syntax Tutorial compatibility routes remain outside this retirement scope.

The policy-only pass ran lint, AI context and inventory checks. The subsequent public migration adds the checks below.

Public-migration acceptance:

- Every current public family and preset mixin remains documented, including families without preset values.
- Queries for `padding`, `p`, `px` and `padding-inline` reach the right mapping without advertising removed spellings.
- Users can separately complete value lookup, family lookup and a concrete design task; Guide examples remain executable without repeated navigation.
- Complete catalogs live in Reference; Guide HTML, search and portable content use identical selected facts.
- Changing a preset value updates related presentations; changing a container token does not silently change a documented literal query threshold. Breakpoints remain custom media.
- Typography/Corner Radius imports and reusable demos survive through their correct owners; active links resolve to meaningful sections.
- Reference, syntax, docs-example and llms checks, site lint/type-check and AI-context checks pass. Validate active links and sitemap after static generation, plus desktop/mobile and keyboard behavior for moved tables/specimens.

Public source migration now uses shared preset facts, an exhaustive family index, explicit Guide subsets and removed retired routes. Verification results are recorded in the completion section below.

## Implementation and verification

- Generated catalog: 90 content documents; 138 canonical families; 10 recipe pages covering all 11 preset mixins. Native/property MDX and obsolete Guide catalogs are removed.
- Shared facts: `site/common/foundation-data/tokens.ts`; HTML and portable Guide selections both call the same selector. Reference reads complete scoped values and dependency names.
- Existing Design System gallery examples were relocated to `site/components/demo/specimens/` before deleting their former article sources. Typography and Corner Radius lessons now own their included MDX.
- Per the user’s implementation clarification, retired Reference routes are removed without redirects. Active links use actual content owners, including native CSS sources where appropriate. Removed settings/composition contracts live in the RC migration guide.
- Automated checks passed: Reference (20), syntax (14), docs examples (17), llms (31), retained gallery scenes (4), static syntax migration (4), site type-check and AI-context budgets. Site lint reports 0 errors and 160 class-order warnings.
- Production static build and postbuild passed. All 94 retained public assets are referenced and present. An HTML audit resolved 31,754 links to Reference and Foundation Guides, including fragments, with no broken targets.
- Browser checks: 18 changed pages at 390px, 768px and 1280px (54 combinations), with no page errors, document overflow or broken specimen anchors. Keyboard specimen navigation and English/Traditional Chinese search passed selection, one-press Escape, focus restoration and query preservation.
- This is a workspace change, not a deployed site or a measured SEO outcome.
