# Reference implementation validation

Checked locally on 2026-09-07. This record covers the working tree, not a production deployment or a user study.

## Delivered coverage

- 264 Reference documents: 183 existing utilities, 6 language-rule pages, 22 token/condition namespaces, 10 directive groups, 23 CLI/MCP contracts and 20 public package contracts.
- Existing utility URLs retained. The baseline covers old section IDs in 183 utilities and 7 migrated Guides (190 pages).
- A normalized build-time catalog supplies search, per-page Markdown, a structured index and llms exports. Existing utility HTML consumes the same public syntax/declaration helpers; new contract HTML renders the normalized body.
- Seven Guides retain their learning URLs, teach a concrete workflow and link former sections to their single formal source. English and Traditional Chinese navigation remain available; English body fallback is explicit.
- Opacity, padding and conditional composition demonstrate simple, multi-form and cross-concept lookup. Configured examples compile their CSS settings and validate emitted declarations through existing public APIs.

## Automated checks

| Check | Local result |
| --- | --- |
| Fixed search set | 30/30 expected documents in the top three, independently for English and Traditional Chinese |
| `test:reference` | 10 passed: corpus/adapter coverage, site theme CSS variables, search and identifiers, pilot parity, complete output, stable/legacy anchors, relations, exports and configured-token changes |
| `test:syntax` | 14 passed |
| `test:llms` | 11 passed |
| `test:docs-examples` | 6 passed, including the migrated `contract.mdx` sources |
| `internal` tests | 21 passed; this workspace has no package-local lint script |
| `test:css-contract` | 2 helper tests passed; production snapshot verified across 1,142 static HTML routes |
| Site lint | No errors; 72 canonical-class warnings in examples and existing components, including the intentional explicit `fg:var(--color-blue)` example |
| Focused Reference lint | No errors or warnings |
| Site type-check | Passed |
| Site production build | Passed with the current package artifacts; this was the scoped site build, not a rebuild of every semantic package |
| AI context/source budgets | Passed |

## Browser checks

- 390px: padding syntax rows stack class and declaration without overlap or whole-page horizontal overflow. The search dialog fills the viewport. The additional Reference mobile navigation strip was subsequently removed at the user's request; the original site header remains.
- 768px: the conditions page shows complete, formatted theme and utility CSS without whole-page horizontal overflow.
- 1280px: the Reference index exposes five sections and 264 A–Z entries; content, sidebar and table of contents remain usable.
- `pxs:` returns padding with `padding-inline-start` in the result, then navigates to the real syntax row. Reopening search retains the query and position. Arrow/Enter selection, one-press Escape and focus restoration were checked.
- Traditional Chinese navigation and the explicit English content fallback were checked on spacing tokens.
- The Directives Guide renders a complete configured-token example; its `@theme` link reaches the formal Reference section.

These are local browser checks, not screen-reader certification or measured human completion rates.

## Sidebar and search UI follow-up QA, 2026-09-07

- Reference reuses the original shared `DocSidebar` and `SearchButton`. All 264 links in 20 category groups remain expanded; the sidebar contains no disclosure elements. Guide and Reference search buttons have identical classes, padding and 36px height.
- The shared search dialog uses the site's neutral surfaces and gold accent, with clear title/excerpt/context hierarchy, query suggestions, a clear button, empty results guidance and keyboard hints. Light and dark appearances were checked at 1280px; the 390px dialog fills the viewport without horizontal overflow.
- Searching `pxs:` from Guide opens the real padding syntax anchor. Query preservation, Arrow/Enter, Escape, focus restoration and keyboard activation of Clear were checked. The dialog is portaled into `body`, avoiding the former invalid HTML nesting.
- Reference tests (10), internal tests (21), site type-check and site lint passed again. Lint retains 72 canonical-class warnings and no errors; internal has no package-local lint script.
- The scoped production build passed. Turbopack reports the existing dynamic module-resolution warning in `packages/compiler/src/node-compiler.ts` while processing configured documentation examples.

## Overview UI follow-up QA, 2026-09-07

- Overview uses a six-cell grid in the existing Guide overview style: five Reference section links and a Guide learning entry. Duplicate introductory copy and the separate overview search button are removed; existing shared search controls remain.
- Category groups are expanded, follow the sidebar's category order and adapt to the available content width. Both category and A–Z views contain all 264 document links. A–Z groups include category labels and letter jumps; directly opening `#index-p` reveals the alphabetical view and positions its heading correctly.
- Checked actual CSS viewport widths of 390px, 768px and 1280px, plus light/dark appearances and Traditional Chinese navigation. There is no whole-page horizontal overflow; mobile index rows provide a 44px minimum target height and long tool identifiers wrap.
- The additional mobile Documents / On this page / Search strip, its dialogs and the extra article top padding are removed. The original site header is retained. Desktop sidebar categories remain expanded.
- Reference tests (10), site type-check, site lint and source-budget checks passed. The overview description now has a Traditional Chinese translation.
- The scoped production build passed with the previously recorded dynamic compiler-import warning. Site lint retains 72 canonical-class warnings and no errors.

