# Document example composition verification

This follow-up begins at CSS source `319ebec571d99c9b3fbdecc48a157fbfb74c4f6b`, after the earlier ownership migration. It does not reuse earlier smoke checks as evidence that example grouping was correct.

## Defects and ownership

- `/reference/rules/layers`: the `@mixin --inset` / `.card p(8)` configuration, HTML and generated CSS rendered as separate article children. The shared exporter flattened `ConfiguredExample`; the Reference renderer recognized only the older explicitly tagged stylesheet-pair format.
- `/reference/tokens/text#usage`: the example had a tray, but broad shared demo styles applied negative margins to its generated output. Independent browser measurement found eight pixels of overflow on each side. Shared contained-output composition removes that negative-margin path rather than clipping the content.
- The new enlarged-text regression also exposed the Typography page heading's intrinsic width at 320px / 200% text. The shared title wrapper now constrains its heading to the available column; the existing word wrapping can then work.

Master owns the document frame, generated-output body, native table frame and title composition. UI remains the owner of tray, sheet, accordion, code and table materials. CSS owns its authored grouping decisions, normalized Reference renderer, lookup column geometry and product examples. No CSS core package or API is changed.

## Explicit authored groups

The canonical English inventory contains 16 `ConfiguredExample` uses and 60 `Class2CSS` uses across 16 files. Their four translations produce 380 component instances in 80 files.

- All 16 configured examples retain their configuration, HTML and generated output inside one explicit group.
- Thirty-two class examples have an explicitly authored source/output relationship. Their five editions use 160 `DocumentExample` wrappers across 60 MDX files.
- The other 28 class examples are standalone compiled lookups or explicit historical recaps. Each has a reviewed reason in `document-example-inventory.json`; the renderer never guesses a relationship from adjacency.

The explicit pairs are Responsive Design (2), Declarations (2), Selectors (6), Layout System (4), Conditions (3), View Transitions (1), Scanning and Pruning (1), Colors (3), Typography (2) and Syntax Tutorial (3). The scanning example keeps both its HTML and JavaScript source before the generated output.

Removing only the newly inserted wrapper/import lines reproduces all 80 baseline MDX files byte for byte. Extraction of all 80 before and after sources produces identical portable Markdown (ignoring only outer whitespace), complete example configuration/classes/CSS, and adapter notes. Translation prose and sample code are unchanged. An independently reviewed refresh updates 52 receipt entries: 52 source hashes and 40 translation hashes for the wrapper-bearing files.

The separately reviewed migration-example repair adds only `wrap-anywhere` to the two cards' common demonstration container, in all five editions. At a 232px iframe width and 200% text, both cards previously expanded to 232.5625px and the document scrolled to 241px. The common wrapping rule keeps both cards at 216px and the document at 232px; their gap, padding, radius, color and comparison remain unchanged. This intentional sample change has four additional reviewed receipt updates; translated prose and captions are unchanged.

Private `document-example` boundaries survive normalization and are removed by `portableMarkdown`. Reference accepts explicit code-only groups and rejects missing, empty, nested or unexpected boundaries. Adjacent fences without those boundaries remain independent. Internal metadata is not a new public Markdown convention.

## Verification

The isolated packed consumer preserves the active checkout's dependency tree and both original pnpm files. Baselines, the complete per-instance inventory, before/after extracted content and immutable outputs are retained under the task workspace's `work/doc-unification/css` directory.

- Shared extraction/localization tests: 9 passed. A subsequent review added two export regressions: literal `DocumentExample` title/source/result props now survive portable extraction, source props retain their rendered precedence, and dynamic/RenderNode/spread content fails explicitly. All seven Markdown tests passed; re-extracting all 80 existing documents produced zero differences.
- Reference tests, including explicit grouping and malformed-boundary checks: 42 passed.
- Executable documentation examples: 28 passed. LLM/Markdown tests: 43 passed; the three migration/current-content export checks were rerun after the wrapping repair and passed.
- Astro, Svelte and TypeScript checks passed. Site lint has no errors; five pre-existing warnings remain.
- Public candidate output: 389 HTML pages. A scan of 805 HTML/Markdown/text documents found no leaked private grouping markers.
- Candidate 6: Chromium and WebKit each passed the initial 21 browser cases (five composition/no-JavaScript cases, four material-consumption cases and twelve preview reflow/interaction cases). The expanded screenshot matrix subsequently passed nine composition cases per engine, bringing the configured suite to 25 cases per engine. The previously reproduced four failures are now green.
- Candidate 8 adds only shared keyboard-scroll normalization for focused document tables and long code. Both engines passed all four material cases again, including actual ArrowRight/ArrowLeft movement in narrow lookup tables and long source lines at 390px and 320px/200% text. All 52 emitted CSS files, including lazy assets, are byte-identical to candidate 6; its 389-page build, asset/style gates and exact contract passed unchanged. This keyboard follow-up does not rebase the screenshots or ceilings.
- The final postbuild asset/style gate passed: 85 referenced public assets, 389 routes and 46 CSS assets. Repeating postbuild after the approved ceiling update changed no output file.
- The updated exact CSS contract passed, together with the variable-reference and sitemap checks. Local Firefox is not claimed by these two-engine results; the normal release verifier owns the three-engine CI run.

