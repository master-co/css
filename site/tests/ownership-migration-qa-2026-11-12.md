# Shared UI ownership migration verification

This records candidate validation, not a production release or approval to deploy. The site consumes locally packed `@master/ui` 0.0.2, `@master/internal-site` 0.2.7 and `@master/internal-skills` 0.1.4 for verification. Published pins remain coordinated separately; no CSS language/compiler APIs were changed.

## Intentional contract changes

Reusable controls and semantic material values now come from Master UI. The CSS site still owns teaching examples and language/preset semantics. The homepage legitimately delivers the canonical `.btn` family; the contract gate separately detects the teaching-only `.btn-responsive` family, which remains excluded there. Reference tables use the canonical `.table`, `.table-heading`, `.table-cell` and flat sheet contracts inside the site's scroll wrapper.

The candidate project-manifest snapshot changed from `36c61f77e7575656580c2e7218044e4f882b20d189b47c9693c5265a8302a8a6` to `05f126532b386d7b3ff3cd51448efa809f6b7a5c700444c18dddc0691f909b16`. Its first reported structural difference is `theme[5].children[0].name`: `color-surface-canvas` becomes `color-surface-base`. This follows canonical UI semantic material ownership. It does not justify accepting every downstream snapshot difference automatically. The snapshot is intentionally unchanged pending the final shared import graph and independent review of the final manifest; these hashes describe the intermediate candidate only.

## Completed candidate checks

- Site TypeScript, Astro and Svelte checks passed with no errors. Lint has three existing warnings in untouched files.
- Homepage 39 checks, LLM exports 43 checks and redirect 2 checks passed. Internationalization audited 162 resources with zero problems; managed skills synchronize 3 skills / 42 files.
- Chromium and WebKit smoke checks covered 16 combinations: desktop/light and mobile/dark at `/`, `/tw`, `/guide/installation/vite` and `/reference/tokens/color`. All returned 200, had no page overflow or client errors, and passed search open/Escape interaction. CTA wording and absence of public Design System navigation were checked.
- Full candidate rendering generated 389 pages and passed the 85-asset check. Final style-delivery size gates failed; budgets were not raised. The final shared import graph is under review before repeating these checks or accepting a new contract snapshot.
- Release infrastructure tests cover the opt-in cutover identity, actual hosted shell export with both flag states, absent/partial/stale worker rejection, immutable output and source-bound failure receipts. The focused suite passes 47 tests. Workflow configuration checks also pass.

Historical reports remain unchanged. The new internal review suites live in Master's `site/tests/internal/` and explicitly require `MASTER_SITE_REVIEW=1`; they are no longer CSS product-route tests.

## Final shared import graph candidate

The surface-only shared TypeScript entries remove duplicate UI surface rules from document/table/tray delivery. The final production candidate still has the same project-manifest hash above, 389 routes and 55 delivery contracts, with exact CSS segments reduced from 2,296 to 2,248. All 517 utility definitions, custom media, custom containers, manifest version and language version are unchanged. Theme blocks 5, 6 and 9 and the derived variable catalog change with UI token ownership; 13 canonical UI mixins join the six existing site helpers. The only keyframe entry change is the compiler-generated ID of `slide-to-right`; its text and source location are identical.

