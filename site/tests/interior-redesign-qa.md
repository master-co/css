# Master CSS brand and interior refinement

Implementation and verification record for `codex/site-interior-redesign`.

## Scope

- Base: `rc` at `d08009302cccd38edc7db5e1d24b0aa26f1c344c`.
- Independent managed worktree, dependency installation, generated data and preview.
- The original checkout's uncommitted work is preserved.
- Homepage main content, dedicated artwork and animation sources are outside this change.
- Existing document column positions and widths are retained. Changes to the document shell are navigation, controls, typography scaling, focus, materials and footer refinements.
- No published package APIs, preset definitions, compiler semantics, dependencies, package-manager files or release configuration changed.

## Brand decisions and shared facts

`/brand` owns identity, logo use, palette roles, typography, geometry, materials, interaction, applications and voice. `/design-system` retains its component catalog, review scenes and authoring handbook.

- `common/brand.ts` holds authored identity decisions, labels, original asset destinations and composition content.
- `common/brand-foundations.ts` selects actual preset values through the existing theme helpers. It does not maintain a second preset palette.
- `utils/brand-content.ts` exports the same facts and compositions to search, Markdown and llms content, with strict extraction errors for missing adapters.
- Canvas and Shell are explicitly identified as website roles. Other displayed color roles come from the preset.
- The standalone `/brand.md` is generated from the exact portable body used in llms output, with version/source metadata. It includes the same original artwork URLs and policy.
- Typography sizes come from the preset and are checked against actual browser paint. Explicit native CSS references retain the size tokens used by the data-driven specimens.
- The native standalone mark and the two lockups remain unchanged. The central ribbon's endpoint colors are distinguished from the complete source gradients.
- The ¼ mark-height clear-space rule and minimum sizes are authored guidance. The SVG canvas ratios are verified against the original files. The page includes actual-size minimum specimens.
- Original SVG download destinations and trademark/name policy text are retained.

## Document and interaction refinements

- Below 64rem, the native modal site menu includes the current document chapters as well as global navigation and preferences. Search has its own entry and nested dialog behavior.
- Below 80rem, a native disclosure exposes the same article-heading inventory as the desktop contents rail. It works without hydration; the enhanced link closes it and focuses the destination.
- Search loads its index when requested, announces loading/empty/failure states, offers retry, supports keyboard selection and restores the initiating control's focus. Pages without a document sidebar expose the same entry in the desktop header at 1024, 1280 and 1440px; Guide and Reference retain their sidebar entry.
- The native main-navigation element receives its localized accessible name. Forced colors retain explicit input-focus and selected-result outlines instead of relying on a background or shadow.
- Closed search markup stays hidden until the native modal boundary exists. Opening establishes focus before paint. IME composition keeps its confirmation, candidate and cancellation keys instead of invoking document navigation.
- Code copying shows a visible pending request, prevents duplicate writes, preserves the original source name across a tab switch and reports denied writes with selectable source still available.
- Language changes and same-page anchor navigation preserve the current query string.
- A contents jump creates one history entry; one Back returns to the prior location. Modified hash clicks leave the browser's default behavior intact.
- At 320px with 200% text, search uses two input-bar rows so Clear and Cancel cannot reduce the query field to zero width.
- The brand chapter list sizes its columns to available space; enlarged labels remain readable, and jumps measure the collapsed navigation before positioning the heading.
- The shared home link has an accessible name and a larger hit area while retaining the 20px artwork. Global navigation, document navigation and page contents have distinct landmark names.
- At a 16px root, the small-screen document title remains 28px and dense code remains 13px on 20px leading. Larger breakpoints retain their existing size hierarchy. These sizes scale with enlarged text instead of staying fixed.
- Traditional Chinese headings use natural tracking, including `zh-TW` pages. English document headings retain their existing treatment.
- Previous/next links identify their direction and allow complete titles to wrap.
- A tucked-away header becomes immediately visible while one of its controls has focus, including focus returned from search. This keeps the current paragraph at the same scroll position. Reduced motion removes its sliding transition.
- Interior surfaces use contours and contact shadows. The homepage retains its global material definitions.
- Footer groups wrap to fit their available width; legal links and controls remain usable at enlarged text and touch sizes.

## Secondary pages

