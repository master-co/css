# Final documentation review

Started 2026-11-02 after `65e9a31dc`. The scoped review is complete; final evidence and exclusions are recorded below. Scope: every published Guide, Reference and Blog article, their boundaries, core feature coverage, illustrations, navigation, search and portable exports. View transitions Guide and its assets are excluded at the user's request. Integration articles remain exempt from explanatory images. Preserve unrelated worktree changes.

## Decisions verified against the checkout

| Area | Evidence | Decision and status |
| --- | --- | --- |
| Fixed utilities | `site/content/guide/style-declarations/contract.mdx#fixed-utilities`, `packages/preset/src/utilities.css` | Existing Declarations lookup covers the 292 fixed utilities; do not add another property catalog. `reference.test.ts` compares every fixed preset name with the exported table and checks every family and recipe against public metadata. |
| Vite Blog | Published `bootstrapping-master-css-with-vite/content.mdx` repeats installation and the four-mode Guide table, with no explanatory figure | Rewritten around one executable button: source has two variants, emitted HTML has neither, connected DOM initially has one. New `vite-coverage` light/dark figure and text equivalent; setup stays in Guide. Static/pre-render production builds and four-mode browser observations verified. |
| Next.js Blog | Published `master-css-next/content.mdx` includes complete installation boilerplate beside a useful final-HTML argument | Retained the tested constructed badge and existing boundary figure. Replaced installation boilerplate with production handoff checks; moved adapter composition into the Next.js Guide. Dates and authors unchanged. |
| Unpublished v2 draft | `_page.tsx` rather than `page.tsx`; `search-pages.ts` requires a public page module; body has Lorem ipsum | Removed the obsolete draft and unused cover. No published route or redirect required. |

## Current coverage and evidence

The published inventory has 71 articles in scope: 37 Guide, 32 Reference and 2 Blog. Indexes and the excluded View transitions Guide are not counted. Working route/headings and duplicate-paragraph inventories are in `/tmp/master-docs-final-review/`. An exact-prose scan found one shared setup paragraph in two migration articles; this is not proof of distinct editorial purpose.

- Read and assessed the six syntax contracts (Declarations, Selectors, Conditions, Variables and modes, Cascade layers, Extraction). Keep their formal lookup separate from task Guides. Corrected an initial review mistake: `grid-cols()` already establishes `display: grid` (`packages/preset/src/utilities.css`), so the original Conditions example was valid. Removed the unnecessary added `grid`; two explicit children and adjacent prose now show the conditional recipe's complete effect. Full source/test claim verification remains part of the Reference pass.
- Read Scanning and pruning, Rendering modes, Route-level styles, Monorepo and Authoring packages. Their principal tasks are distinct: discovery/preservation, delivery, local stylesheet ownership, project boundaries and a published source vocabulary. Corrected Rendering modes calling the fixed `text-center` utility a native declaration. Remaining cross-feature coverage must still be assessed.
- Read Vite and Next.js integration Guides alongside both Blog posts. Preserve the Guide's executable setup and troubleshooting, and the Blog's causal explanation. Next.js now owns adapter composition; source evidence is `packages/next/src/index.ts`, `options.ts`, `tests/adapter.test.ts`, plus installed Next.js adapter docs.
- Blog figure review: both themes inspected as 1440 × 960 assets and article-scale screenshots. The three artifacts differ by their actual class evidence, not prose alone. No preview actions added. 28 browser profiles passed for both Blog articles: English/TW, 390/768/1440, both themes, plus English 320px at 200% text; verified theme selection, proportional size, keyboard descriptions and no page overflow/errors.
- Vite case production browser run: static starts with both rules; pre-render has neither before or after the click; runtime/progressive start with blue and add neutral after the click. No browser errors. `writing-examples.test.ts` verifies the authored files against static and pre-render builds and retains the Next.js badge output check.
- Reviewed the introduction, main installation page, syntax tutorial, theme/reuse, global styles, colors, typography, layout and responsive composition. Clarified CDN availability, implicit project definitions versus additional `@reference` context, and SVG `currentColor` painting. Retained the existing task boundaries and figures; normalized affected link labels to sentence case.
- Reviewed language service, lint and AI coding workflows. Clarified syntax errors versus invalid generated CSS, and linked cascade diagnosis to its Guide owner. Repaired a vacuous ESLint defaults check after the table moved into Reference; language settings checks now read the actual Guide table as well as gallery fixtures.
- The View transitions baseline changed during this work in metadata and two local components, accompanied by transition demo/example and policy edits. These are concurrent edits outside this task; do not restore or include them. This task has not edited the excluded files. Shared whole-site validation observes the combined workspace.

## First batch validation

