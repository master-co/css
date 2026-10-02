# Site AI Instructions

These instructions apply to the `site/` workspace. They extend the repository root `AGENTS.md`; follow the root instructions first, then apply these site-specific rules. Keep this file named `AI.md`.

## Responsibility

The `site` workspace owns the public Master CSS documentation site, examples rendered inside docs, user-facing guide content, and site-specific visual demo implementation.

## Document Shell Ownership

- Keep reusable documentation navigation, layouts, contexts, MDX rendering, and page factories in `site/docs-shell/`.
- Keep Master CSS-specific guides, reference rendering, examples, and demos in their existing `site/` owners. Put shell styles in `site/styles/docs-shell/` and retained public assets in `site/public/`.
- The CSS site owns its implementation and dependency versions. Share brand and interaction principles across Master projects through written design guidance; do not reintroduce a cross-repository source submodule for the full site.
- Extract a cross-project package only after another active site independently needs the same stable behavior, the API is explicit, and framework/version coupling has been checked. Keep a one-site need local.

## Owns

- Public guide pages under `site/app/[locale]`.
- Documentation copy, code examples, generated CSS examples, and interactive demos.
- Site-local components, assets, dictionaries, category metadata, and docs verification scripts.
- The document shell under `site/docs-shell/`, including layouts, MDX components, search, localization, and page factories.
- Cloudflare/Next site build configuration.

## Does Not Own

- Core package behavior; verify behavior from source/tests before documenting it.
- Root-level public docs outside `site/` unless maintainers request them.
- Package-local AI instructions.
- Compiler, runtime, scanner, integration, or engine fixes unless explicitly requested as part of the same task.

## Key Files And Patterns

- Guide pages: `site/app/[locale]/guide/<slug>/{metadata.ts,page.tsx,content.mdx}` plus optional `components/`.
- Example iframe pages: `site/app/[locale]/examples/<slug>/`.
- Demo images: `site/assets/images/<guide-or-feature>/`.
- Category data is generated; run `pnpm --filter site prepare-app` when adding or renaming pages.

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
- Hard-coding preset token rows when they can be read from preset manifest data.
- Placing guide demo images in `site/public/` unless they need stable public URLs outside the bundle.

## Documentation Architecture

Guide pages live under:

```txt
site/app/[locale]/guide/<slug>/
```

Use this shape:

```txt
metadata.ts
page.tsx
content.mdx
components/
```

- `metadata.ts` defines public title, description, category, reference links, and `fileURL`.
- `page.tsx` uses `createPage`, `site/docs-shell/layouts/doc`, `site/dictionaries`, and `site/.categories/guide.json`.
- `content.mdx` contains guide copy, code examples, generated CSS examples, and imported local demos.
- `components/` contains interactive demos and guide-local presentational components.

For the View Transitions guide: route slug is `/guide/view-transitions`, title is `View Transitions`, category is `Fundamentals`, and references to the platform feature should use `View Transition API`.

## Content Strategy

### Current documentation and migration ownership

Public Guide, Reference, Blog, examples and package READMEs describe current behavior. Version differences, retired syntax/API names, replacement tables and upgrade steps belong only in `app/[locale]/guide/migration/`. Describe supported syntax directly rather than teaching its history. General article bodies do not link to Migration Guide; navigation, catalogs and search may expose it.

MCP Guide and README may list `migrate-to-mastercss` and its purpose of converting external styling systems to current Master CSS. Keep its instructions, examples and comparisons in Migration Guide. The prompt does not support Master CSS version upgrades. Ordinary CSS diffs, fix previews and class-to-generated-CSS teaching remain valid. Preserve native CSS concepts and current failure conditions; do not ban words such as “before”, “after” or “removed” indiscriminately.

### Guide and Reference ownership

The 2026-09-29 content decision keeps Design Foundations in Guide and makes Reference the complete lookup source. Syntax Tutorial teaches reusable syntax; Guide teaches design and implementation decisions; Reference defines names, values, mappings and behavior. The [content inventory](../.ai/reports/reference-content-inventory.md) records the audited baseline, the implemented Reference catalog and the disposition of all existing first-level pages. Its size follows current capabilities, not a permanent page budget. The public source migration implements this catalog; retired Reference routes are removed without redirect compatibility, per the user’s implementation clarification. Update active links and exports to their actual content owners.