`document-examples.e2e.mjs` checks Layers, Text and Typography at 390, 768 and 1280px in both light and dark themes (390px uses DPR2; the larger widths use DPR1), plus 320px/200% text and a 1440px dark/DPR2 explicit round-corner profile. The expanded suite passed nine cases per engine, including the no-JavaScript case. It retains 96 actual screenshots across Chromium and WebKit: resting and keyboard-focus views of all three representative examples in all eight visual profiles. Per-engine manifests record the route, profile, bounds and image paths under `work/doc-unification/css/screenshots-candidate-6-resting`. Normal CI retains these images under `site/test-results/document-examples/`. It checks actual source/output bounds inside the tray, native keyboard toggle behavior, page overflow and complete configuration/HTML/output with JavaScript disabled. The suite joins the existing release verifier, so normal CI executes it in Chromium, Firefox and WebKit. Manual visual review remains separate from these automated checks.

The broader preview sweep initially failed four cases on both the original deployed artifact and the candidate: the migration card overflow in Chromium/WebKit, and the view-transition page's deliberately fixed viewport being incorrectly required to use content sizing. The latter now verifies its actual 640px capture height, internal scrolling at 200% text, opening and returning from an article under both reduced motion and unavailable API, and focus restoration. The preview suite now respects the release verifier's selected browser and runs in that normal three-engine gate. No failing case is simply skipped.

## Stylesheet and exact-contract review

Candidate 6 consumes the shared identifier-reading rules needed by other document-table consumers. The table family ships its supported variants together; CSS Reference does not add `data-identifiers` or change its column geometry. These three scoped rules are not a second table material. The temporary separate generated-output entry was removed before acceptance, eliminating its additional request and duplicated theme aliases.

Against the actual pre-follow-up output, all 81 canonical routes retain their stylesheet-file counts, import depth and inline bytes. No new duplicate CSS rule remains. Sixty-five routes exceed their prior compressed-byte ceilings: only those 65 gzip and 65 Brotli fields are raised to the exact measured values below, without margin. All other fields and ceilings, localization equality, family guards and root/404 restrictions remain unchanged.

The largest increase is 82 gzip / 63 Brotli bytes: the title constraint contributes 7 / 6, the identifier-table rules 50 / 41, and contained generated-output composition 25 / 16. Routes that also lose the old negative-margin demo rules save 62 / 52 from that total. Typography saves 30 gzip / 30 Brotli bytes. These figures are summed compressed asset sizes per route, not a recompression of concatenated files.

The project Manifest v6 / language v18 value and bytes are identical. The inventory remains 389 routes and 58 distinct delivery contracts. Exact CSS segments change from 2,244 to 2,246: six old site-composition segments are replaced by eight segments covering the contained generated body, summary inset, held code radius, heading width and identifier-table wrapping/minimum width. Other segments are unchanged; module-entry ordering also changes contract hashes. No CSS core source, utility definition, public language rule or executable semantic token changes. The exact snapshot is approved against this explanation.