## Guide overview follow-up QA, 2026-09-07

- Guide adopts the same overview component and styles as Reference. Seven learning sections retain their order and existing anchor IDs, with a separate Reference entry. Both category and A–Z views contain the same 37 primary teaching pages; category links show metadata-derived summaries.
- `Get ready for the journey` and every following content section are removed, including the documentation tutorial, Play screenshot and community links. Search and llms output now use the Guide overview model, so the removed prose is not retained by extraction.
- Checked Guide at 390px, 768px and 1280px, Traditional Chinese navigation, light/dark appearances, section jumps, keyboard view switching and direct `#index-i` navigation. No whole-page horizontal overflow or additional mobile navigation strip appears.
- Rechecked Reference after extracting the shared component: 264 entries, six section links, expanded sidebar and the same desktop presentation.
- Site type-check, lint (72 existing warnings, no errors), Reference tests (10), llms tests (12) and source budgets passed. The new llms test verifies preserved Guide category anchors, metadata links, search parity and removal of the requested sections.
- The scoped production build and six documentation-example tests passed. The generated full text contains seven Guide overview sections and 37 links, with none of the removed prose.
- Desktop card alignment follow-up: the description grid now resets the 32px column gap inherited from the text index. Browser measurements confirm zero gaps between adjacent card borders and equal row heights; the 390px layout remains a single column without horizontal overflow. This is a plain stylesheet correction; no generated class or semantic output changes.

## CSS baseline review

The approved implementation intentionally changes which classes appear in Guide demos and documentation chrome. The production manifest was compared with the previous CSS baseline and remained identical. For class names present in both outputs, generated rule text remained identical. Removed demo classes no longer contribute page CSS and theme dependency ordering changes with the used class set. New interface styles use existing preset variables; a regression check rejects undefined variables.

The site CSS snapshot is refreshed for this reviewed page/content change: 209 deduplicated hydration contracts, 1,908 generated rules and 2,247 exact CSS segments. Thirty-two demo class names were removed; no new class names or changed existing rule text appeared in this comparison. It does not authorize a change to parser, compiler, renderer or runtime semantics.

The subsequent sidebar/search UI refresh retains the same global manifest, class-name set and generated rule text. Reusing the original sidebar changes page-specific class usage, yielding 207 hydration contracts, 1,908 generated rules and 2,219 exact CSS segments across the same 1,142 routes. The snapshot is updated for that reviewed UI change.

The overview refresh also retains the global manifest, class-name set and generated rule text. Its stylesheet references existing spacing and radius tokens, so nine unchanged declarations now reside in the shared stylesheet instead of repeated page-inline theme output. All removed inline declarations were verified in shared CSS with identical values; no new inline values appeared. This affects inline CSS in 1,108 routes and yields 2,212 exact segments, with 207 hydration contracts and 1,908 rules unchanged. The snapshot is refreshed for this reviewed token placement change.

The Guide overview refresh changes generated inline CSS only on `/guide`, `/en/guide` and `/tw/guide`. The global manifest and existing rule text remain identical. Seven obsolete layout/keycap classes leave the generated class set when the old overview and tutorial are removed; no new classes are introduced. Reference and other routes retain their inline CSS. The snapshot is refreshed for this reviewed Guide-only content/layout change.

## Article UI removal, 2026-09-08

- At the user's request, removed the injected Related reference section, version/source/Markdown toolbar, page-level copy-example control and alias list, including their dedicated components and styles. Article bodies, syntax tables, overview/navigation and the shared content pipeline remain in place.
- Desktop flex-wrap and 390px Traditional Chinese padding render the body directly with no removed controls or horizontal overflow. All 792 localized/canonical Reference article HTML files were checked for obsolete UI markers; none remain.
- The scoped production build, type-check, 10 Reference tests and source-budget check passed. Site lint reports no errors and the same 72 existing warnings.
- CSS baseline review: the global manifest, all existing generated rule text and the global class-name set are identical. Only the 792 Reference article routes change their contracts; their removed UI no longer contributes `flex-wrap`, `gap:sm`, `ml:xs` or `text:sm` where otherwise unused. No route gains a class. The reviewed snapshot contains 1,142 routes, 204 hydration contracts, 1,901 rules and 2,202 CSS segments.

## Outcome study still pending

`evaluation.json` contains twelve concrete tasks and the recording fields for two retrieval workflows: HTML/browser and per-page Markdown/index. No human timing, agent model score or production search improvement is claimed here. Recruit the planned new/experienced users and run both actual agent workflows before assessing those outcome thresholds or investing in semantic search.

Use `MAINTENANCE.md` for source ownership, regeneration and the repeatable validation commands.
