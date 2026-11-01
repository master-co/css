# Master × Astro cover

Status: final smaller-logo, no-connector pair approved by the user on 2026-11-02 as the baseline for all integration covers. Created for the Astro integration guide with built-in `image_gen` (no CLI/API fallback).

## Inputs

- Master: `site/public/brand/v2/logo/mark/master-mark-on-light.svg` in this checkout, rasterized proportionally to `master-reference.png` (800px wide). The official three-piece silhouette and champagne gold are identity references.
- Astro: [official press resources](https://astro.build/press/), [gradient mark SVG](https://astro.build/assets/press/astro-icon-light-gradient.svg), retrieved 2026-11-02 and retained as `astro-official.svg`; proportional raster input `astro-reference.png` (600px tall). Theme-appropriate graphite/ivory A with magenta flame. This is an editorial integration illustration, not a new combined brand or a statement of partnership. Upstream usage guidance remains at the linked source; this record does not establish endorsement or written consent.
- `hero-light.png` and `hero-dark.png`: homepage `.home-hero` captures from the existing `http://localhost:3000` server, verified by its process working directory as `/Users/aron/master-css/site`. Captured at 1440 × 1000 with reduced motion and Chromium Metal; material references only. No homepage code was changed.

## Generation and outputs

- `light-prompt.txt`: exact initial prompt; ordered inputs were Master raster, Astro raster, light Hero capture. Output retained as `generated-light-initial.png` solely as the input to the refinement.
- `light-refinement-prompt.txt`: edit after the user requested smaller logos and a more thoughtful ×. Input was `generated-light-initial.png`; intermediate output is `generated-light-ribbon.png`. Logos have more breathing room, with Master about 23% and Astro about 14% of the canvas width.
- `dark-ribbon-prompt.txt`: dark relighting of `generated-light-ribbon.png`, with dark Hero capture as the second input; intermediate output `generated-dark-ribbon.png`.
- The user's final direction removes the connector entirely. `remove-connector-prompt.txt` edits `generated-light-ribbon.png` into final `generated-light.png`; `dark-prompt.txt` edits `generated-dark-ribbon.png` into final `generated-dark.png`. Both preserve the smaller logo placement. The final scene has exactly two logos with empty space between them; earlier separator variants are edit provenance, not approved references.
- Both originals are 1730 × 909 PNG. The tool did not produce the requested working pixel dimensions; proportional centered resizing to 1200 × 630 removes only subpixel aspect rounding, with the same transform for both themes.
- Final `../cover-light.webp` and `../cover-dark.webp`: 1200 × 630, WebP quality 90. Public sharing image: `site/public/images/integrations/astro-og.png`, 1200 × 630 light PNG, compression level 9. Encoded with the checkout's existing `sharp`; no visual compositing or logo repair was performed during encoding.

The retained originals and prompts support further targeted edits; generation is not deterministic. Do not replace these originals with compressed exports. Assess the candidate at article and thumbnail scale before reusing its treatment for another integration.

## Verification

The final no-connector WebP pair was rendered at 390, 768 and 1280px in both themes. Images decode at 1200 × 630, show one accessible cover, fit without horizontal overflow and keep identical layout bounds across theme changes. OS-theme fallback, light print output and dark rendering without JavaScript were checked. The public light PNG returns HTTP 200, decodes at 1200 × 630 and matches OG/Twitter metadata; its 300px preview retains recognizable marks and empty space between them.

Skill validation, AI context budgets, site type-check, MDX imports and the focused installation Markdown/search export test passed. Site lint completed with zero errors and 82 existing warnings. The public asset audit reports two unrelated existing unreferenced assets, `images/contents.svg` and `images/search.svg`; the new cover assets are resolved. No production deployment or full production build was performed.
