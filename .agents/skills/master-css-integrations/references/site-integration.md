# Article and social integration

Read current `site/AI.md`, the article, metadata and `IntegrationCover` implementation before editing. Keep integration covers separate from explanatory figures: no tray title, caption or text-description disclosure.

## Asset and component contract

- Store paired `cover-light.webp` and `cover-dark.webp` under `site/assets/images/integrations/<slug>/`, and retained generated originals, inputs and exact prompts under its `source/` directory. Record input origins, generation mode, output sizing and candidate/accepted status in a concise provenance file. Never reference a temporary or personal generated-images path from site code.
- Put the 1200 × 630 light sharing PNG at `site/public/images/integrations/<slug>-og.png`. Keep raw generation inputs out of `public/` so they are not copied into the deployed site.
- Import both WebP files as Astro image metadata and pass them to the site-local `IntegrationCover` as `images={{ light, dark }}` with `alt="Master CSS × Partner"`. The component uses the existing `Image` wrapper and site theme classes, preserves intrinsic dimensions and exposes a single accessible name.
- Insert the cover at the beginning of MDX content, after imports, so it appears below the document header and before the opening paragraph. Use the article media width, proportional height and existing radius tokens. Do not crop differently on mobile or add interactive behavior.
- Omit the separate integration logo from the article header: do not pass `icon: createHeaderIcon(...)` to these page factories. The cover carries brand identity; retain icons in integration lists and navigation where they still identify destinations.
- Set the article's existing `openGraph.images` to the PNG's public URL. The current metadata generator also supplies it to Twitter. Reuse this interface rather than adding a cover schema to public packages or changing shared metadata defaults.
- Keep a self-closing cover without tutorial children. Verify the existing search/Markdown adapter omits it; only add a narrow adapter if actual output requires it. Do not add decorative text to the article's technical export.

## Verify the delivered behavior

Inspect 390, 768 and 1280px in both themes, using the server for the actual checkout. Include the surrounding title, intro and first instructions: the cover should introduce the integration without crowding the setup. Check the 300px sharing preview separately.

- Both images load and have the same 1200 × 630 dimensions; no horizontal overflow or layout shift.
- Exactly one theme image is visible. Explicit light/dark preferences override OS preference; no-class fallback follows OS preference; print uses light. Switching themes preserves the cover bounds and apparent mark positions.
- One accessible image named `Master CSS × Partner`; bitmap children do not duplicate it. No title/caption/disclosure is added to the reading flow.
- Rendered OG and Twitter image URLs resolve to the intended public PNG, independently of UI theme.
- The Markdown/search content retains the original commands and explanation, without cover paths, props or decorative descriptions.

Run site lint and type-check, affected MDX and asset checks, plus existing focused example checks when prose/code changed. For skill/context edits run the skill validator and `bun run check:ai-context`. Report existing failures separately and retain visual evidence; passing static checks is not visual approval.
