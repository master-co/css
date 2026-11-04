# Local multilingual production verification

This delivery implements English at the root plus Japanese `/ja`, Taiwan Traditional Chinese `/tw`, Korean `/ko` and Simplified Chinese `/cn` in both checkouts. HTML and SEO use `en`, `ja`, `zh-TW`, `ko` and `zh-CN`. All 808 localized MDX files received independent full-source review before explicit review records were written. Builds and preparation never approve translations.

## Source and package ownership

`/Users/aron/master/packages/internal-site` owns localization, nested MDX selection, shared UI and the single terminology glossary. `/Users/aron/master/site` owns Master content; this checkout owns Master CSS content and its generated technical Reference adapters. Canonical metadata retains publication identity, authors, dates and ordering. Translated metadata and article copy live in sibling MDX, with short interface copy in local dictionaries.

The actual packed shared package was installed into this consumer for validation. Its SHA-256 is `1639ab12dac39b0c19268e8626a416d52e85beebf85ee9e3511064c7c9be1ee6`; the local archive is `/tmp/master-local-i18n/master-internal-site-0.1.3.tgz`. The tracked `0.1.3` dependency pin and lockfile remain unchanged. A fresh registry installation of that old published version does not contain these local shared-source changes: use the validated local archive for this delivery. Package publication and consumer version upgrades are separate work. Nothing was deployed or published.

Old Batch translation code, its command and exchange manifest were removed. User environment settings and pre-existing unrelated changes were preserved. Generated catalogs, exports, caches and browser evidence are ignored.

## Intentional behavior

Missing translations, required metadata/anchors/UI or stale source and translation reviews reject production builds, including direct Astro builds. English prose fallback and the unused `untranslatedIncludes` escape hatch were removed. Ordinary source drafts and localized drafts stay outside public routes, navigation, search and exports. Required Reference prose/contracts reject draft status rather than exposing a partial catalog.

HTML and portable extraction select the same nested MDX language. Pure fenced companion examples retain a single English source. Explicit heading IDs work at H2–H6; the table of contents remains H2/H3. Five previously automatic H4 targets were pinned across all editions, including a unique `delivery-representative-fixture` target replacing the duplicate English benchmark ID. Code, comments, sample content, generated CSS, numeric facts and shared English artwork remain canonical.

Published-to-draft and deletion regressions cover stale owned Markdown removal, locale isolation, preserved assets and rebuilt feeds/llms. Reference cache keys include locale, Markdown, package resolution and actual parser/highlighter/formatter dependencies; changing a transitive parser helper invalidates a warm tree without including unrelated homepage sources.

## Verification

| Check | Result |
| --- | --- |
| Master CSS full production build | Passed, including strict 161-resource audit, exports, Astro, static postbuild, public asset and CSS delivery checks |
| Master full production build | Passed; 717 reviewed resources, 238 HTML files and 53 CSS assets |
| Shared package tests | 100 passed |
| Master site tests | 19 passed |
| Reference tests | 39 passed, including the transitive render-cache regression |
| Executable documentation examples | 28 passed |
| MDX imports | 2 passed |
| Lint cache and MDX frontmatter parser | 6 passed |
| Export suite | 42 passed; one unchanged pre-existing numeric assertion fails, detailed below |
| Master CSS lint and type checks | Passed; Astro 0 errors/warnings, 17 existing hints; Svelte and TypeScript 0 errors |
| Shared type checks | Passed; Astro 0 errors/warnings, 6 existing hints; Svelte 0 errors/warnings |
| Master type checks | Passed; Astro 0 errors/warnings, 2 existing hints; Svelte 0 errors/warnings |
| AI/source context budget | Passed |

The shared package and Master site have no lint script; their existing tests and framework/type checks were run. The export suite's five-language body, metadata, sample-code, anchor, Markdown, search, llms and structured Reference parity assertions pass.

The Master CSS build retains the current configured RC origin `https://rc.css.master.co` and version `2.0.0-rc.88`; no environment file was edited to change its release channel.