| Route | Gzip before → actual (delta) | Brotli before → actual (delta) |
| --- | ---: | ---: |
| `/benchmarks` | 40585 → 40642 (+57) | 34890 → 34937 (+47) |
| `/guide` | 34396 → 34403 (+7) | 29572 → 29578 (+6) |
| `/guide/ai-coding` | 45816 → 45836 (+20) | 39252 → 39263 (+11) |
| `/guide/code-linting` | 36384 → 36416 (+32) | 31202 → 31224 (+22) |
| `/guide/colors` | 45713 → 45733 (+20) | 39152 → 39163 (+11) |
| `/guide/global-styles` | 45129 → 45149 (+20) | 38665 → 38676 (+11) |
| `/guide/installation/angular` | 46002 → 46022 (+20) | 39413 → 39424 (+11) |
| `/guide/installation/astro` | 44447 → 44467 (+20) | 38083 → 38094 (+11) |
| `/guide/installation/nextjs` | 44447 → 44467 (+20) | 38083 → 38094 (+11) |
| `/guide/installation/nuxtjs` | 44447 → 44467 (+20) | 38083 → 38094 (+11) |
| `/guide/installation/server-rendered` | 44626 → 44646 (+20) | 38218 → 38229 (+11) |
| `/guide/installation/svelte` | 44447 → 44467 (+20) | 38083 → 38094 (+11) |
| `/guide/installation/vite` | 44626 → 44646 (+20) | 38218 → 38229 (+11) |
| `/guide/installation/webpack` | 44626 → 44646 (+20) | 38218 → 38229 (+11) |
| `/guide/language-service` | 38839 → 38921 (+82) | 33240 → 33303 (+63) |
| `/guide/layout-system` | 43783 → 43803 (+20) | 37497 → 37508 (+11) |
| `/guide/migration` | 39238 → 39320 (+82) | 33580 → 33643 (+63) |
| `/guide/migration/bootstrap` | 36429 → 36461 (+32) | 31239 → 31261 (+22) |
| `/guide/migration/css-in-js` | 37953 → 38035 (+82) | 32521 → 32584 (+63) |
| `/guide/migration/material-ui` | 38132 → 38214 (+82) | 32656 → 32719 (+63) |
| `/guide/migration/sass` | 38132 → 38214 (+82) | 32656 → 32719 (+63) |
| `/guide/migration/shadcn-ui` | 38094 → 38176 (+82) | 32617 → 32680 (+63) |
| `/guide/migration/tailwindcss` | 38132 → 38214 (+82) | 32656 → 32719 (+63) |
| `/guide/monorepo` | 37050 → 37082 (+32) | 31767 → 31789 (+22) |
| `/guide/rendering-modes` | 39190 → 39272 (+82) | 33547 → 33610 (+63) |
| `/guide/responsive-design` | 48159 → 48179 (+20) | 41292 → 41303 (+11) |
| `/guide/reusing-styles` | 45308 → 45328 (+20) | 38800 → 38811 (+11) |
| `/guide/scanning-and-pruning` | 36384 → 36416 (+32) | 31202 → 31224 (+22) |
| `/guide/syntax-tutorial` | 45308 → 45328 (+20) | 38800 → 38811 (+11) |
| `/guide/theme` | 45129 → 45149 (+20) | 38665 → 38676 (+11) |
| `/guide/view-transitions` | 43962 → 43982 (+20) | 37632 → 37643 (+11) |
| `/reference` | 34878 → 34885 (+7) | 29952 → 29958 (+6) |
| `/reference/direct-values` | 43488 → 43570 (+82) | 37226 → 37289 (+63) |
| `/reference/directives/definitions` | 43176 → 43258 (+82) | 36937 → 37000 (+63) |
| `/reference/directives/imports` | 43206 → 43288 (+82) | 36958 → 37021 (+63) |
| `/reference/directives/pruning` | 43176 → 43258 (+82) | 36937 → 37000 (+63) |
| `/reference/directives/queries` | 43176 → 43258 (+82) | 36937 → 37000 (+63) |
| `/reference/directives/scanning` | 43176 → 43258 (+82) | 36937 → 37000 (+63) |
| `/reference/directives/theme` | 43206 → 43288 (+82) | 36958 → 37021 (+63) |
| `/reference/grid-tracks` | 43515 → 43597 (+82) | 37247 → 37310 (+63) |
| `/reference/packages` | 43206 → 43288 (+82) | 36958 → 37021 (+63) |
| `/reference/rules/conditions` | 43206 → 43288 (+82) | 36958 → 37021 (+63) |
| `/reference/rules/declarations` | 43206 → 43288 (+82) | 36958 → 37021 (+63) |
| `/reference/rules/extraction` | 43206 → 43288 (+82) | 36958 → 37021 (+63) |
| `/reference/rules/layers` | 43206 → 43288 (+82) | 36958 → 37021 (+63) |
| `/reference/rules/modes` | 43206 → 43288 (+82) | 36958 → 37021 (+63) |
| `/reference/rules/named-conditions` | 43461 → 43543 (+82) | 37199 → 37262 (+63) |
| `/reference/rules/selectors` | 43206 → 43288 (+82) | 36958 → 37021 (+63) |
| `/reference/sr-only` | 43500 → 43582 (+82) | 37227 → 37290 (+63) |
| `/reference/tokens/color-roles` | 51055 → 51075 (+20) | 43749 → 43760 (+11) |
| `/reference/tokens/color` | 51105 → 51125 (+20) | 43816 → 43827 (+11) |
| `/reference/tokens/container` | 51099 → 51119 (+20) | 43790 → 43801 (+11) |
| `/reference/tokens/families` | 50684 → 50704 (+20) | 43409 → 43420 (+11) |
| `/reference/tokens/font` | 50850 → 50870 (+20) | 43570 → 43581 (+11) |
| `/reference/tokens/leading` | 50798 → 50818 (+20) | 43523 → 43534 (+11) |
| `/reference/tokens/motion` | 51114 → 51134 (+20) | 43804 → 43815 (+11) |
| `/reference/tokens/radius` | 51227 → 51247 (+20) | 43906 → 43917 (+11) |
| `/reference/tokens/shadow` | 51236 → 51256 (+20) | 43914 → 43925 (+11) |
| `/reference/tokens/spacing` | 51071 → 51091 (+20) | 43764 → 43775 (+11) |
| `/reference/tokens/text` | 50807 → 50827 (+20) | 43523 → 43534 (+11) |
| `/reference/tokens/tracking` | 50826 → 50846 (+20) | 43546 → 43557 (+11) |
| `/reference/tools/cli` | 43206 → 43288 (+82) | 36958 → 37021 (+63) |
| `/reference/tools/mcp` | 43206 → 43288 (+82) | 36958 → 37021 (+63) |
| `/reference/truncation` | 43660 → 43742 (+82) | 37390 → 37453 (+63) |
| `/guide/optimizing-css-delivery` | 38760 → 38842 (+82) | 33182 → 33245 (+63) |

