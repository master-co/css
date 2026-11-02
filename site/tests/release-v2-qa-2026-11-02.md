# Master CSS 2.0 release review — 2026-11-02

Reviewed the article, the working Fieldwork journal, the theme card, five explanatory figures and the sharing image. The visual direction is pale white oak, natural linen and ceramic photography inside the existing neutral documentation system. No deployment or publication date was assigned.

## Retained checks

Run from the repository root against a verified site server:

```sh
MASTER_RELEASE_URL=http://localhost:3102 node --test site/tests/release-v2.e2e.mjs
MASTER_RELEASE_URL=http://localhost:3102 MASTER_RELEASE_BROWSER=webkit node --test site/tests/release-v2.e2e.mjs
bun run --filter site test:docs-examples
bun run --filter site test:llms
bun run --filter site test:mdx-imports
TSX_TSCONFIG_PATH=site/tsconfig.json node --import tsx --test site/components/blog/article/blog-article.test.tsx
bun run --filter site lint
bun run --filter site type-check
```

The release browser script passed all four width/theme combinations in Chromium and all four in WebKit. It checks:

- 390px and 1440px layouts, plus actual preview resizing between one and two columns.
- Native story disclosures, iframe height growth and fragment navigation that leaves the article URL intact.
- Theme changes affecting the real accent, complete image/font downloads, source tabs and generated CSS.
- All five diagrams linking to the active scheme's 1440 × 960 original; keyboard focus and native new-tab navigation.
- Actual text ranges at doubled computed font sizes on a phone, including clipping ancestors rather than scroll width alone.

## Additional observed evidence

Final full-page captures and selected reports are under `site/test-results/release-v2/`. Additional temporary measurements are under `/tmp/master-release-evolution/` for this session.

- Standalone journal compiled with the public preset and shown CSS matched the live iframe's element dimensions, typography and colors at desktop/mobile widths in both schemes. This found and removed dependence on the preview frame's font size and line height.
- Text enlargement at 390, 768 and 1440px found no remaining clipping after masthead/navigation wrapping was corrected.
- Forced-colors checks at 320 and 390px retained the reading content, working native disclosures and a visible 2px keyboard outline without horizontal overflow.
- With JavaScript disabled, native story and figure-description disclosures remained usable. This does not claim that JavaScript-based preview controls or source tabs work without JavaScript.
- Clipboard checks in Chromium verified both authored source tabs and generated CSS. Downloaded file paths match the actual source URLs.
- Chromium mobile touch emulation resized the preview from 342px to 282px by dragging its edge; tapping the story and theme controls worked without overflow or page errors.
- All six paired illustration sources passed font, canvas-boundary and text-overlap review. The fifth technical figure uses a real tooling conflict and replacement.
- Display photographs retain their dimensions while WebP encoding reduces the interior from 526,473 to 193,040 bytes and the ceramic study from 423,376 to 145,336 bytes. JPEG originals and encoding provenance remain available.
- Sampled text contrast in the journal exceeded 6.37:1 in light mode and 5.75:1 in dark mode. These measurements are not a complete accessibility audit.
- The Astro production build completed with 243 pages. Desktop/mobile light/dark captures showed no failed resources, broken images, page errors or horizontal overflow.
- Both Chromium and WebKit acceptance suites also passed against the production preview. The public-asset audit verified 90 referenced assets with no missing or unreferenced files.
- Search found the release in both interfaces, all six indexed chapter anchors matched the page, and the announcement led each archive without a synthetic date.
- Export tests preserve the live journal's setup, assets, HTML/CSS and generated CSS, plus independent text descriptions for the five embedded figures.

## Boundaries

Firefox could not launch in this environment: its browser process reported “Could not find profile folder” before navigation, including with a fresh explicit profile. Firefox remains unverified; Chromium and WebKit evidence must not be described as testing every browser.

The article is English; `/tw` uses the site's established English-content fallback. A real launch video and publication date are still future editorial inputs. The video belongs immediately below the article masthead; there is no empty player or invented date in the current page.

Design rationale and regeneration commands are in `site/assets/images/release-v2/source/DESIGN.md`.