- Blog uses the two published posts across the available width, adds a page heading and stable dates, and preserves all post destinations/content. Article headings and author groups wrap at enlarged text; author links keep a 44px minimum target.
- Sponsor gains real section headings, one consistent tier presentation, unchanged amounts and platform destinations, and native modal focus/dismissal behavior. Direct platform links remain available without JavaScript.
- Empty supporter data does not leave an isolated plus button; the real contribution sections remain available. Without JavaScript, native platform links replace the inactive tier buttons and retain all amounts.
- All 82 Design System routes are checked at 320px with 200% text. Review chrome adapts its padding, labels, palette columns and range controls; a default canvas owns its full height instead of overlapping the following note.
- Alignment and float specimens keep their subject geometry inside named local scroll regions with visible focus and horizontal keyboard operation. Document-review composites avoid applying prose bleed twice.
- Homepage-icon review changes affect only text and layout containers. Artwork sources, icon components, prescribed icon sizes and dedicated homepage styles remain untouched; large review specimens keep their actual size in a local scroll area.
- The sizing specimen lets enlarged text reflow beside the unchanged 3rem avatar. This fixes a 2px page spill without changing the measured object or article layout.
- 404 gains a search entry and a direct Guide recovery link, with wrapping at narrow/enlarged sizes.
- Removed the unused `images/gold-pattern.jpg`, previously mentioned only in a commented-out Blog image. No homepage-specific asset was removed.

## Evidence and reproduction

Generated evidence is ignored under `site/test-results/interior-redesign/`:

- `work-log.json`: actual start time and milestone events; the requested minimum is eight hours. No completed duration is claimed until recorded at delivery.
- `inventory.json`: 448 built page resources including the 404 template, plus two deliberately missing-path probes.
- `document-baseline/geometry.json`: initial positions/widths at 390, 768, 1280 and 1440px for four document types.
- `content-preservation.json`: all 352 Guide, Reference and Blog article bodies preserve their normalized text and existing semantic anchors.
- `home-paint/summary.json`: 40 pairs of homepage-main screenshots are byte-identical, including both locales/engines/themes and five widths. The existing `.home-header` hook is present in both revisions and the audit asserts it is hidden before capture; full geometry and text also agree.
- `baseline-production/` and `redesign-production/`: browser measurements and before/after screenshots, including loading, headings, links, artwork, overflow and geometry.
- `brand-*`, `search-*`, `navigation-*`: behavior, enlarged text, densities, keyboard and theme evidence.
- `final-behavior-results.json`: all 430 unique browser cases pass in complete production runs—216 Chromium and 214 WebKit. Native navigation includes desktop search availability, actual landmark names and visible focus after the scrolling header tucks away.
- `windowed-clipboard-audit.json`: real windowed WebKit completes four native color/code writes with exact keyboard-paste verification across both locales, plus 24 immediate search-opening paste operations. Clipboard APIs are not replaced or granted simulated permissions.
- `enlarged-routes-*`: 366 further non-review resources per engine at 320px/200% text, combined with the 82 Design System route checks per engine. All 896 scenes fit. This covers every non-home page plus the two deliberately missing routes.
- `breakpoint-audit.json`: 32 native scenes verify the exact 1023/1024px navigation and 1279/1280px contents boundaries in both locales and engines. Resizing an open drawer to desktop closes it and restores document scrolling.
- `brand-final-details/`: 160 native viewport captures of 20 brand subjects across both engines, light/dark and 390/1440px.
- `interior-final-details/`: 448 additional viewport captures of openings, source panels, tables, demos and footers across 17 representative page types, both engines/themes and 390/1440px.
- `focus-paint/summary.json`: 20 actual keyboard-focus scenes in both engines, with and without forced colors; painted focus remains visible, including native selects inside their visible labels.
- `global-token-audit.json`: native CSSOM parsing verifies all 60,488 shared root-token declarations across 448 delivered routes, with layer/condition identity retained; zero value differences.
- `adaptive-color-audit.json`: 20 preference/system-appearance states across both engines/locales keep all 180 neutral-role readings synchronized with actual paint. Explicit light/dark choices override system appearance.
- `painted-font-audit.json`: Chromium's native platform-font inspection confirms rendered Geist, Noto Sans TC and IBM Plex Mono glyphs on both Brand locales, including the English page's Chinese specimens.
- `preview-integrity.json`: all 2,644 frozen preview files are byte-identical to the formal build. Aggregate file/hash SHA-256: `005b34e5c1a420899d7a9c9c3feb106216bfde182c1cbfc45fff2a43ae123b07`.
- `home-animation-audit.json`: each home locale preserves its 53 dedicated keyframes in order, 80 animation-declaration rule sets and 94 dedicated transition rule sets. Effective keyframe definitions also agree.
- `state-review.html` and `state-review/summary.json`: five matched interaction/enlargement pairs, clearly labeled as findings from original or intermediate layouts; original-resolution image dimensions and capture conditions are retained.
- `scope-boundaries.json`: no core/package/lockfile changes, no protected homepage-source changes, and byte-identical original SVG assets.
- `index.html` and `review-report.json`: generated comparison viewer and findings.
- `viewer-audit.json`: both engines at 320/390/768/1440px decode the selected paired images, fit their viewport and retain the correct route/theme after rapid changes. The selector grid contains long route names; unsupported full-page choices are disabled in the native option state.
- `final-resource-visit-audit.json`: all 9,000 final scenes reach the end of their page without the visit limit; zero failed resources, page errors or broken images. The longest page is 55,101px.
- `css-contract-verification.json`: the approved 448-route/245-contract/3,709-segment snapshot matches the exact reviewed capture. Its verifier is byte-identical to the committed base and its variable-reference tests pass.
- `user-preview-smoke.json` and `final-delivery-viewer.json`: the shared preview's actual HTTP bodies match the formal build, including real 404 recovery; both engines decode the final complete Brand comparison.
- `acceptance-audit.json`: the final aggregation checks all 21 evidence and duration conditions against their retained results.