## Delivery status

Validation uses a fresh, byte-verified candidate archive in an isolated checkout. Actual registry pins, release CI and deployment remain separate steps. No package publication or site deployment is claimed by these candidate results.


## Copy overlay follow-up

Final candidate 10 contains the user-reported copy-overlay correction: its background sits one shared inset inside the panel, and only its top inline-end corner follows the scaled outer radius minus that inset. The source-code position is unchanged. CSS integration checks a visible overlay, the derived concentric radius, keyboard focus visibility and complete focus-outline bounds inside the panel, alongside the existing material and keyboard checks. Chromium and WebKit each passed all four final material profiles. The approved exact snapshot and postbuild asset/style gates passed again: 389 routes, 58 delivery contracts, 2,246 exact segments, 85 public assets and 46 initially linked CSS assets.

The exact proof isolates one rule in one asset (`copy.*.css`). Replacing the new rule with the preceding copy-free rule reconstructs the entire candidate-8 asset byte for byte. The rule occurs once across all emitted CSS; the other 51 CSS files are unchanged. Manifest v6/language v18 is identical; the 2,246-segment inventory replaces one segment with one. No stylesheet count, depth, inline size or duplicate-delivery increase occurs. Candidate 9 was an intermediate radius calculation and is superseded, not an additional budget increment.

Seventy-three canonical routes add exactly 19 gzip / 21 Brotli bytes compared with candidate 8; eight routes are unchanged. Only 62 gzip and 63 Brotli ceilings on 63 routes are exceeded. The approved exact measured updates are below; sufficient ceilings remain in place. This is the copy-contour stage after the candidate-6 table above, not a replacement of that baseline.

