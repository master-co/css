# Master CSS and Storybook

Created 2026-11-02 using built-in image_gen, following the user-approved smaller-logo, no-connector Astro series baseline.

## Inputs and prompts

- Repository SVG: site/public/icons/storybook.svg. Checked against the official identity at https://github.com/storybookjs/brand; retained as partner.svg and rasterized to partner.png.
- Light input 1: ../../astro/source/generated-light.png (approved scene, retain Master and background). Light input 2: partner.png (identity reference). Exact request: light-prompt.txt. Output: generated-light.png.
- Dark input 1: generated-light.png (edit target); input 2: ../../astro/source/generated-dark.png (lighting/material reference only). Exact request: dark-prompt.txt. Output: generated-dark.png.
- Retained originals: light: 1730 × 909; dark: 1730 × 909. WebP quality 90 and PNG compression 9 exports use identical centered proportional resizing to 1200 × 630, with negligible aspect rounding only. No visual edits during encoding.
- Final artwork: ../cover-light.webp and ../cover-dark.webp; sharing PNG: site/public/images/integrations/storybook-og.png.

The pair preserves the final no-connector composition. Generated geometry and materials were visually compared with the identity input and approved series. The parent Astro provenance records the Master mark and Hero capture origins.
