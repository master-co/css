# Installation overview cover

Created 2026-11-02 for `/guide/installation`, following the user's request for a cover showing many integrations. This overview composition is a new candidate, using the approved smaller-logo, no-connector series materials.

## Composition

One central gold Master symbol and nine optically balanced partner symbols arranged around it. The collection represents the named framework/tool guides, not an exhaustive compatibility diagram. No connector, text, individual logo cards or unsupported partner is added. The existing explanatory installation illustration remains in the article.

## Retained inputs

- Material and lighting: `../../astro/cover-light.webp` and `../../astro/cover-dark.webp`, based on the homepage Hero captures retained in `../../astro/source/hero-light.png` and `hero-dark.png`.
- Master identity: `../../astro/source/master-reference.png`, derived from the formal project mark; see the Astro source provenance.
- Partner identity: `partner-reference-board.png`, a Chromium screenshot of a three-column board using the unchanged PNG inputs below. Its labels identify input assets only and are not included in the artwork.
- Astro: `../../astro/source/astro-reference.png`.
- Vite, Nuxt, Svelte, Next.js, Angular, Lit, webpack and Storybook: the corresponding `../../<slug>/source/partner.png` for `vite`, `nuxtjs`, `svelte`, `nextjs`, `angular`, `lit`, `webpack`, `storybook`.
- Original SVGs, official source URLs and identity verification are retained in each partner's sibling source directory and `provenance.md`. This cover reuses those already verified inputs; it does not imply partner endorsement.

## Generation and export

### Current smaller-logo refinement

The user requested smaller logos and more space on every side. The final published assets now use `generated-light-smaller.png` and `generated-dark-smaller.png`, produced with the built-in imagegen tool using `light-smaller-prompt.txt` and `dark-smaller-prompt.txt`. Each logo is approximately 30% smaller in linear dimensions; the surrounding centers move inward while retaining their order. The central mark occupies roughly 14% of the canvas width, with about 20–23% quiet outer margins.

The light edit used the previous light WebP as its sole input. The dark edit used the new smaller light original as its geometry reference and the previous dark WebP for material and theme colors. The earlier originals and prompts below are retained as production history, not the current composition. Final output paths and encoding settings remain unchanged.

### Initial composition

Generated using the built-in imagegen tool. Exact submitted prompts are `light-prompt.txt` and `dark-prompt.txt`. The light generation inputs, in order, were the Astro light cover, formal Master raster and partner reference board. The dark edit inputs were the selected `generated-light.png` and Astro dark cover; geometry was locked while lighting and permitted contrast variants changed.

Unmodified outputs are `generated-light.png` (1731 × 909) and `generated-dark.png` (1730 × 909). Sharp performs only encoding and proportional resizing with a negligible centered aspect-ratio crop: `resize(1200, 630, { fit: 'cover', position: 'centre' })`. Article WebPs use quality 90; the public light PNG uses compression level 9.

Outputs: `../cover-light.webp`, `../cover-dark.webp`, and `site/public/images/integrations/installation-og.png`. Both article images reserve the same 1200 × 630 dimensions. Master stays gold; the dark companion changes Astro's A and the Next.js disc to ivory for contrast while retaining colored identities.

Visual review compared all ten silhouettes, negative spaces, brand colors and positions against the inputs, plus the established Hero-material covers. The overview keeps one accessible cover name and uses the existing decorative-cover omission in search and Markdown exports.