| Route | Field | Prior ceiling | Actual | Increase |
| --- | --- | ---: | ---: | ---: |
| `/guide/ai-coding` | gzip | 45836 | 45855 | +19 |
| `/guide/ai-coding` | brotli | 39263 | 39284 | +21 |
| `/guide/code-linting` | gzip | 36416 | 36435 | +19 |
| `/guide/code-linting` | brotli | 31224 | 31245 | +21 |
| `/guide/colors` | gzip | 45733 | 45752 | +19 |
| `/guide/colors` | brotli | 39163 | 39184 | +21 |
| `/guide/global-styles` | gzip | 45149 | 45168 | +19 |
| `/guide/global-styles` | brotli | 38676 | 38697 | +21 |
| `/guide/installation/angular` | gzip | 46022 | 46041 | +19 |
| `/guide/installation/angular` | brotli | 39424 | 39445 | +21 |
| `/guide/installation/astro` | gzip | 44467 | 44486 | +19 |
| `/guide/installation/astro` | brotli | 38094 | 38115 | +21 |
| `/guide/installation/nextjs` | gzip | 44467 | 44486 | +19 |
| `/guide/installation/nextjs` | brotli | 38094 | 38115 | +21 |
| `/guide/installation/nuxtjs` | gzip | 44467 | 44486 | +19 |
| `/guide/installation/nuxtjs` | brotli | 38094 | 38115 | +21 |
| `/guide/installation/server-rendered` | gzip | 44646 | 44665 | +19 |
| `/guide/installation/server-rendered` | brotli | 38229 | 38250 | +21 |
| `/guide/installation/svelte` | gzip | 44467 | 44486 | +19 |
| `/guide/installation/svelte` | brotli | 38094 | 38115 | +21 |
| `/guide/installation/vite` | gzip | 44646 | 44665 | +19 |
| `/guide/installation/vite` | brotli | 38229 | 38250 | +21 |
| `/guide/installation/webpack` | gzip | 44646 | 44665 | +19 |
| `/guide/installation/webpack` | brotli | 38229 | 38250 | +21 |
| `/guide/language-service` | gzip | 38921 | 38940 | +19 |
| `/guide/language-service` | brotli | 33303 | 33324 | +21 |
| `/guide/layout-system` | gzip | 43803 | 43822 | +19 |
| `/guide/layout-system` | brotli | 37508 | 37529 | +21 |
| `/guide/migration` | gzip | 39320 | 39339 | +19 |
| `/guide/migration` | brotli | 33643 | 33664 | +21 |
| `/guide/migration/bootstrap` | gzip | 36461 | 36480 | +19 |
| `/guide/migration/bootstrap` | brotli | 31261 | 31282 | +21 |
| `/guide/migration/css-in-js` | gzip | 38035 | 38054 | +19 |
| `/guide/migration/css-in-js` | brotli | 32584 | 32605 | +21 |
| `/guide/migration/material-ui` | gzip | 38214 | 38233 | +19 |
| `/guide/migration/material-ui` | brotli | 32719 | 32740 | +21 |
| `/guide/migration/sass` | gzip | 38214 | 38233 | +19 |
| `/guide/migration/sass` | brotli | 32719 | 32740 | +21 |
| `/guide/migration/shadcn-ui` | gzip | 38176 | 38195 | +19 |
| `/guide/migration/shadcn-ui` | brotli | 32680 | 32701 | +21 |
| `/guide/migration/tailwindcss` | gzip | 38214 | 38233 | +19 |
| `/guide/migration/tailwindcss` | brotli | 32719 | 32740 | +21 |
| `/guide/monorepo` | gzip | 37082 | 37101 | +19 |
| `/guide/monorepo` | brotli | 31789 | 31810 | +21 |
| `/guide/rendering-modes` | gzip | 39272 | 39291 | +19 |
| `/guide/rendering-modes` | brotli | 33610 | 33631 | +21 |
| `/guide/responsive-design` | gzip | 48179 | 48198 | +19 |
| `/guide/responsive-design` | brotli | 41303 | 41324 | +21 |
| `/guide/reusing-styles` | gzip | 45328 | 45347 | +19 |
| `/guide/reusing-styles` | brotli | 38811 | 38832 | +21 |
| `/guide/scanning-and-pruning` | gzip | 36416 | 36435 | +19 |
| `/guide/scanning-and-pruning` | brotli | 31224 | 31245 | +21 |
| `/guide/syntax-tutorial` | gzip | 45328 | 45347 | +19 |
| `/guide/syntax-tutorial` | brotli | 38811 | 38832 | +21 |
| `/guide/theme` | gzip | 45149 | 45168 | +19 |
| `/guide/theme` | brotli | 38676 | 38697 | +21 |
| `/guide/view-transitions` | gzip | 43982 | 44001 | +19 |
| `/guide/view-transitions` | brotli | 37643 | 37664 | +21 |
| `/` | brotli | 51759 | 51780 | +21 |
| `/reference/direct-values` | gzip | 43570 | 43589 | +19 |
| `/reference/direct-values` | brotli | 37289 | 37310 | +21 |
| `/reference/directives/definitions` | gzip | 43258 | 43277 | +19 |
| `/reference/directives/definitions` | brotli | 37000 | 37021 | +21 |
| `/reference/directives/imports` | gzip | 43288 | 43307 | +19 |
| `/reference/directives/imports` | brotli | 37021 | 37042 | +21 |
| `/reference/directives/pruning` | gzip | 43258 | 43277 | +19 |
| `/reference/directives/pruning` | brotli | 37000 | 37021 | +21 |
| `/reference/directives/queries` | gzip | 43258 | 43277 | +19 |
| `/reference/directives/queries` | brotli | 37000 | 37021 | +21 |
| `/reference/directives/scanning` | gzip | 43258 | 43277 | +19 |
| `/reference/directives/scanning` | brotli | 37000 | 37021 | +21 |
| `/reference/directives/theme` | gzip | 43288 | 43307 | +19 |
| `/reference/directives/theme` | brotli | 37021 | 37042 | +21 |
| `/reference/grid-tracks` | gzip | 43597 | 43616 | +19 |
| `/reference/grid-tracks` | brotli | 37310 | 37331 | +21 |
| `/reference/packages` | gzip | 43288 | 43307 | +19 |
| `/reference/packages` | brotli | 37021 | 37042 | +21 |
| `/reference/rules/conditions` | gzip | 43288 | 43307 | +19 |
| `/reference/rules/conditions` | brotli | 37021 | 37042 | +21 |
| `/reference/rules/declarations` | gzip | 43288 | 43307 | +19 |
| `/reference/rules/declarations` | brotli | 37021 | 37042 | +21 |
| `/reference/rules/extraction` | gzip | 43288 | 43307 | +19 |
| `/reference/rules/extraction` | brotli | 37021 | 37042 | +21 |
| `/reference/rules/layers` | gzip | 43288 | 43307 | +19 |
| `/reference/rules/layers` | brotli | 37021 | 37042 | +21 |
| `/reference/rules/modes` | gzip | 43288 | 43307 | +19 |
| `/reference/rules/modes` | brotli | 37021 | 37042 | +21 |
| `/reference/rules/named-conditions` | gzip | 43543 | 43562 | +19 |
| `/reference/rules/named-conditions` | brotli | 37262 | 37283 | +21 |
| `/reference/rules/selectors` | gzip | 43288 | 43307 | +19 |
| `/reference/rules/selectors` | brotli | 37021 | 37042 | +21 |
| `/reference/sr-only` | gzip | 43582 | 43601 | +19 |
| `/reference/sr-only` | brotli | 37290 | 37311 | +21 |
| `/reference/tokens/color-roles` | gzip | 51075 | 51094 | +19 |
| `/reference/tokens/color-roles` | brotli | 43760 | 43781 | +21 |
| `/reference/tokens/color` | gzip | 51125 | 51144 | +19 |
| `/reference/tokens/color` | brotli | 43827 | 43848 | +21 |
| `/reference/tokens/container` | gzip | 51119 | 51138 | +19 |
| `/reference/tokens/container` | brotli | 43801 | 43822 | +21 |
| `/reference/tokens/families` | gzip | 50704 | 50723 | +19 |
| `/reference/tokens/families` | brotli | 43420 | 43441 | +21 |
| `/reference/tokens/font` | gzip | 50870 | 50889 | +19 |
| `/reference/tokens/font` | brotli | 43581 | 43602 | +21 |
| `/reference/tokens/leading` | gzip | 50818 | 50837 | +19 |
| `/reference/tokens/leading` | brotli | 43534 | 43555 | +21 |
| `/reference/tokens/motion` | gzip | 51134 | 51153 | +19 |
| `/reference/tokens/motion` | brotli | 43815 | 43836 | +21 |
| `/reference/tokens/radius` | gzip | 51247 | 51266 | +19 |
| `/reference/tokens/radius` | brotli | 43917 | 43938 | +21 |
| `/reference/tokens/shadow` | gzip | 51256 | 51275 | +19 |
| `/reference/tokens/shadow` | brotli | 43925 | 43946 | +21 |
| `/reference/tokens/spacing` | gzip | 51091 | 51110 | +19 |
| `/reference/tokens/spacing` | brotli | 43775 | 43796 | +21 |
| `/reference/tokens/text` | gzip | 50827 | 50846 | +19 |
| `/reference/tokens/text` | brotli | 43534 | 43555 | +21 |
| `/reference/tokens/tracking` | gzip | 50846 | 50865 | +19 |
| `/reference/tokens/tracking` | brotli | 43557 | 43578 | +21 |
| `/reference/tools/cli` | gzip | 43288 | 43307 | +19 |
| `/reference/tools/cli` | brotli | 37021 | 37042 | +21 |
| `/reference/tools/mcp` | gzip | 43288 | 43307 | +19 |
| `/reference/tools/mcp` | brotli | 37021 | 37042 | +21 |
| `/reference/truncation` | gzip | 43742 | 43761 | +19 |
| `/reference/truncation` | brotli | 37453 | 37474 | +21 |
| `/guide/optimizing-css-delivery` | gzip | 38842 | 38861 | +19 |
| `/guide/optimizing-css-delivery` | brotli | 33245 | 33266 | +21 |