Logs and browser captures: `/tmp/master-docs-final-review/`. These results cover the implemented Blog/boundary batch, not the unfinished whole-site editorial review.

| Check | Observed result |
| --- | --- |
| `prepare-app`, `build:llms`, `build:astro`, `postbuild:static` | Passed; 241 output pages, 85 verified public assets |
| Site lint and type-check; MDX imports | Passed |
| `test:reference` | 27 passed, including source-to-catalog utility/family coverage |
| `test:docs-examples` | 30 passed; authored Vite files built under static/pre-render; Next.js badge variants verified |
| Scoped delivery Blog, delivery Guide and integration exports | 3 passed; code, descriptions and both locale search records agree |
| Complete `test:llms` | 2 failures in the concurrently rewritten View transitions content: generated search changed during the run, and its `transition-name-uniqueness` study is no longer embedded. Leave resolution to that work; rerun the full suite after it stabilizes. |
| `test:css-contract` | CSS-variable checks passed; exact delivery snapshot changed (first reported route is Vite Blog; 2567 segments versus baseline 2571). Review the final combined output before a snapshot refresh. No snapshot changed in this batch. |
| Browser integration | 46 profiles passed: 28 Blog profiles plus Next.js Guide, Rendering modes and Conditions at 390/768/1440 in both themes. 8 manual theme switches and four Blog search checks passed. |
| Rendered links | All 241 output HTML routes inspected; 12172 local links checked, no missing anchors/routes/local images |
| AI context and diff whitespace | Passed |

## Second-pass coverage and changes

- Read all seven migration articles and Compatibility. Retained system-specific conversion responsibilities and original figures; corrected six articles' mode/query links and Tailwind's fixed-utility and `max-md` guidance. Official Sass mixin grammar, Tailwind hover conditions, Bootstrap thresholds and MUI scale behavior were checked against their linked sources.
- Read all ten integration articles, including their optional modes and deployment caveats. Keep framework setup in Guide and lifecycle contracts in Reference. Existing Astro static, Nuxt artifact portability, Next Turbopack and Lit asset-base caveats remain explicit; this documentation task does not repair integration implementations.
- Read all twelve token/family sheets, four utility sheets, Named conditions, package editorial and the complete directive source. Retained the complete generated values, recipes and purposeful specimens. Read Cascade layers' diagnosis alongside its contract; its task boundary remains useful.
- Found six unassigned directive sections after Native CSS preservation: their source prose was never published by the section-based generator. Consolidated useful delivery contracts into Imports, compiler APIs into Packages, and stylesheet request workflows into Vite Guide. Removed duplicate grammar, extraction and token text already owned by published contracts, and obsolete development-history detail. Generation now rejects any top-level directive section without exactly one public owner; the Reference test also compares all authored sections with the registry.
- Added the asset dependency figure to Imports. Intrinsic file sheets form a dependency tree with the literal import qualifier and relative image reference. This is a publication dependency graph, not a request waterfall; both theme assets and the portable explanation say so. Containers follow content. No preview controls were added.
- Completed the reference example by including its previously undefined `--manual-dark` mixin in `app.css`; compilation verifies the referenced token and wrapper without importing base CSS. Source evidence for delivery is `packages/compiler/tests/bug-hunt-file-delivery.test.ts` and Vite's inline/SSR suites: 34 tests across six resolved test files passed.
- Second-pass scoped checks: site lint/type-check, Reference 27, documentation examples 30 passed. Final production build, corpus browser matrix, exports and local destinations also passed; the excluded snapshot differences are recorded below.

## Final completion audit

All 71 in-scope articles have been read and assessed. Complete preset/API catalogs remain in Reference; task workflows and executable integration setup remain in Guide; Blog duplication has been replaced with causal examples. Unpublished directive sections now have explicit public owners and a generation guard. Valuable examples remain, integration image exemption is respected, and no redirects were introduced.

The full production build passes with 241 routes and 85 assets. All 710 browser profiles passed, covering both themes, mobile/tablet/desktop, enlarged text and both locale routes. New figures were additionally inspected visually. All 12,218 local destinations are valid. Reference search/catalog/export checks, 37 portable-output tests, 30 documentation examples, 14 syntax checks and two MDX import checks pass. Eight manual theme switches, four search checks and four no-JavaScript figure checks pass.

Only four in-scope CSS snapshot routes were refreshed after exact-output review. Four remaining snapshot mismatches belong exclusively to concurrent View transitions work and are not approved here. The manifest and route inventory are unchanged. No excluded source files were edited by this task.

See `site/tests/documentation-final-qa-2026-11-02.md` for the verification matrix, snapshot decisions and limitations. Historical first-batch failures above are superseded by that final record. Chromium checks and focused package tests do not claim deployment verification across every framework host.