## Complete output checks

The final Master CSS inventory has 384 HTML files: 75 public identities in five languages, five native noindex 404 pages and four intentional English-only executable example pages. The static audit checked 3,150 outer article H2–H6 occurrences across the five languages, found no duplicate article IDs, and resolved all 10,204 local fragment references. All 17,558 local asset references and 9,301 CSS links resolve; 493 local assets and 47 CSS files are referenced.

All 375 ordinary public pages have the selected language, their own RC canonical, and the five language alternates plus `x-default`. Each of the 74 search entries per locale uses its selected edition, without private or mixed-locale destinations. Introduction renders the local nested title and caption in all four translations; its English caption is absent there. Five missing nested URLs return HTTP 404 with the correct local language and error copy in the local static preview. Cloudflare Pages' nearest-directory `404.html` behavior is documented in [Serving Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/#not-found-behavior).

Each translated page delivers the same external CSS hashes and inline CSS hash as its English page. The measured document-bundle partition and exact budget changes are recorded in `local-i18n-style-qa-2026-11-05.md`; no unrelated styles were added to the homepage. The final Japanese/Korean hero word-boundary rule preserves the font and hierarchy. Only two approved Japanese headline dictionary values changed, with semantic wrap hints.

Master's separate final audit checked 238 HTML files, 215 Markdown files, five RSS feeds, ten llms files, 228 sitemap entries and 45 groups of social artwork shared with English. Its static verifier resolved 17,631 local URLs without errors. See `/Users/aron/master/site/tests/local-i18n-production-qa-2026-11-05.md`.

## Browser and visual checks

Master CSS: 260 production-browser cases passed: 220 page visits covering all five languages, 1440/390 widths and light/dark themes, 20 search/keyboard/menu/text-200% cases and 20 language-switch/query/fragment/cross-site-link cases. Representative routes cover the homepage, Guide overview, Introduction, theme, colors, Astro installation, Reference overview, declarations, CLI, benchmarks and 404. The final rebuild retained identical HTML fingerprints for the browser-verified pages.

Master: 220 production-browser cases and 20 final Authoring rechecks passed. An additional 48-case Japanese/Korean hero matrix across both sites checked 320/390/1440 widths, both themes and normal/200% text. Normal words stay intact, headers retain their geometry, and there is no document overflow. Emergency wrapping remains available when enlarged text cannot fit a whole word.

Actual glyph fonts were inspected in Chromium: Japanese uses Hiragino Kaku Gothic ProN, Taiwan Chinese uses the existing Noto Sans TC face, Korean uses Apple SD Gothic Neo and Simplified Chinese uses PingFang SC, alongside Geist for Latin text. Mobile hero and article/Reference screenshots were visually inspected. These are representative visual checks; all public routes additionally received the static checks above.

Raw generated evidence is retained locally under `site/.cache/i18n/production/`, including `matrix.json`, `fonts.json` and `missing-pages.json`. The independent full HTML audit is `/tmp/master-local-i18n/css-production-html-audit.json`; the actual build log is `/tmp/master-local-i18n/css-production-build-complete.log`. Shared and consumer test logs remain under `/tmp/master-local-i18n/`.

## Unchanged pre-existing test failure

`test:llms` retains one failing historical assertion, **delivery payload charts count complete responses once and omit absent assets**. It expects the old 36,138-byte maximum and Manifest JSON segments; the current committed snapshot/model has a 50,903-byte maximum and Runtime program data. Both `benchmarks/master-delivery-modes/snapshot.json` and its chart model are unchanged from HEAD. The snapshot SHA-256 is `b1c848fd548705021a4ae256e43bc463cb71c9075b1272d3885682e44fd8e9d1`.

No benchmark facts, snapshot or assertion was rewritten to hide this unrelated mismatch. The localized HTML, Markdown and llms all retain the same current measured facts, and their parity assertions pass. This failure is separate from the successful strict production builds.