## Final official dependency cohort

The final exact dependencies are `@master/internal-site@0.2.11`, `@master/internal-skills@0.1.5` and `@master/ui@0.0.4`. Registry archives match their accepted CI packages; isolated installed files match those archives (779 shared-site, 47 skills and 316 UI files), and frozen installation passes. Explicit skill synchronization installs the Design 0.3.1 snapshot from source 55f9e6e and preserves product-owned skills.

UI 0.0.4 corrects the segmented indicator's reduced-motion selector specificity. It changes one supports block in one segmented CSS asset. Replacing only that block reconstructs candidate 10's previous asset byte for byte; it appears once, and all other 51 CSS files remain unchanged. Manifest v6 / language v18 and the 2,246-segment count remain unchanged. Forty-three canonical routes add 4 gzip bytes and save 19 Brotli bytes; 38 routes are unchanged. Only these 32 gzip ceilings exceed their prior bounds and receive the exact approved +4 update. No Brotli, file, depth or inline ceiling rises. The real Reference index view selector now also asserts zero indicator transition duration under reduced motion in the existing three-engine material suite.

| Route | Gzip ceiling before | Official actual |
| --- | ---: | ---: |
| `/benchmarks` | 40642 | 40646 |
| `/guide` | 34403 | 34407 |
| `/guide/ai-coding` | 45855 | 45859 |
| `/guide/colors` | 45752 | 45756 |
| `/guide/global-styles` | 45168 | 45172 |
| `/guide/installation/angular` | 46041 | 46045 |
| `/guide/installation/astro` | 44486 | 44490 |
| `/guide/installation/nextjs` | 44486 | 44490 |
| `/guide/installation/nuxtjs` | 44486 | 44490 |
| `/guide/installation/server-rendered` | 44665 | 44669 |
| `/guide/installation/svelte` | 44486 | 44490 |
| `/guide/installation/vite` | 44665 | 44669 |
| `/guide/installation/webpack` | 44665 | 44669 |
| `/guide/layout-system` | 43822 | 43826 |
| `/guide/responsive-design` | 48198 | 48202 |
| `/guide/reusing-styles` | 45347 | 45351 |
| `/guide/syntax-tutorial` | 45347 | 45351 |
| `/guide/theme` | 45168 | 45172 |
| `/guide/view-transitions` | 44001 | 44005 |
| `/reference` | 34885 | 34889 |
| `/reference/tokens/color-roles` | 51094 | 51098 |
| `/reference/tokens/color` | 51144 | 51148 |
| `/reference/tokens/container` | 51138 | 51142 |
| `/reference/tokens/families` | 50723 | 50727 |
| `/reference/tokens/font` | 50889 | 50893 |
| `/reference/tokens/leading` | 50837 | 50841 |
| `/reference/tokens/motion` | 51153 | 51157 |
| `/reference/tokens/radius` | 51266 | 51270 |
| `/reference/tokens/shadow` | 51275 | 51279 |
| `/reference/tokens/spacing` | 51110 | 51114 |
| `/reference/tokens/text` | 50846 | 50850 |
| `/reference/tokens/tracking` | 50865 | 50869 |