| Content | Primary owner | Use in Guide |
| --- | --- | --- |
| Complete token names, values, scopes, modes and dependencies | Token Reference | Select the keys needed for the current example |
| Complete canonical prefix / property / namespace mappings | Family index and namespace Reference | Explain the example's mappings and link to the full index |
| Mixin parameters, output, defaults and restrictions | Recipe or directive Reference | Apply the recipe to a concrete task |
| Complete palettes, type specimens and shadow/radius scales | Reference | Compare selected specimens in a real design |
| Choosing, combining and customizing tokens | Design Foundations Guide | Explain tradeoffs with working examples |
| Component, page and responsive compositions | Guide | Keep the complete task and its demo together |
| Grammar, exceptions and failure conditions | Syntax Reference | Explain the constraints needed to complete the task |

Interactivity does not determine ownership: a browsable complete palette belongs in Reference; a card comparing surface, line and text roles belongs in Guide. Guide examples must remain self-contained, including necessary values, short comparisons and generated CSS. Reference needs a purpose, a minimal example and useful visual specimens as well as complete data. Do not duplicate complete catalogs in Guide, including through hidden disclosures or search/Markdown exports.

### Preserve visual teaching and lookup quality

A documentation migration moves content, visual specimens and interactions together. Before deleting an original presentation, its public replacement must pass visual and functional comparison. Keeping a component only in the Design System gallery does not preserve the documentation experience. Use `fef197a78` as the visual baseline for this restoration; the unified `components/demo/` primitives remain the implementation owner.

Reference lookup needs carefully designed palettes, scales, specimens and comparisons. Use subject-specific rendering: text roles paint text, line roles paint boundaries, leading uses paragraphs, and shadow specimens leave room for the full shadow in both modes. Do not default every namespace to the same clipped tile grid. Guide may keep rich, self-contained teaching scenes and meaningful selections without a two-or-three-item limit; only the complete catalog belongs in Reference.

`FoundationTokens` selects shared facts by explicit keys in Guide and complete namespace in Reference. `common/foundation-data/specimens.ts` and `recipe-specimens.ts` own site-only presentation models; the public compiler resolves their classes. Match those selections and example sources in HTML, search and Markdown/llms. Test semantic coverage and text equivalence, not bans on presentation component names. Keep preset facts separate from editorial advice.

For a visual migration, record old → new destinations and compare complete sections at 390, 768 and 1280px in light and dark. Verify actual effects, native keyboard focus, clipboard success/failure, paused motion, reduced motion, responsive controls and anchors. A compiling page without overflow is not sufficient evidence of visual quality. See the [restoration inventory](../.ai/reports/foundation-visual-restoration.md).

### Page admission and retirement

- A new standalone Reference must document a public Master-specific contract that native CSS knowledge, an existing general rule or one registry row cannot fully explain. Cover verifiable inputs, output, scope, defaults, dependencies, overrides or errors as applicable.
- New token families enter the complete generated index and namespace consumers first; one added family does not require a new URL. A preset namespace with its own value collection and contract may have a data-driven lookup page. Keep closely related recipe variants together.
- Retire standalone references whose purpose is native property/value/selector instruction, including `/reference/display`. Teach direct declarations and selector composition once, link to authoritative native CSS sources, and preserve any Master-specific output differences in the owning contract.
- Property pages containing token mappings contribute that information to the family index and namespace pages. Preserve embedded recipe contracts before retiring or narrowing their old pages. Removed capabilities belong in Migration Guide.
- Existing demos, another framework's page list, CSS property coverage and anticipated SEO exposure do not independently justify a page. The documentation catalog is not a browser or engine support whitelist.
- A new Guide must serve a concrete task with an executable example and a verifiable result. Existing and new pages follow the same admission rules; retain content for its present purpose rather than prior production effort.

Keep all ten Design Foundations guides and narrow them to the tasks in the inventory. Complete scales and consumer tables move to Reference. Keep `/guide/containers`, with the title **Container queries**; place width-cap design choices in Sizing. Responsive Design owns the overall viewport/container strategy, and Layout System owns cross-foundation composition. Keep useful short teaching pages concise after moving their catalogs.

Merge `/reference/tokens/containers` into the appropriate destinations: size values and consumers in `tokens/container`, query contracts in `rules/conditions`, and component adaptation in `/guide/containers`. Explicit container-query thresholds do not consume or track theme tokens. Preset breakpoints come from custom media, not theme custom properties. Keep color role lookup groups without implying alternate token prefixes or independent family resolution.

### Shared facts and presentation

