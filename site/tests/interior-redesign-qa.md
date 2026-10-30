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
- Search loads its index when requested, announces loading/empty/failure states, offers retry, supports keyboard selection and restores the initiating control's focus.
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
- Interior surfaces use contours and contact shadows. The homepage retains its global material definitions.
- Footer groups wrap to fit their available width; legal links and controls remain usable at enlarged text and touch sizes.

## Secondary pages

- Blog uses the two published posts across the available width, adds a page heading and stable dates, and preserves all post destinations/content.
- Sponsor gains real section headings, one consistent tier presentation, unchanged amounts and platform destinations, and native modal focus/dismissal behavior. Direct platform links remain available without JavaScript.
- Empty supporter data does not leave an isolated plus button; the real contribution sections remain available. Without JavaScript, native platform links replace the inactive tier buttons and retain all amounts.
- All 82 Design System routes are checked at 320px with 200% text. Review chrome adapts its padding, labels, palette columns and range controls; a default canvas owns its full height instead of overlapping the following note.
- Alignment and float specimens keep their subject geometry inside named local scroll regions with visible focus and horizontal keyboard operation. Document-review composites avoid applying prose bleed twice.
- Homepage-icon review changes affect only text and layout containers. Artwork sources, icon components, prescribed icon sizes and dedicated homepage styles remain untouched; large review specimens keep their actual size in a local scroll area.
- 404 gains a search entry and a direct Guide recovery link, with wrapping at narrow/enlarged sizes.
- Removed the unused `images/gold-pattern.jpg`, previously mentioned only in a commented-out Blog image. No homepage-specific asset was removed.

## Evidence and reproduction

Generated evidence is ignored under `site/test-results/interior-redesign/`:

- `work-log.json`: actual start time and milestone events; the requested minimum is eight hours. No completed duration is claimed until recorded at delivery.
- `inventory.json`: 448 built page resources including the 404 template, plus two deliberately missing-path probes.
- `document-baseline/geometry.json`: initial positions/widths at 390, 768, 1280 and 1440px for four document types.
- `content-preservation.json`: all 352 Guide, Reference and Blog article bodies preserve their normalized text and existing semantic anchors.
- `home-paint/summary.json`: 40 pairs of homepage-main screenshots are byte-identical, including both locales/engines/themes and five widths. The allowed shared header is hidden equally in both captures; full geometry and text also agree.
- `baseline-production/` and `redesign-production/`: browser measurements and before/after screenshots, including loading, headings, links, artwork, overflow and geometry.
- `brand-*`, `search-*`, `navigation-*`: behavior, enlarged text, densities, keyboard and theme evidence.
- `index.html` and `review-report.json`: generated comparison viewer and findings.

The frozen original source was exported separately and built with the same package artifacts. Production comparisons use independent previews so development hot reload and regeneration cannot invalidate a browser capture. Earlier development captures remain available separately.

```sh
node --import tsx site/scripts/interior-inventory.ts
MASTER_SWEEP_URL=http://127.0.0.1:3219 \
  MASTER_SWEEP_LABEL=baseline-production MASTER_SWEEP_DELIVERY=static \
  node site/scripts/interior-visual-sweep.mjs
MASTER_SWEEP_URL=http://127.0.0.1:3220 \
  MASTER_SWEEP_LABEL=redesign-production MASTER_SWEEP_DELIVERY=static \
  node site/scripts/interior-visual-sweep.mjs
node site/scripts/interior-report.mjs

MASTER_BRAND_URL=http://127.0.0.1:3220 MASTER_BRAND_MATRIX=full \
  node --test site/tests/brand-system.e2e.mjs
MASTER_SITE_URL=http://127.0.0.1:3220 \
  node --test site/tests/documentation-search.e2e.mjs site/tests/interior-navigation.e2e.mjs
```

Set `MASTER_BRAND_BROWSER=webkit` or `MASTER_SITE_BROWSER=webkit` for the corresponding behavior suite. Sweep defaults cover Chromium/WebKit, 320/390/768/1280/1440px, light/dark, and both route locales. Cached captures are reused only for matching URLs and expectations.

## Verification status

Implementation checks passed so far: site lint and type check; Reference (25), syntax (14), llms (33), document examples (21), islands (8), atomic authoring (3), MDX imports (2), brand export/source checks (3), and homepage source behavior (34). Production builds render all 448 pages and public-asset verification passes.

The full final browser comparison and CSS contract review are still in progress. Update this section with final results before delivery.

## Known conditions

- Static preview serves the named `/404` resource with HTTP 200; deliberately unknown routes must return HTTP 404 and the recovery page. Both behaviors are checked separately.
- Existing static hosting uses one English 404 HTML fallback, including for unknown `/tw/` paths. Development can render that page in Traditional Chinese per request; this change retains the existing hosting behavior.
- Source locales without a complete translation continue to use English content. The brand guide's English body declares its language and includes Traditional Chinese voice/type examples; its hero and navigation are localized.
- Text contrast measurements cover visible non-code text in eight representative page types, in both themes. Syntax colors, hidden/decorative text and disabled states are excluded; this is not a complete accessibility audit.
- Playwright's WebKit engine did not complete a native OS clipboard write in the automated context. Real clipboard write/read success is verified in Chromium. Both engines verify visible pending feedback, duplicate-request prevention and denied-write feedback; native Safari clipboard success remains a manual check.
- Immediate bulk `fill()` directly after autofocus intermittently leaves the WebKit search query empty in production automation, including with the baseline sweep suspended. Keyboard-by-keyboard input and clicking the field before bulk entry pass repeated checks. Diagnostics retain this ambiguity rather than treating a rerun as proof of a fix. The behavior suites use actual key events for keyboard lookup and explicit field focus for bulk entry; zero-delay native Safari paste after autofocus is not claimed as verified.
- The committed original production build also differs from the older approved CSS snapshot: `.home-agent-edit-icon` is already 2.5rem in the base source, while the stored snapshot says 1.25rem. This is a pre-existing snapshot discrepancy; homepage source and computed appearance are compared directly against the frozen committed build.
- No payment or sponsorship transaction was submitted during testing.