Official-cohort local verification passed: the complete site rendered 389 pages; the reviewed final postbuild asset/style and exact-contract gates passed; Astro/Svelte/TypeScript reported no errors; 162 translation resources had no audit problems; Reference 42, executable examples 28, MDX imports 2, syntax 13, LLM/Markdown 43, verifier 6 and workflow 12 tests passed. Lint retains the same five warnings with no errors. Chromium and WebKit each passed all 25 configured cases, and the final 96 resting/focus screenshots are frozen under `work/doc-unification/css/screenshots-official-final`. The normal Linux CI must separately establish Firefox acceptance.

The real checkout received only the three verified package entries, with their previous directories retained for rollback. All installed authored files match the official archives; shared skill checks and the new public imports resolve. This is bounded local dependency readiness, separate from the isolated full build. Original `pnpm-lock.yaml`, `pnpm-workspace.yaml`, other dependency entries and user processes remain untouched; no restart was performed.

## Final semantic inventory correction

The final review found that the initial 33-query classification incorrectly treated five same-example source/output pairs as standalone because prose or a diagram separated them. All five editions now explicitly group those five examples: extraction (`card p-md shadow-md`), conditional token dependencies (`fg-red:hover@sm`), server rendering (`index.html` + `server.ts`), static scanning (two equivalent JavaScript branches), and the first syntax tutorial link. This brings the total to 32 grouped Class2CSS examples and 28 independent queries.