Use preset data for values, scopes and dependencies; Rust-inferred `tokenFamilies()` metadata for families; and public compiler/engine output for CSS examples. `common/foundation-data/tokens.ts` supplies shared facts through existing preset/manifest helpers. Keep shared presentation data under `common/foundation-data/`. Reference renders complete collections; Guide selects explicit keys from the same source. Do not introduce TypeScript semantic parsing or hand-maintained copies of preset values.

Distinguish curated design advice from executable contracts: a suggested card size is not a fixed meaning of its token. Keep selected keys identical in Guide HTML, search, Markdown and llms output. Relocate shared MDX/data dependencies before retiring a source page, including Typography and Corner Radius imports. Follow [Reference maintenance](reference/MAINTENANCE.md) for URL, anchor and export migration.

### Teaching sequence

Use sentence case for public documentation headings in guide `content.mdx`: capitalize only the first word and proper nouns. Avoid title case such as `Root Options`; prefer `Root options`.

Guides should teach in this order:

1. State the task and explain only the native concepts needed to complete it, with authoritative references such as MDN or web.dev.
2. Show the smallest Master CSS syntax needed.
3. Provide a working in-page demo.
4. Show generated CSS with `<Class2CSS>` when introducing new Master CSS classes.
5. Cover constraints, fallbacks, browser support, and accessibility after the core flow is clear.

Keep reduced-motion handling and progressive hardening after the primary example unless the guide is specifically about accessibility. For guide layout, visual design, responsive behavior, and token choices, inspect the current Design Foundations guide pages instead of duplicating their rules here.

## Example Code

Visible documentation examples should be as framework-neutral as practical:

- Prefer native `html`, `css`, and `js` blocks.
- Use `class`, not React `className`, in visible HTML examples.
- In `/guide` pages, describe default integration and CLI scanning as zero-configuration for ordinary app sources. Use CSS scanner directives such as `@source`, `@source not`, `@safelist`, and `@blocklist` for explicit exceptions or scoped examples over JavaScript scanner options unless the section is specifically about integration configuration. Do not present broad `src/**/*` includes or test-file excludes as setup boilerplate.
- Use native CSS references such as `width:var(--size)` for custom properties assigned inline or by JavaScript. Use explicit `var(--name)` for every custom-property reference; the `$name` shortcut and Master length `x` are removed. Preserve native resolution `x`.
- Use `document.startViewTransition()` with a direct DOM update and fallback in visible JavaScript examples.
- Avoid exposing Next.js, React state, `flushSync`, or `next/image` in visible examples unless the section is about that framework integration.
- Implementation demos may use React, Next.js, and `flushSync`; displayed code does not need to match exactly.
- Import every custom MDX component explicitly in the page or fragment that uses it. Guide-local components can use relative `./components/*` imports; shared presentation components live under `~/site/docs-shell/components`, and site demos under `~/site/components/demo`. The MDX provider only supplies Markdown renderers and `Image`.

For View Transitions examples, keep `view-transition-name` values unique, prefer article-specific names such as `article-image`, use `view-transition-class` to group related snapshots, and avoid broad `::view-transition-group(*)` in shared demos unless intentionally documenting global behavior.

## Demo Implementation

Interactive demos should be local client components under the guide's `components/` folder. Use existing site primitives:

- Wrap demos in `<Demo>`.
- Use `next/image` for local bitmap images.
- Use `@tabler/icons-react` for icon buttons and icon+text controls when an appropriate icon exists.
- Use existing app button and panel classes where possible.

Design demos for the doc content column, not the viewport. A `<Demo>` inside guide content is roughly `674px` wide on desktop and narrower on mobile. Prefer container queries over viewport breakpoints, add `container` when using `@container(...)`, keep mobile single-column by default, and use two columns only when the container has room.

For View Transitions demos, add transition styling classes to `document.documentElement` in a client component and clean them up on unmount. In React state demos, wrap the update passed to `document.startViewTransition()` in `flushSync()` so the DOM update happens inside the transition callback. Always provide a no-API fallback.

For Layout System and similar foundation demos, prefer one polished practical UI composition over abstract placeholder grids when teaching product layout decisions. Use `<ResizeZone>` with `<IFrame>` for primary responsive demos when the lesson depends on viewport width. Keep iframe pages under `site/app/[locale]/examples/<slug>/`. Pair practical demos with reduced code samples that expose layout strategy, not every decorative class.

## Design References

Before changing guide demo layout, spacing, sizing, color, radius, typography, or responsive behavior, inspect the relevant Design Foundations guide pages and follow current patterns.

Follow the public Design Tokens policy when writing site code, demos, and examples:

- Prefer configured foundation tokens from `packages/preset/src/theme.css`.
- Prefer preset palette, surface, line, and text aliases such as `fg-blue-60`, `fg-text-body`, `fg-text-muted`, `fg-text-blue`, `bg-surface-raised`, `bg-surface-base`, `bg-blue`, `bg-blue-5`, and `border-width:1px b-line-divider border-style:solid`.
- Use project semantic tokens such as `divider`, `accent`, or `danger` only when the page or project defines those tokens in `@theme`.
- Preserve typography semantics: use `font-size:<value>` for raw font-size-only replacements, and `text-<token>` only when the complete type treatment is intended.
- Prefer scale tokens such as `p-sm`, `gap-md`, and `mt-lg` over routine raw spacing, color, shadow, or timing values.
- Author Master CSS classes around independent styling decisions. Single-setting native declarations such as `animation:none@media(print)`, `transition:none` and `white-space:nowrap` are allowed; do not mechanically expand them into reset declarations because CSS categorizes their property as a shorthand. Keep single-aspect, uniform-value families such as `p-sm`, `gap-md`, and `b-line-divider`; split different edge or axis values without changing physical/logical meaning. Use `border-width:1px b-line-control border-style:solid`, not a compound border class. Native CSS files, CSS examples and inline style objects may use ordinary CSS shorthands. Do not expand native CSS as part of class migrations.
- Low-level values are acceptable when teaching syntax, no token exists, the value is local measured geometry, or the value is structural layout such as `width:50%`, `height:100dvh`, `margin:0`, `margin:1px`, `z-index:1`, or `opacity:.64`.
- Promote reused visual low-level values to named tokens.
- Use docs callout markers as regular text paragraphs: `(x)`, `(o)`, `(!)`, and `(i)`.

For numeric theme variable tables, read values from `site/utils/theme-variables` or a narrow derived helper. Complete scales belong in Reference; Guide may render the explicit subset needed for its task. Render token, value and reference-unit columns using the existing table primitives, and label display conversions as reference values rather than compiler semantics. Keep value tables separate from generated CSS examples.

Complete namespace-consumer tables belong in Reference. Use canonical keys from `site/utils/manifest-utilities` and build-time `tokenFamilies()` metadata, including registered families without preset values. Guide may select relevant rows and link to the complete table. Keep grouping labels curated and reader-facing; never imply unsupported consumers, alternate spellings or a token dependency in an explicit native query. Value tables explain available values; consumer tables explain the properties and families using them.

## Assets

Local bitmap assets for demos belong under:

```txt
site/assets/images/<guide-or-feature>/
```

Import them statically and render with Next `<Image>`:

```tsx
import Image from 'next/image'
import articleImage from '~/site/assets/images/view-transitions/article-aurora.jpg'
```

Use `placeholder="blur"` when static imports provide blur data. Set an appropriate `sizes` value for responsive images.

## Validation

Reference has a normalized build-time catalog in `reference/`. Read `reference/MAINTENANCE.md` before changing its content pipeline, navigation, search or exports. `reference/token-contracts.ts` builds family and namespace lookup documents; `reference/recipes.ts` reads the preset definitions and generates complete recipe CSS. Formal language/directive prose lives in the corresponding Guide directory's `contract.mdx`, while `content.mdx` teaches the workflow and preserves old anchor entrances. Keep explicit MDX heading IDs (`\{#stable-id\}`) when renaming or translating headings. `prepare-app` generates the catalog, search records and per-page Markdown; never edit those outputs directly. Run `test:reference` for Reference changes in addition to the relevant checks below. Policy-only changes require package lint and `check:ai-context`; run the public-content checks when the corresponding pages, examples or pipeline change.

Run site orchestration commands from the repository root (`/Users/aron/master/css`). Use `pnpm dev:site` for normal development, `pnpm dev:site:clean` when `.next` must be reset, and `pnpm build:site` for the full package-warmed site build. Only use `site/` as cwd for one-off local debugging.

For content-only guide updates, run:

```sh
pnpm --filter site prepare-app
```

For interactive or visual demo changes, additionally verify:

```sh
curl -I http://localhost:3000/guide/<slug>
```

Use Playwright screenshots for desktop and mobile when layout, images, responsive behavior, or animation demos change. If Playwright browser binaries are missing, install the required browser with `pnpm exec playwright install chromium`.

Broader site checks are available when relevant:

```sh
pnpm --filter site lint
pnpm --filter site type-check
pnpm build:site
```

`pnpm --filter site type-check` may have unrelated existing errors. Report those separately and do not hide new errors introduced by the current change.