The frozen original source was exported separately and built with the same package artifacts. Production comparisons use independent previews so development hot reload and regeneration cannot invalidate a browser capture. Earlier development captures remain available separately.

The 446 non-home HTML resources comprise 178 Guide, 170 Reference, 82 Design System, six Blog, two Brand, two Sponsor, five standalone examples and the 404 template. Two home locales are included for regression comparison, and two unknown-path probes verify real 404 responses: 450 destinations × two engines × five widths × two themes = 9,000 scenes per version.

```sh
node --import tsx site/scripts/interior-inventory.ts
MASTER_SWEEP_URL=http://127.0.0.1:3219 \
  MASTER_SWEEP_LABEL=baseline-production MASTER_SWEEP_DELIVERY=static \
  node site/scripts/interior-visual-sweep.mjs
MASTER_SWEEP_URL=http://127.0.0.1:3222 \
  MASTER_SWEEP_LABEL=redesign-production MASTER_SWEEP_DELIVERY=static \
  node site/scripts/interior-visual-sweep.mjs
node site/scripts/interior-report.mjs

MASTER_BRAND_URL=http://127.0.0.1:3222 MASTER_BRAND_MATRIX=full \
  node --test site/tests/brand-system.e2e.mjs
MASTER_SITE_URL=http://127.0.0.1:3222 \
  node --test site/tests/documentation-search.e2e.mjs site/tests/interior-navigation.e2e.mjs

# Requires a graphical desktop session; it briefly opens and closes a test window.
MASTER_SITE_URL=http://127.0.0.1:3222 \
  MASTER_SITE_REVISION=8a74848806d171d82952a630f7054daaa88ad5a1 \
  node site/tests/windowed-clipboard.e2e.mjs
```

Set `MASTER_BRAND_BROWSER=webkit` or `MASTER_SITE_BROWSER=webkit` for the corresponding behavior suite. Sweep defaults cover Chromium/WebKit, 320/390/768/1280/1440px, light/dark, and both route locales. Cached captures are reused only for matching URLs and expectations.

## Verification status

Implementation checks pass: site lint and type check; Reference (25), syntax (14), llms (33), document examples (21), islands (8), atomic authoring (3), MDX imports (2), brand export/source checks (3), and homepage source behavior (34). Production builds render all 448 pages and verify all 91 referenced public assets. AI context budgets pass for 2,580 files.

Final behavior coverage passes: Brand (28 Chromium / 27 WebKit), Search (20 / 20), Navigation (21 / 21), demos (48 / 48), reading and source controls (13 / 12), and component reviews (86 / 86). The 320px/200% route checks have no remaining overflow. All 448 HTML resources retain titles, valid local destinations and unique HTML IDs; 41,378 local/remote anchor elements were checked for local resolution, with no missing local destination or anchor.