The existing shared `DocumentExample` is sufficient. No shared package, caption protocol, renderer or CSS core changes are involved. All words are retained. Independent reading review changed three terminal colons to full stops in the scanning introductions/recap in English, Traditional Chinese, Simplified Chinese and Korean; Japanese already used full stops. Extraction, conditions and syntax explanations now follow their source/output tray; the server-rendering output introduction precedes its tray; the conditions anchor remains immediately before that tray. The scanning introductions precede its two-source tray; its lookup/runtime explanation and recap follow it before the independent DeliveryFlow. The syntax illustration stays outside its tray, after its explanation. These are intentional prose/figure position changes; portable Markdown is **not byte-identical**. All 25 source documents retain the original block multiset (allowing only those enumerated terminal punctuation changes) and exact code order. Portable exports are separately checked for complete semantic blocks, examples and code order.

The tracked inventory regression checks every Class2CSS occurrence across all five editions, including the five formerly prose-separated cases. Normalization tests verify source order, generated-output membership, independent illustrations and removal of private markers. Browser regression checks the five actual pages in English at 1280px/light and Traditional Chinese at 390px/dark, including keyboard disclosure, source/output count, bounds and screenshots. Existing three-engine CI runs this test through the normal site verifier.

### Remaining standalone decisions

| Source | Query ordinal | Reason |
| --- | ---: | --- |
| `style-declarations` | 1 | Output for four accepted forms in the syntax table; no complete source example. |
| `style-declarations` | 2 | Aggregate output for the quoted-parenthesis illustration and three separate boundary-table cases. |
| `style-declarations` | 3 | Two inline validity/registration examples, without a source fence. |
| `style-declarations` | 4 | Compatibility declarations and a distinct vendor-selector example; not the previous validity query. |
| `style-declarations` | 6 | Three inline function/variable lookups, without a source fence. |
| `style-declarations` | 7 | Three negative-value forms discussed in prose, without a source fence. |
| `style-declarations` | 9 | The HTML above repeats child selectors; this separate query compares padding/margin cascade ordering. |
| `style-declarations` | 10 | Four inline importance/quoted-text forms, without a complete source example. |
| `state-selectors` | 1 | The fence contains grammar placeholders, not the two concrete classes compiled by this query. |
| `state-selectors` | 2 | Output for all five matching-owner table rows; the preceding link demonstrates only its first row. |
| `state-selectors` | 3 | One combined requirement explained inline, without a source fence. |
| `state-selectors` | 4 | Lookup for five combinators in the surrounding target table. |
| `state-selectors` | 7 | Function/attribute commas are distinct cases from the preceding grouped top-level selector list. |
| `state-selectors` | 11 | Literal-space escape and case flag are distinct cases from the preceding grouped quoted-attribute example. |
| `state-selectors` | 13 | Specificity comparison from the table; no complete source example. |
| `introduction` | 1 | Focused p-lg token explanation after the separately complete card demonstration; not the full card output. |
| `layout-system` | 2 | Lookup for the spacing-form comparison table. |
| `layout-system` | 3 | Token width versus intrinsic/static width explained inline, without a source fence. |
| `rendering-modes` | 2 | Recap of rules active midway through four insert/add/remove steps; grouping with final removed-element source would misrepresent its state. |
| `conditional-queries` | 1 | Examples drawn from the query-forms table, without a complete source example. |
| `conditional-queries` | 4 | Three independent range/resolution lookups described in prose. |
| `conditional-queries` | 5 | One supports syntax lookup described inline, without a source fence. |
| `conditional-queries` | 8 | Two named-container-condition lookups described in prose; no complete source example. |
| `conditional-queries` | 9 | One starting-style syntax lookup, without a transition source example. |
| `syntax-tutorial` | 2 | Output for five value-choice comparison rows. |
| `syntax-tutorial` | 4 | Output for three token/declaration comparison rows. |
| `syntax-tutorial` | 6 | Inline padding-priority comparison, without a source fence. |
| `syntax-tutorial` | 8 | Output for the one-off threshold and condition table, not the preceding separately complete responsive preview. |

The independent read-only review accepted all 25 final localized source hashes and all 28 standalone decisions. Exactly 20 translation-review entries were refreshed. The final local build passed 389 pages, 85 public assets and all existing style budgets. All 52 CSS files are byte-identical to the pre-correction official dependency output; the existing 389-route / 58-contract / 2,246-segment snapshot passes unchanged. No budget or snapshot was raised for this correction. Reference tests pass 44/44, portable LLM tests 43/43, and Chromium/WebKit each pass all 26 document/material/preview cases, including the new five-route regression. Screenshots include the added English wide/light and Traditional Chinese narrow/dark examples. Linux Firefox runs the same new case through the existing three-engine CI; a local Firefox pass is not claimed.
