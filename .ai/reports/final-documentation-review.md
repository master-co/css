# Final documentation review

Started 2026-11-02 after `65e9a31dc`. This is an in-progress coverage ledger, not a completion claim. Scope: every published Guide, Reference and Blog article, their boundaries, core feature coverage, illustrations, navigation, search and portable exports. View transitions Guide and its assets are excluded at the user's request. Integration articles remain exempt from explanatory images. Preserve unrelated worktree changes.

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

## Coverage still to complete

Commit checkpoint: regenerated content and reran site lint, type-check, MDX imports, Reference (27 tests), documentation examples (30 tests), portable/search exports (37 tests), AI context and whitespace checks successfully. The concurrent View transitions export fixes are now present in the workspace, resolving the two earlier `test:llms` failures; they are outside this batch's commit. The CSS delivery snapshot still needs review during final site validation. This checkpoint does not claim a new full build or completion of the remaining editorial audit.

- Guide: introduction, installation and all integration children; compatibility; external-system migration; syntax; themes and reuse; color, typography, layout and responsive composition; global styles, layers and route CSS; scanning/pruning and delivery; package authoring and monorepos; language service, lint and AI tools.
- Reference: all 32 catalog entries, checked against grammar/engine tests, preset definitions, directive tests and public tool/package surfaces. Check missing conditions, failure behavior and ownership, not only page presence.
- Blog: first-batch integration and figure review complete; include in the final full-site regression pass.
- Verify each nonintegration article has a meaningful authored figure and complementary working examples; identify any additional explanation that needs a figure.
- Synchronize generated catalogs, search and Markdown/llms; inspect links, anchors, both themes and narrow/enlarged-text layouts. Run scoped checks, site lint, type-check, build and applicable full-site validation.
- Record concrete results here and keep View transitions edits outside this task and account for concurrent changes. Existing green validation from the previous commit does not prove this review complete.
