# Master CSS 2.0 release artwork

## Direction

The publication is called Fieldwork: a considered journal about spaces, objects and everyday rituals. Pale European white oak, linen, ceramic vessels and natural daylight provide the realistic material reference. Warm brown and sand are the publication's accents; the documentation frames retain the site's neutral Moonstone/Obsidian system.

Keep the work quiet and editorial: strong type hierarchy, generous insets, thin dividers, modest radii and restrained shadows. Avoid dashboard decoration, invented metrics, neon gradients and fake application controls. The opening journal is a working HTML specimen with native navigation and disclosures. Its imagery is generated, and the caption says so.

## Ownership

- `site/content/blog/v2/stories.ts`: publication copy and photograph metadata shared by the live journal, card and artwork.
- `site/content/blog/v2/examples.ts`: theme definitions and public examples. `releaseTheme` owns the two accents and story inset.
- `site/content/blog/v2/journal.ts`: the independent responsive specimen, asset/setup guidance and portable explanation.
- `scenes.ts` and `illustration.css`: six paired static illustrations; Fieldwork is retained for cover artwork, while five technical figures appear in the article.
- `site/content/blog/v2/illustrations.ts`: titles, captions, alt text and portable text equivalents.
- `photography/prompts.json`: image-generation provenance. JPEG source assets remain available; `photography/encode.ts` produces smaller WebP display assets without resizing.

The live journal explicitly supplies its font face, font family, size and line height. It must not inherit its intended typography from the documentation preview. Its only styling dependencies are the public preset and its displayed CSS. The 38rem breakpoint responds to the preview viewport; it is not presented as a preset breakpoint.

## Visual lessons

| Figure | Reader inference |
| --- | --- |
| Anatomy | A contiguous class combines a token, selector and media condition; colored leaders identify each part and the corresponding generated CSS. |
| Tokens | Shared definitions feed two schemes. The same inset is measured from each card's actual content edge; ruler widths come from `--spacing-story`. |
| Layers | A component supplies the shared link. The utility changes only horizontal padding, with inspection bands distinguishing the measurement from the background. |
| Delivery | Three alternatives occupy separate horizontal paths. The dashed Progressive branch is conditional on an uncovered class, not an unconditional engine download. |
| Tools | A real diagnostic identifies the overridden class. A distinct preview shows the safe replacement; this is not an invented editor interaction. |

Use 720 × 480 logical canvases and export at 2×. Labels must fit without overlap. Render with the shared helper, which resolves annotation anchors and checks font loading and geometry:

```sh
bun .agents/skills/master-css-doc-illustrations/scripts/render.ts site/assets/images/release-v2/source/tokens.ts site/assets/images/release-v2
bun site/assets/images/release-v2/source/render-social.ts
bun site/assets/images/release-v2/source/photography/encode.ts
```

Change `tokens.ts` to another scene entry to regenerate that pair. The social image is 1200 × 630. Inspect both themes at article size after rendering. On small screens, the article offers native full-size image links, following the active theme; text descriptions remain independently available.

## Review decisions

- Replaced the opening static mockup with the actual responsive journal. Three stories expand; local navigation stays inside the specimen.
- Moved the general product promise after the opening specimen so readers see the intended result earlier.
- Added explicit type metrics after a standalone comparison found preview-frame inheritance. Public-preset output and live-preview geometry now agree.
- Allowed the masthead and navigation to wrap after a 200% text-size audit exposed clipping that scroll-width checks missed.
- Kept source code and generated CSS behind disclosures so the announcement reads as an article while remaining reproducible.
- Kept the future launch video out of the page until it exists; its placement is immediately below the article masthead. No synthetic publication date is assigned.

The browser acceptance script is `site/tests/release-v2.e2e.mjs`. Set `MASTER_RELEASE_URL` to the verified development or preview server and optionally `MASTER_RELEASE_BROWSER=webkit`. It covers responsive behavior, real disclosures, isolated navigation, theme changes, source and asset access, and full-size diagrams. Run the site's lint, type-check and content/export checks after source changes.