The final fresh production comparison completed on 2026-10-30 at 04:21:36 UTC, frozen website revision `8a74848806d171d82952a630f7054daaa88ad5a1`: 4,500 Chromium and 4,500 WebKit scenes, zero reused captures, zero current findings, and both processes exit 0. All 9,000 cases pair with the independent committed baseline. Document column differences are zero; all 40 homepage computed-style comparisons agree, in addition to the 40 byte-identical homepage-main image pairs. The original 40 Blog heading findings and two Sponsor anchor findings are retained separately; the redesigned output resolves them.

## Exact CSS delivery review

Review compares the frozen committed base with the redesigned production output, rather than using a previously stale snapshot as the visual baseline. The route inventory remains 448 pages. There are 3,284 → 3,709 unique exact CSS segments: 548 added and 123 removed; 447 route deliveries change and the bare responsive-button example remains identical. Native CSSOM parsing also confirms all 60,488 shared global variable declarations retain their values, including their layer and condition identity. The project manifest is byte-identical in both captures (SHA-256 `16fe8ca4edf3fd1da3653ecad1cae702ec9a8e8c1ace0e55f176fe34a576edf9`); no preset, utility semantics or theme definition changed.

Intentional website delivery changes are:

- The complete Brand presentation and its scoped type, color-role and geometry specimens.
- Native menu/contents behavior, larger named targets, search states and source-copy feedback.
- Focused scrolling navigation stays visible, with no sliding transition for reduced motion.
- Interior contour/contact materials, scalable dense code and natural Chinese heading tracking.
- Responsive footer, Blog, Sponsor and 404 presentation.
- Flexible demo/review chrome, content-owned canvas height and named local overflow for specimens that retain their actual geometry.

Shared `slide-to-right` delivery has 20 → 22 identical occurrences on each home route. The dedicated home definitions and their order remain identical; the effective shared definition is unchanged. This repeated delivery is retained in the exact CSS snapshot and in the animation audit.

Changes to retained theme-token sets come from which values these website subjects reference. Homepage-main source and artwork are unchanged. Forty native screenshot pairs already agree byte for byte; the complete route comparison additionally checks every document column's x-position, width and horizontal padding. `css-delivery-review.json` retains the exact added/removed CSS segments, counts and manifest comparison.

Approved after reviewing the complete 9,000-pair comparison, native interactions, preserved content, homepage regression evidence and exact CSS delivery diff on 2026-10-30. The snapshot update cites this section. The verifier remains unchanged; the snapshot records the reviewed website output and the explicitly documented pre-existing discrepancy below.

## Known conditions

- Static preview serves the named `/404` resource with HTTP 200; deliberately unknown routes must return HTTP 404 and the recovery page. Both behaviors are checked separately.
- Existing static hosting uses one English 404 HTML fallback, including for unknown `/tw/` paths. Development can render that page in Traditional Chinese per request; this change retains the existing hosting behavior.
- Source locales without a complete translation continue to use English content. The brand guide's English body declares its language and includes Traditional Chinese voice/type examples; its hero and navigation are localized.
- Text contrast measurements cover visible non-code text in eight representative page types, in both themes. Syntax colors, hidden/decorative text and disabled states are excluded; this is not a complete accessibility audit.
- Headless Playwright WebKit cannot grant clipboard permissions and did not complete its native OS write. Windowed WebKit does complete real writes: exact color variables and selected code are verified through keyboard paste in both locales. Chromium also passes native write/read checks. Both engines verify visible pending feedback, duplicate-request prevention and denied-write feedback.
- Immediate bulk `fill()` directly after autofocus intermittently leaves the headless WebKit search query empty, including with the baseline sweep suspended. Keyboard-by-keyboard input and clicking the field before bulk entry pass repeated checks. Windowed WebKit additionally passes 24 real clipboard pastes immediately after search opens, across both locales. The headless automation ambiguity remains recorded; no fix is claimed for that synthetic zero-delay operation. The behavior suites use actual key events for keyboard lookup and explicit field focus for bulk entry.
- The committed original production build also differs from the older approved CSS snapshot: `.home-agent-edit-icon` is already 2.5rem in the base source, while the stored snapshot says 1.25rem. This is a pre-existing snapshot discrepancy; homepage source and computed appearance are compared directly against the frozen committed build.
- No payment or sponsorship transaction was submitted during testing.
