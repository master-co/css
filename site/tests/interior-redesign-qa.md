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
- The native standalone mark and the two lockups remain unchanged. The central ribbon's endpoint colors are distinguished from the complete source gradients.
- The ¼ mark-height clear-space rule and minimum sizes are authored guidance. The SVG canvas ratios are verified against the original files. The page includes actual-size minimum specimens.
- Original SVG download destinations and trademark/name policy text are retained.

## Document and interaction refinements

- Below 64rem, the native modal site menu includes the current document chapters as well as global navigation and preferences. Search has its own entry and nested dialog behavior.
- Below 80rem, a native disclosure exposes the same article-heading inventory as the desktop contents rail. It works without hydration; the enhanced link closes it and focuses the destination.
- Search loads its index when requested, announces loading/empty/failure states, offers retry, supports keyboard selection and restores the initiating control's focus.
- Language changes and same-page anchor navigation preserve the current query string.
- At the standard root size, document title and code sizes remain 28px/13px with the same code leading. They scale with enlarged text instead of staying fixed.
- Previous/next links identify their direction and allow complete titles to wrap.
- Interior surfaces use contours and contact shadows. The homepage retains its global material definitions.
- Footer groups wrap to fit their available width; legal links and controls remain usable at enlarged text and touch sizes.

## Secondary pages

- Blog uses the two published posts across the available width, adds a page heading and stable dates, and preserves all post destinations/content.
- Sponsor gains real section headings, one consistent tier presentation, unchanged amounts and platform destinations, and native modal focus/dismissal behavior. Direct platform links remain available without JavaScript.
- 404 gains a search entry and a direct Guide recovery link, with wrapping at narrow/enlarged sizes.
- Removed the unused `images/gold-pattern.jpg`, previously mentioned only in a commented-out Blog image. No homepage-specific asset was removed.

## Evidence and reproduction

Generated evidence is ignored under `site/test-results/interior-redesign/`:

- `work-log.json`: actual start time and milestone events; the requested minimum is eight hours. No completed duration is claimed until recorded at delivery.
- `inventory.json`: 448 built page resources including the 404 template, plus two deliberately missing-path probes.
- `document-baseline/geometry.json`: initial positions/widths at 390, 768, 1280 and 1440px for four document types.
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
- No payment or sponsorship transaction was submitted during testing.