| Route | CSS files | Gzip bytes | Previous gzip ceiling | Brotli bytes | Previous Brotli ceiling |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/` | 9 | 60,826 | 63,559 | 50,348 | 49,926 |
| `/404` | 7 | 18,570 | 16,328 | 15,927 | 13,762 |
| `/guide/installation/vite` | 25 | 42,596 | 37,020 | 36,530 | 31,476 |
| `/reference/tokens/color` | 27 | 47,660 | 42,275 | 40,908 | 35,974 |

Among 81 budget routes, 78 exceed previous gzip ceilings and 79 exceed previous Brotli ceilings. No file-count, import-depth or inline-byte ceiling is exceeded. Canonical UI surface duplicates are gone on sampled document routes. Remaining identical blocks include compiler-emitted theme token slices, homepage `slide-to-right` keyframes and the 404 search trigger; these are documented separately from the reusable-material migration and are not evidence that every new byte is unavoidable.

Final type checking passes with zero errors; lint retains only the three pre-existing warnings. Reference 39/39 and redirect 2/2 checks pass. The 16-profile Chromium/WebKit smoke matrix was rerun successfully. Twelve additional browser profiles cover spacing tables, direct-value tables and the fixed utility contract table on desktop/light and mobile/dark in both engines: canonical row/cell/heading classes, nonzero cell padding and no page overflow. Desktop and mobile table captures were visually reviewed. The `style-declarations` contract's four source review hashes were refreshed after independent confirmation that its `FixedUtilities.astro` dependency changed presentation only; all MDX editions and translation hashes remain unchanged.

The final route ceilings and exact contract snapshot still require the independent acceptance recorded by the coordinating reviewer. No CSS engine/compiler API, semantic preset source or runtime implementation was changed by this migration.


## Accepted route ceilings and exact snapshot

The coordinating reviewer independently accepted the final site ownership contract after checking core-source boundaries, manifest categories, canonical UI selectors and browser/table evidence. The exact snapshot is updated with this document as its QA reference. Only exceeded gzip and Brotli fields are raised to the measured bytes below; all file-count, depth, inline-byte and already-sufficient compression ceilings remain unchanged. No arbitrary margin is added.

| Route | Gzip ceiling before → after | Brotli ceiling before → after |
| --- | ---: | ---: |
| `/404` | 16,328 → 18,570 | 13,762 → 15,927 |
| `/benchmarks` | 33,219 → 37,666 | 28,321 → 32,402 |
| `/examples/layout-system` | 8,757 → 9,468 | 7,488 → 8,161 |
| `/examples/responsive-button` | 5,224 → 5,259 | 4,388 → 4,479 |
| `/guide` | 29,243 → 32,548 | 24,863 → 27,968 |
| `/guide/ai-coding` | 36,849 → 42,464 | 31,300 → 36,417 |
| `/guide/authoring-packages` | 35,218 → 40,792 | 29,927 → 35,031 |
| `/guide/cascade-layers` | 34,459 → 40,083 | 29,278 → 34,432 |
| `/guide/code-linting` | 30,672 → 34,219 | 26,035 → 29,390 |
| `/guide/colors` | 36,525 → 42,143 | 31,035 → 36,145 |
| `/guide/compatibility` | 37,238 → 42,762 | 31,690 → 36,761 |
| `/guide/global-styles` | 35,907 → 41,559 | 30,508 → 35,658 |
| `/guide/installation` | 36,911 → 43,175 | 31,330 → 37,003 |
| `/guide/installation/angular` | 36,841 → 42,417 | 31,341 → 36,395 |
| `/guide/installation/astro` | 36,841 → 42,417 | 31,341 → 36,395 |
| `/guide/installation/lit` | 35,393 → 40,941 | 30,111 → 35,169 |
| `/guide/installation/nextjs` | 36,841 → 42,417 | 31,341 → 36,395 |
| `/guide/installation/nuxtjs` | 36,841 → 42,417 | 31,341 → 36,395 |
| `/guide/installation/server-rendered` | 37,020 → 42,596 | 31,476 → 36,530 |
| `/guide/installation/storybook` | 34,193 → 39,817 | 29,058 → 34,212 |
| `/guide/installation/svelte` | 36,841 → 42,417 | 31,341 → 36,395 |
| `/guide/installation/vite` | 37,020 → 42,596 | 31,476 → 36,530 |
| `/guide/installation/webpack` | 37,020 → 42,596 | 31,476 → 36,530 |
| `/guide/introduction` | 34,459 → 41,229 | 29,278 → 35,383 |
| `/guide/language-service` | 33,191 → 36,713 | 28,162 → 31,470 |
| `/guide/layout-system` | 36,116 → 41,768 | 30,670 → 35,820 |
| `/guide/migration` | 32,848 → 36,406 | 27,872 → 31,196 |
| `/guide/migration/bootstrap` | 30,712 → 34,264 | 26,071 → 29,427 |
| `/guide/migration/css-in-js` | 32,160 → 35,733 | 27,301 → 30,655 |
| `/guide/migration/css` | 34,499 → 40,128 | 29,314 → 34,469 |
| `/guide/migration/material-ui` | 32,339 → 35,912 | 27,436 → 30,790 |
| `/guide/migration/sass` | 32,339 → 35,912 | 27,436 → 30,790 |
| `/guide/migration/shadcn-ui` | 32,339 → 35,874 | 27,436 → 30,751 |
| `/guide/migration/tailwindcss` | 32,339 → 35,912 | 27,436 → 30,790 |
| `/guide/monorepo` | 31,431 → 34,928 | 26,684 → 29,989 |
| `/guide/rendering-modes` | 33,499 → 36,998 | 28,453 → 31,708 |
| `/guide/responsive-design` | 39,306 → 44,769 | 33,466 → 38,434 |
| `/guide/reusing-styles` | 36,086 → 41,738 | 30,643 → 35,793 |
| `/guide/route-level-styles` | 35,218 → 40,792 | 29,927 → 35,031 |
| `/guide/scanning-and-pruning` | 30,672 → 34,219 | 26,035 → 29,390 |
| `/guide/syntax-tutorial` | 36,086 → 41,738 | 30,643 → 35,793 |
| `/guide/theme` | 35,907 → 41,559 | 30,508 → 35,658 |
| `/guide/typography` | 34,459 → 40,083 | 29,278 → 34,432 |
| `/guide/view-transitions` | 36,295 → 41,947 | 30,805 → 35,955 |
| `/` | 63,559 → 63,559 | 49,926 → 50,348 |
| `/reference` | 29,745 → 33,050 | 25,276 → 28,381 |
| `/reference/direct-values` | 38,934 → 42,200 | 33,118 → 36,208 |
| `/reference/directives/definitions` | 38,614 → 41,888 | 32,821 → 35,919 |
| `/reference/directives/imports` | 38,614 → 41,918 | 32,821 → 35,940 |
| `/reference/directives/pruning` | 38,614 → 41,888 | 32,821 → 35,919 |
| `/reference/directives/queries` | 38,614 → 41,888 | 32,821 → 35,919 |
| `/reference/directives/scanning` | 38,614 → 41,888 | 32,821 → 35,919 |
| `/reference/directives/theme` | 38,614 → 41,918 | 32,821 → 35,940 |
| `/reference/grid-tracks` | 38,990 → 42,227 | 33,170 → 36,229 |
| `/reference/packages` | 38,614 → 41,918 | 32,821 → 35,940 |
| `/reference/rules/conditions` | 38,614 → 41,918 | 32,821 → 35,940 |
| `/reference/rules/declarations` | 38,614 → 41,918 | 32,821 → 35,940 |
| `/reference/rules/extraction` | 38,614 → 41,918 | 32,821 → 35,940 |
| `/reference/rules/layers` | 38,614 → 41,918 | 32,821 → 35,940 |
| `/reference/rules/modes` | 38,614 → 41,918 | 32,821 → 35,940 |
| `/reference/rules/named-conditions` | 38,895 → 42,173 | 33,090 → 36,181 |
| `/reference/rules/selectors` | 38,614 → 41,918 | 32,821 → 35,940 |
| `/reference/sr-only` | 38,922 → 42,212 | 33,096 → 36,209 |
| `/reference/tokens/color-roles` | 42,311 → 47,610 | 35,996 → 40,841 |
| `/reference/tokens/color` | 42,275 → 47,660 | 35,974 → 40,908 |
| `/reference/tokens/container` | 42,344 → 47,654 | 36,023 → 40,882 |
| `/reference/tokens/families` | 41,858 → 47,239 | 35,583 → 40,501 |
| `/reference/tokens/font` | 42,063 → 47,405 | 35,782 → 40,662 |
| `/reference/tokens/leading` | 41,972 → 47,353 | 35,701 → 40,615 |
| `/reference/tokens/motion` | 42,311 → 47,669 | 36,003 → 40,896 |
| `/reference/tokens/radius` | 42,469 → 47,782 | 36,150 → 40,998 |
| `/reference/tokens/shadow` | 42,478 → 47,791 | 36,145 → 41,006 |
| `/reference/tokens/spacing` | 42,263 → 47,626 | 35,952 → 40,856 |
| `/reference/tokens/text` | 41,981 → 47,362 | 35,702 → 40,615 |
| `/reference/tokens/tracking` | 42,002 → 47,381 | 35,720 → 40,638 |
| `/reference/tools/cli` | 38,614 → 41,918 | 32,821 → 35,940 |
| `/reference/tools/mcp` | 38,614 → 41,918 | 32,821 → 35,940 |
| `/reference/truncation` | 39,149 → 42,372 | 33,336 → 36,372 |
| `/guide/optimizing-css-delivery` | 33,058 → 36,583 | 28,049 → 31,350 |

After acceptance, a fresh complete site build passed preparation, all 162 translation resources, static rendering of 389 pages, verification of 85 referenced public assets, and the final 389-route / 45-CSS-asset style audit. The exact contract check also passes with 55 delivery contracts and 2,248 CSS segments. Release tests pass 47/47 and workflow configuration checks pass. The final skill snapshot synchronizes three skills / 42 files, with the AI-context budget check passing.

The final shared inventory has two meaningful redirects and 38 retired private/helper routes returning 410. The initial candidate worker was exercised for all 960 exact combinations (40 sources × six prefixes including `/en` × four URL suffixes), with query preservation, noindex on gone responses, empty HEAD 410 bodies and unknown-path asset fallback to 404. That first check did not establish destination availability: final independent review caught invalid locale-prefixed Design destinations before publication. The shared helper now defaults to the manifest's exact destination, with explicit localized overrides only for real pages; Design's currently English-only pages must serve every incoming locale. CSS adds independent assertions for both real English destinations across all 24 source variants each, including explicit `/guidelines/*.md` exports instead of inferred Markdown paths. Final registry-backed route verification must supersede the candidate destination check. The route configuration uses 30 patterns. Default-off postbuild was restored and verified to remove both worker and routing assets. Enabling production remains destination-first and separately coordinated.


## Final generic badge and dialog cleanup

A final ownership pass removed the parallel generic badge recipe, dead menu recipe and private-only scroll wrapper from the published platform. Actual badge consumers now use UI badge classes; a single violet teaching-tone variable adapter remains. The support indicator renders both future state classes in server HTML and hides the inactive wrapper, preserving prerendered styles after hydration. The two legacy radius names now alias UI `radius-control-lg` and `radius-surface`; their numeric geometry is unchanged. The project manifest changes from `05f126532b386d7b3ff3cd51448efa809f6b7a5c700444c18dddc0691f909b16` to `a39dba8bf3e2efab8a66e2e1115541579f26dd54fce2d158b4b11bb13cce2f8f`. Mixins, all utilities, media/container definitions and language versions remain unchanged. Only theme/derived-variable aliases and generated keyframe source metadata differ.

The coordinating reviewer accepted the 13 remaining compression deltas below, after confirming canonical badge CSS is delivered once. No file/depth/inline cap changes are required. Homepage and 404 transfer decrease by 320 gzip / 282 Brotli bytes; the compatibility guide decreases by 1,166 / 1,035 bytes. Eight additional Chromium/WebKit desktop/light and mobile/dark badge checks pass, including exactly one visible support state after hydration and no overflow. Captures were visually reviewed.

| Route | Gzip ceiling before → after | Brotli ceiling before → after |
| --- | ---: | ---: |
| `/benchmarks` | 37,666 → 38,921 | 32,402 → 33,469 |
| `/reference/tokens/color-roles` | 47,610 → 48,864 | 40,841 → 41,907 |
| `/reference/tokens/color` | 47,660 → 48,914 | 40,908 → 41,974 |
| `/reference/tokens/container` | 47,654 → 48,908 | 40,882 → 41,948 |
| `/reference/tokens/families` | 47,239 → 48,493 | 40,501 → 41,567 |
| `/reference/tokens/font` | 47,405 → 48,659 | 40,662 → 41,728 |
| `/reference/tokens/leading` | 47,353 → 48,607 | 40,615 → 41,681 |
| `/reference/tokens/motion` | 47,669 → 48,923 | 40,896 → 41,962 |
| `/reference/tokens/radius` | 47,782 → 49,036 | 40,998 → 42,064 |
| `/reference/tokens/shadow` | 47,791 → 49,045 | 41,006 → 42,072 |
| `/reference/tokens/spacing` | 47,626 → 48,880 | 40,856 → 41,922 |
| `/reference/tokens/text` | 47,362 → 48,616 | 40,615 → 41,681 |
| `/reference/tokens/tracking` | 47,381 → 48,635 | 40,638 → 41,704 |

The shell interface contract now detects `.ui-header`, because generic dialog paint is a lazy UI component. It still requires the interface on home/404 and excludes it from standalone teaching pages. The historical mobile-navigation test's chapter sidebar expectation was explicitly retired: the pre-task menu already contained site links, community links and preferences. Tests retain Guide/Reference/Blog and localized destination coverage, nested search, keyboard focus and Escape coverage.

Search handoff was also corrected in the historical test expectations: the preserved pre-task menu closes before opening search, then search restores a visible header trigger. It does not leave a second modal underneath. After checking the current template, fourteen product-navigation cases across Chromium/WebKit pass; the full documentation-search suite passes 20 cases in each engine. Search captures now wait for the canonical dialog's entrance animation to finish, avoiding misleading partially transparent frames.

A separate 320px / 200% text / Traditional Chinese WebKit case exposed a real reflow defect: the footer's implicit grid column took a 290.75px intrinsic language-select width inside a 224px content area, making the 320px dialog scroll to 339px. The owning footer now declares `grid-template-columns: minmax(0, 1fr)`. Controlled checks show WebKit's language select clamps to 224px and the dialog to 320px; Chromium at 200% and both engines at normal text retain identical geometry. The change is one grid sizing constraint, with no menu layout redesign.


The final packed reflow correction passes all eight affected navigation cases in Chromium and all eight in WebKit, including actual 200% Traditional Chinese layout. The exact snapshot differs by the single footer grid declaration; its project manifest is unchanged. Emitted cost is 36 raw, 10 gzip and 5 Brotli bytes per affected shell route. Only the same 13 already-tight compression ceilings require this exact increment:

| Route | Gzip ceiling before → after | Brotli ceiling before → after |
| --- | ---: | ---: |
| `/benchmarks` | 38,921 → 38,931 | 33,469 → 33,474 |
| `/reference/tokens/color-roles` | 48,864 → 48,874 | 41,907 → 41,912 |
| `/reference/tokens/color` | 48,914 → 48,924 | 41,974 → 41,979 |
| `/reference/tokens/container` | 48,908 → 48,918 | 41,948 → 41,953 |
| `/reference/tokens/families` | 48,493 → 48,503 | 41,567 → 41,572 |
| `/reference/tokens/font` | 48,659 → 48,669 | 41,728 → 41,733 |
| `/reference/tokens/leading` | 48,607 → 48,617 | 41,681 → 41,686 |
| `/reference/tokens/motion` | 48,923 → 48,933 | 41,962 → 41,967 |
| `/reference/tokens/radius` | 49,036 → 49,046 | 42,064 → 42,069 |
| `/reference/tokens/shadow` | 49,045 → 49,055 | 42,072 → 42,077 |
| `/reference/tokens/spacing` | 48,880 → 48,890 | 41,922 → 41,927 |
| `/reference/tokens/text` | 48,616 → 48,626 | 41,681 → 41,686 |
| `/reference/tokens/tracking` | 48,635 → 48,645 | 41,704 → 41,709 |

## Published package verification

The first registry-backed pass uses `@master/ui@0.0.2`, `@master/internal-site@0.2.7` and `@master/internal-skills@0.1.4`, with exact lockfile integrities and exact release-age exceptions. Candidate package directories and stale pnpm resolver links were quarantined. A clean frozen Bun installation then matched every registry archive file byte for byte: UI 308 files, shared site 774 files and skills 48 files. The site resolves the same packages as the workspace root. Skills sync records Master Design 0.3.0, source commit `8e436f8927995e31717976b4c276bd6f92cb6848` and snapshot `b0840b92bb6e0c79c77c1388097131eae7cd3fe4842d76681fefcad98c8942ff`.

The corrected published worker passed all 960 source variants with independent expectations for the two English HTML destinations and their explicit `/guidelines/*.md` exports. Query preservation, 38 gone sources, noindex, empty HEAD responses and unknown-path 404 fallback passed. Local opt-in postbuild emitted that exact tested worker with 30 routing patterns; restoring the default-off build removed both worker files. These results supersede the earlier candidate's invalid destination assumptions.

The registry build passed 389 pages, 85 referenced assets, the 389-route/46-asset delivery budget and the unchanged 389/55/2251 exact CSS contract. Type checking, translation audit (162 resources), Reference (39), LLM exports (43), executable documentation (28), release contracts (47), release configuration, AI context and skills checks passed. Lint retains the same three pre-existing warnings. Final deployment is held for the shared site's separately verified first-interaction hydration fix; no additional CSS budget or snapshot change was accepted during this registry pass.

## Follow-up: rendered ownership audit (release held)

Published shared site 0.2.8 was installed and byte-verified in an isolated validation checkout, preserving the user's active pnpm development tree. Its clean type check, 389-page build and unchanged exact contract passed. Four Chromium/WebKit desktop/mobile cases held client scripts, verified disabled SSR triggers, then released scripts and exercised the first search/menu interaction. This establishes hydration readiness only. The subsequent visual audit found incomplete material migration, so deployment and the final task commit remain held.

The audit covered eight representative routes in 32 light/dark, narrow/wide and DPR1/2 page profiles, followed by eight interaction profiles including 320px Traditional Chinese at 200% text and an explicit round-token scenario. Settled screenshots exposed native row headings inheriting centered/bold browser defaults; UI tray exteriors containing older stage/code/disclosure paint; old code tabs and inline-code/prompt/parameter faces; oversized generic button icons; and mismatched preview control density. No additional page overflow or JavaScript errors appeared in these profiles. The round-token scenario is a simulation, not proof of an engine lacking corner-shape support. Local Firefox fails to launch with a profile-folder error; Linux Firefox CI remains required.

CSS-owned consumption now imports shared TypeScript style entries so canonical UI modules share one import graph. Its four stage containers use `sheet sheet-flat`, and editorial inline code uses `code`. Headings, ordinary data-table identifiers, figure captions and teaching specimens retain plain code. The Reference AST classifier has a regression distinguishing these contexts; all 12 localization tests pass. Local table rules no longer clear code-chip background, shadow, padding or radius. The only translation-review invalidation is the four editions of `guide/syntax-tutorial`, caused by the presentation-only TokenValues import/class update; the tutorial text and values did not change.

`ui-material-consumption.e2e.mjs` now compares native row-heading behavior with same-class data cells, compares actual stage/tray/code faces with their canonical UI face after temporarily removing only the site hook, and checks plain lookup identifiers, editorial chips and code-tab keyboard activation. Four profiles cover themes, density, enlarged text and explicit round tokens. It fails on the old output at the independently observed `center` versus `start` row-heading defect. The existing release verifier runs this suite asynchronously against its exact artifact server in every selected browser and records the outcome in `material`; a failing result fails the release gate. All six static verifier regressions pass. New candidate visual, browser, budget and exact-contract results must be recorded before this hold is lifted; prior budget approvals do not authorize fresh deltas.

## Canonical material candidate acceptance and delivery attribution

The final visual candidate uses UI `0.0.3-audit.2` (tarball SHA256 `452d4c3ace5bbed1d425b9eec4bd98cfd319c89c84b4eef0147b87833c66f0a1`) and shared site `0.2.9-audit.3` (`c924cff4fae779b6c0a54e3021ceb4bb2d19e5c654bc165de5bbeea3a4a1f70a`), installed only in the isolated CSS checkout. The candidate builds 389 pages and validates all 85 referenced public assets. Its output is frozen before serving so subsequent builds cannot mix old HTML with new hashed assets.

The actual native table, stage, tray, code panel, editorial chip and tab keyboard regressions pass in Chromium and WebKit across the four profiles. The native row heading correctly uses the same 460 weight as a role-based row heading, rather than the ordinary cell's 350. All 389 rendered pages were scanned: no generic button icon remains without `.icon` outside intentional header composition, and no raw `ui-tray` lacks `tray`. The changed controls, nested wells, code tabs and narrow layouts were inspected in settled screenshots. Original whole-task shell measurements were recovered from `work/evidence/before/measurements.json`, SHA256 recorded in the tracked `document-column-baseline.json`; both themes and widths retain header, sidebar, main and TOC geometry. This baseline was not captured from the new output.

The broader test run exposed a real forced-colors focus regression in the canonical command input. UI audit.2 restores its 2px inset Highlight focus outline. Selected listbox rows intentionally use system Highlight fill and HighlightText ink; the consumer test now checks those exact colors, including descriptions and query marks, rather than requiring the retired site's extra outline. The candidate also exposed an unrelated cross-site Traditional Chinese next-article card overflow at 320px/200% text; Master owns that correction and its regression. Fresh immutable Master output with the two-declaration grid/minimum-size fix passes the focused Chromium/WebKit 320px/200% Traditional Chinese cross-site checks.

Four historical navigation failures were repaired without dropping the flows: the missing ignored geometry artifact became a tracked copy of original measurements; English/Traditional Chinese Blog inventory expectations now include the existing third article; and an author without a profile URL is tested as readable attribution, while the linked author's 44px target requirement remains. Candidate tests verify CSS's exact 301 to `master.co` and proxy a separate destination navigation to the immutable Master candidate, because Playwright interception does not catch redirected URLs. Public validation without the candidate override follows the actual redirect chain. This avoids treating public HTML mixed with candidate assets as product evidence.

Every raw/gzip/Brotli route delta below reconciles exactly to added asset totals minus removed asset totals; there are no unattributed bytes. New shared entries load canonical button/icon, code and related UI parts once; file-count increases are zero to two. Depth remains 1 and inline bytes are unchanged. An 81-route duplicate audit found no repeated generic UI paint. The remaining repeated project theme/font aliases and lesson keyframes existed in the prior output; the new 404 search-trigger duplicate was removed before these measurements. Relative to the previously approved platform-migration working snapshot, the visual-audit project manifest remains byte-identical at `a39dba8bf3e2efab8a66e2e1115541579f26dd54fce2d158b4b11bb13cce2f8f`, with the same 389 routes; exact delivered CSS segments change from 2,251 to 2,244. Final removal of the redundant single-file CodeTabBar import separates delivery contracts from 55 to 58, as explained below. This is an interim-to-visual comparison, not a claim that the original HEAD manifest is unchanged. No compiler, preset, runtime or other CSS core source changed.

Under the parent review's explicit allowance for canonical component entries, only exceeded ceilings were set to current measured values: 77 routes, 28 file-count fields, 76 gzip fields and 77 Brotli fields. The redundant CodeTabBar import removal saves one stylesheet request, 1,555 gzip bytes and 1,330 Brotli bytes on 57 English routes and their localized equivalents. These provisional ceilings were recomputed from the pre-visual ceilings, so obsolete audit.2 increases were removed. All under-ceiling values, depth, inline limits, family exclusions and localized equality checks remain intact; no margin was added. The table records actual previous and current delivery measurements, not an arbitrary budget allowance. Full asset-level evidence is retained in `work/css-visual-audit/route-deltas.json`; representative bundle attribution follows the route table.

| Route | Files before → after | Gzip before → after | Brotli before → after |
| --- | ---: | ---: | ---: |
| `/404` | 7 → 7 | 18,260 → 19,157 | 15,650 → 16,452 |
| `/benchmarks` | 19 → 20 | 38,931 → 40,585 | 33,474 → 34,890 |
| `/examples/article-transitions` | 4 → 5 | 11,914 → 12,081 | 10,221 → 10,331 |
| `/examples/layout-system` | 3 → 3 | 9,288 → 9,301 | 8,012 → 8,021 |
| `/examples/responsive-button` | 2 → 2 | 5,259 → 5,259 | 4,479 → 4,479 |
| `/examples/view-transitions` | 5 → 5 | 10,801 → 10,653 | 9,270 → 9,164 |
| `/guide` | 15 → 16 | 32,237 → 34,396 | 27,690 → 29,572 |
| `/guide/ai-coding` | 25 → 27 | 42,153 → 45,816 | 36,139 → 39,252 |
| `/guide/authoring-packages` | 23 → 24 | 40,481 → 42,709 | 34,753 → 36,620 |
| `/guide/cascade-layers` | 22 → 24 | 39,772 → 43,598 | 34,154 → 37,385 |
| `/guide/code-linting` | 19 → 20 | 33,908 → 36,384 | 29,112 → 31,202 |
| `/guide/colors` | 24 → 26 | 41,832 → 45,713 | 35,867 → 39,152 |
| `/guide/compatibility` | 23 → 24 | 41,606 → 43,677 | 35,731 → 37,464 |
| `/guide/global-styles` | 23 → 25 | 41,248 → 45,129 | 35,380 → 38,665 |
| `/guide/installation` | 27 → 29 | 42,864 → 46,483 | 36,725 → 39,787 |
| `/guide/installation/angular` | 24 → 26 | 42,106 → 46,002 | 36,117 → 39,413 |
| `/guide/installation/astro` | 24 → 25 | 42,106 → 44,447 | 36,117 → 38,083 |
| `/guide/installation/lit` | 23 → 25 | 40,630 → 44,471 | 34,891 → 38,133 |
| `/guide/installation/nextjs` | 24 → 25 | 42,106 → 44,447 | 36,117 → 38,083 |
| `/guide/installation/nuxtjs` | 24 → 25 | 42,106 → 44,447 | 36,117 → 38,083 |
| `/guide/installation/server-rendered` | 25 → 26 | 42,285 → 44,626 | 36,252 → 38,218 |
| `/guide/installation/storybook` | 22 → 23 | 39,506 → 41,820 | 33,934 → 35,873 |
| `/guide/installation/svelte` | 24 → 25 | 42,106 → 44,447 | 36,117 → 38,083 |
| `/guide/installation/vite` | 25 → 26 | 42,285 → 44,626 | 36,252 → 38,218 |
| `/guide/installation/webpack` | 25 → 26 | 42,285 → 44,626 | 36,252 → 38,218 |
| `/guide/introduction` | 23 → 25 | 40,918 → 44,744 | 35,105 → 38,336 |
| `/guide/language-service` | 22 → 23 | 36,402 → 38,839 | 31,192 → 33,240 |
| `/guide/layout-system` | 24 → 25 | 41,457 → 43,783 | 35,542 → 37,497 |
| `/guide/migration` | 22 → 24 | 36,095 → 39,238 | 30,918 → 33,580 |
| `/guide/migration/bootstrap` | 19 → 20 | 33,953 → 36,429 | 29,149 → 31,239 |
| `/guide/migration/css-in-js` | 20 → 21 | 35,422 → 37,953 | 30,377 → 32,521 |
| `/guide/migration/css` | 22 → 24 | 39,817 → 43,643 | 34,191 → 37,422 |
| `/guide/migration/material-ui` | 21 → 22 | 35,601 → 38,132 | 30,512 → 32,656 |
| `/guide/migration/sass` | 21 → 22 | 35,601 → 38,132 | 30,512 → 32,656 |
| `/guide/migration/shadcn-ui` | 21 → 22 | 35,563 → 38,094 | 30,473 → 32,617 |
| `/guide/migration/tailwindcss` | 21 → 22 | 35,601 → 38,132 | 30,512 → 32,656 |
| `/guide/monorepo` | 20 → 21 | 34,617 → 37,050 | 29,711 → 31,767 |
| `/guide/optimizing-css-delivery` | 22 → 23 | 36,272 → 38,760 | 31,072 → 33,182 |
| `/guide/rendering-modes` | 22 → 23 | 36,687 → 39,190 | 31,430 → 33,547 |
| `/guide/responsive-design` | 25 → 27 | 44,278 → 48,159 | 38,007 → 41,292 |
| `/guide/reusing-styles` | 24 → 26 | 41,427 → 45,308 | 35,515 → 38,800 |
| `/guide/route-level-styles` | 23 → 25 | 40,481 → 44,264 | 34,753 → 37,950 |
| `/guide/scanning-and-pruning` | 19 → 20 | 33,908 → 36,384 | 29,112 → 31,202 |
| `/guide/syntax-tutorial` | 24 → 26 | 41,427 → 45,308 | 35,515 → 38,800 |
| `/guide/theme` | 23 → 25 | 41,248 → 45,129 | 35,380 → 38,665 |
| `/guide/typography` | 22 → 23 | 39,772 → 42,043 | 34,154 → 36,055 |
| `/guide/view-transitions` | 25 → 26 | 41,636 → 43,962 | 35,677 → 37,632 |
| `/` | 9 → 10 | 60,516 → 62,514 | 50,071 → 51,759 |
| `/reference` | 16 → 17 | 32,739 → 34,878 | 28,103 → 29,952 |
| `/reference/direct-values` | 25 → 26 | 41,044 → 43,488 | 35,178 → 37,226 |
| `/reference/directives/definitions` | 25 → 26 | 40,732 → 43,176 | 34,889 → 36,937 |
| `/reference/directives/imports` | 25 → 26 | 40,762 → 43,206 | 34,910 → 36,958 |
| `/reference/directives/pruning` | 25 → 26 | 40,732 → 43,176 | 34,889 → 36,937 |
| `/reference/directives/queries` | 25 → 26 | 40,732 → 43,176 | 34,889 → 36,937 |
| `/reference/directives/scanning` | 25 → 26 | 40,732 → 43,176 | 34,889 → 36,937 |
| `/reference/directives/theme` | 25 → 26 | 40,762 → 43,206 | 34,910 → 36,958 |
| `/reference/grid-tracks` | 25 → 26 | 41,071 → 43,515 | 35,199 → 37,247 |
| `/reference/packages` | 25 → 26 | 40,762 → 43,206 | 34,910 → 36,958 |
| `/reference/rules/conditions` | 25 → 26 | 40,762 → 43,206 | 34,910 → 36,958 |
| `/reference/rules/declarations` | 25 → 26 | 40,762 → 43,206 | 34,910 → 36,958 |
| `/reference/rules/extraction` | 25 → 26 | 40,762 → 43,206 | 34,910 → 36,958 |
| `/reference/rules/layers` | 25 → 26 | 40,762 → 43,206 | 34,910 → 36,958 |
| `/reference/rules/modes` | 25 → 26 | 40,762 → 43,206 | 34,910 → 36,958 |
| `/reference/rules/named-conditions` | 25 → 26 | 41,017 → 43,461 | 35,151 → 37,199 |
| `/reference/rules/selectors` | 25 → 26 | 40,762 → 43,206 | 34,910 → 36,958 |
| `/reference/sr-only` | 25 → 26 | 41,056 → 43,500 | 35,179 → 37,227 |
| `/reference/tokens/color-roles` | 28 → 29 | 48,874 → 51,055 | 41,912 → 43,749 |
| `/reference/tokens/color` | 28 → 29 | 48,924 → 51,105 | 41,979 → 43,816 |
| `/reference/tokens/container` | 28 → 29 | 48,918 → 51,099 | 41,953 → 43,790 |
| `/reference/tokens/families` | 28 → 29 | 48,503 → 50,684 | 41,572 → 43,409 |
| `/reference/tokens/font` | 28 → 29 | 48,669 → 50,850 | 41,733 → 43,570 |
| `/reference/tokens/leading` | 28 → 29 | 48,617 → 50,798 | 41,686 → 43,523 |
| `/reference/tokens/motion` | 28 → 29 | 48,933 → 51,114 | 41,967 → 43,804 |
| `/reference/tokens/radius` | 28 → 29 | 49,046 → 51,227 | 42,069 → 43,906 |
| `/reference/tokens/shadow` | 28 → 29 | 49,055 → 51,236 | 42,077 → 43,914 |
| `/reference/tokens/spacing` | 28 → 29 | 48,890 → 51,071 | 41,927 → 43,764 |
| `/reference/tokens/text` | 28 → 29 | 48,626 → 50,807 | 41,686 → 43,523 |
| `/reference/tokens/tracking` | 28 → 29 | 48,645 → 50,826 | 41,709 → 43,546 |
| `/reference/tools/cli` | 25 → 26 | 40,762 → 43,206 | 34,910 → 36,958 |
| `/reference/tools/mcp` | 25 → 26 | 40,762 → 43,206 | 34,910 → 36,958 |
| `/reference/truncation` | 25 → 26 | 41,216 → 43,660 | 35,342 → 37,390 |

### Representative asset attribution: `/reference/packages`

Files 25 → 26; gzip 40762 → 43206; Brotli 34910 → 36958.

| Changed bundle | Old gzip | New gzip | Delta | Current native UI families |
| --- | ---: | ---: | ---: | --- |
| interface | 3513 | 1861 | -1652 | btn |
| documents | 1852 | 1801 | -51 |  |
| DocHeader | 3456 | 3298 | -158 | btn, badge, select |
| DocSidebar | 889 | 928 | 39 | badge |
| shared module chunks | 4564 | 7914 | 3350 | btn, icon, input, select, badge |
| reference | 502 | 482 | -20 | code |
| Code | 791 | 0 | -791 | no tabs loaded on this single-file route |
| Doc | 3129 | 3144 | 15 |  |
| DocumentIllustration | 539 | 496 | -43 |  |
| DocumentOptionEntry | 839 | 745 | -94 |  |
| badge | 1755 | 0 | -1755 |  |
| callout | 773 | 1003 | 230 | alert |
| copy | 2023 | 1633 | -390 |  |
| disclosure | 1011 | 1614 | 603 | accordion |
| prose | 1641 | 1615 | -26 |  |
| reference-route | 2003 | 3284 | 1281 | card, code |
| stage | 543 | 601 | 58 |  |
| surface | 1229 | 1242 | 13 | sheet, tray |
| table | 1446 | 1501 | 55 | table |
| tray-code | 631 | 679 | 48 | window, alert, btn |
| code-ui | 0 | 1639 | 1639 | code, btn |
| inline-code | 0 | 93 | 93 |  |


## Three-phase contract reconciliation

| Phase | Project manifest SHA256 | Routes | Delivery contracts | Exact CSS segments |
| --- | --- | ---: | ---: | ---: |
| Original CSS HEAD | `36c61f77e7575656580c2e7218044e4f882b20d189b47c9693c5265a8302a8a6` | 389 | 54 | 2,187 |
| Previously approved platform-migration working snapshot | `a39dba8bf3e2efab8a66e2e1115541579f26dd54fce2d158b4b11bb13cce2f8f` | 389 | 55 | 2,251 |
| Visual material candidate audit.3 | `a39dba8bf3e2efab8a66e2e1115541579f26dd54fce2d158b4b11bb13cce2f8f` | 389 | 58 | 2,244 |

The whole-task project manifest intentionally changes: importing the canonical UI theme adds 70 site role variables and changes 30 configured role values/aliases. Existing surface, text, line, shadow and radius roles now resolve to UI's executable definitions; this is an intentional site appearance change. Three unused site-only text-status names (`color-text-success`, `color-text-danger`, `color-text-info`) are removed. They were explicit declarations in the former internal-site `docs-shell/theme.css`, not public CSS preset defaults, and have no remaining first-party consumers. Thirteen canonical UI mixins are added; `--ui-sheet-face` and `--ui-focus-ring` delegate to their UI counterparts. The site's `slide-to-right` keyframe has a new internal ID/source offset after the theme file changed, but its public name and animation text remain identical. Preset keyframes are unchanged.

Across original HEAD → platform → visual, manifest version 6, language version 18, custom media, custom containers and utility definitions are identical. A per-route comparison of all 389 delivery contracts finds no change in hydration version/bytes/hash, resource order or class-name replay data. Parsing every utilities-layer rule across all distinct contracts finds all 242 original rules unchanged; the platform migration activates exactly three already-existing preset display utilities: `.table { display: table }`, `.table-cell { display: table-cell }`, `.table-row { display: table-row }`. No existing utility rule changes or disappears. The visual phase retains all 245 rules without additions, changes or removals.

Those three display rules explain the 54 → 55 deduplication split exactly: Reference directive pages for definitions, pruning, queries and scanning do not contain rendered native tables; the other formerly equivalent Reference pages do. Comparing those two interim contracts yields only the three display rules. All original route IDs remain, while all 389 original route CSS-content hashes change due to shared site/UI material delivery. Contract hashes are exact bytes, not language API identifiers. The visual phase changes 388 of those byte hashes. The final single-file tabs import removal creates three further delivery splits (55 → 58): authoring-packages versus route-level-styles; cascade-layers versus typography; and Angular installation versus Astro/Next/Nuxt/Svelte installation. In every pair, the exact difference is the same 14 native UI tabs/code-tab CSS segments, delivered only where tabs actually render. No hydration or manifest metadata changes accompany these splits. Full named-variable/mixin differences and per-route metadata checks are retained in `work/css-visual-audit/three-phase-contract-review.json`; this analysis does not authorize a CSS language or core package change.


## Final official package acceptance

The final isolated checkout uses exact registry pins `@master/ui@0.0.3`, `@master/internal-site@0.2.9` and `@master/internal-skills@0.1.4`. All candidate package directories were quarantined before `bun install --frozen-lockfile --force`. Every installed file matches the separately downloaded, integrity-verified registry archive: UI 308 files, shared site 775 files, skills 48 files. The shared archive SHA256 is `3a2c8b0fbc132143d95d91f9417383eaa4a05382ec68655e3760c13fe16f4932`; the publisher independently matched it to the CI archive. The 774 shared and 288 UI nonmetadata authored files are byte-identical to the accepted visual candidates.

The official build renders 389 pages, verifies 85 referenced assets and passes the 389-route / 46-CSS-asset delivery guard with the exact ceilings recorded above. Its complete CSS contract is byte-identical to audit.3. The reviewed official snapshot now records 389 routes, 58 contracts and 2,244 CSS segments; the unchanged 242 original utility rules and three-phase manifest distinction remain explicit above. Astro/Svelte/TypeScript checks pass with no errors or warnings; Reference 40, LLM exports 43, executable documentation 28, release contracts 47, redirects 2 and release-configuration checks pass.

Exactly four `guide/syntax-tutorial/content.mdx` review source hashes were refreshed from the official dependency graph after comparing the real and isolated English source and every translated body byte-for-byte. Translation hashes are unchanged. The new source hash is `ef5b725e5e754fa40ca2b2356d0195c63c09134c9a0a0a6d0ee3927f71c2fc6c`; all 162 translation resources pass audit. This operation did not reinterpret the old active dependency tree as the final source graph.

The final official browser verifier passes all 136 Chromium/WebKit route/theme/viewport profiles, 10 no-JavaScript locale checks and eight canonical material profiles, with zero failures across 389 pages and 43,505 local links. Forty additional search cases pass, including forced-colors keyboard focus, selected-row ink, query preservation and 320px/200% text. Published shared CI separately covers three browser engines; local Firefox remains unavailable. VoiceOver testing was explicitly waived by the user. The official postbuild emits the exact-route worker only with `MASTER_LEGACY_DESIGN_CUTOVER=1`, and removes worker/routes again with the default-off setting. Deployment remains gated on the owning destinations being live.

After isolated acceptance, only three active checkout resolution entries were refreshed: root shared-site, root UI, and the site's UI symlink (now pointing at the same root UI to avoid duplicate module identities). Their prior directories/symlink are quarantined for rollback; the pnpm store was not modified and both untracked pnpm files retain their recorded SHA256 hashes. Only the confirmed Codex-owned Bun development process on port 4328 was restarted. Homepage, theme and the previously failing Reference packages route now return HTTP200; the Reference page's hydrated search also works without browser errors. The preserved local pnpm tree still selects its existing Astro7.4.10, while official validation uses the locked Astro7.4.2; this bounded readiness check does not claim full dependency-tree parity.


### Cutover rehearsal blocker discovered after static acceptance

A real Wrangler 4.129.0 Pages rehearsal rejects the published 0.2.9 `_routes.json`: six explicit trailing-slash entries overlap their corresponding `/*` entries. File-presence checks and direct worker tests did not exercise this Pages routing validator. Production cutover remains off while the shared package is corrected; the successful rendering/browser checks above do not establish deployability of that cutover artifact.

The bounded correction removes only those redundant slash entries (30 → 24 includes). The corrected canonical shared helper generates JSON byte-identical to the artifact accepted by real Wrangler. That running worker passes 1,920 HTTP cases (40 sources × six locale prefixes × four suffixes × GET/HEAD), including trailing slashes, query preservation, exact English HTML/Markdown redirects, 410/noindex and empty HEAD bodies. Unknown retired paths return 404 and a current CSS guide returns 200. Official 0.2.10 consumption and final rollout remain pending publication; no remote flag was enabled during this rehearsal.


### Final 0.2.10 cutover acceptance

Official `@master/internal-site@0.2.10` matches its CI archive, SHA256 `802109e5fce2cee71f90ef341dd0341f5cab538b3877841fdbcf701f485d3620`. Its 775-file inventory differs from 0.2.9 only in `package.json` and `src/scripts/legacy-design-routes.ts`. A fresh quarantined/frozen installation passes exact registry byte verification, type checks, the complete 389-page build, 85-asset validation and all style/contract checks. The CSS contract remains 389 routes / 58 delivery groups / 2,244 exact segments; only the approval annotation names the final package. Translation receipts and all CSS ceilings remain unchanged.

The final cutover build has 2,644 files byte-identical to the fully browser-verified 0.2.9 output, including every HTML, CSS and client script. Only `_redirects` changes and `_worker.js` / `_routes.json` are added. A fresh real Wrangler Pages instance serving this official output passes all 1,920 GET/HEAD cases, unknown-route404 checks and the current-guide200 check. The corrected runtime test now also runs in the shared package's CI.

After canonical UI and Design deployment gates passed, the four actual Design HTML/Markdown destinations returned HTTP200 directly. GitHub `MASTER_LEGACY_DESIGN_CUTOVER_STABLE` and `_RC` are now `1`, and both Pages projects' production/preview named flag values are `1`. Updates used only the single named plaintext entry; existing secrets were never resent. All other visible environment fields and canonical deployment identities were preserved. Stable Node remains26.13.0; retained RC remains24 and was not redeployed. The first strict check exposed only null-versus-empty-map representation for the empty stable preview environment; the named flag was reset/reapplied with normalized comparison and all checks passed. CSS response headers were not changed based on the unrelated UI email-obfuscation finding.

The active development checkout's shared package was then refreshed to0.2.10, with its previous directory quarantined. User pnpm files/store and the existing Astro version remain untouched. The final source commit is intended to bind these verified cutover settings to a new immutable delivery; public CSS deployment acceptance is recorded separately after that pipeline completes.

Final cross-site browser verification follows the actual CSS301 to the newly accepted public Master site, with no candidate proxy: Chromium/WebKit pass six English/Traditional Chinese Blog and 320px/200% article cases. The refreshed task-owned development server is confirmed on its original4328 port; Reference packages and hydrated search pass without browser errors.
