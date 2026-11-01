# Dual-brand cover production

## Visual contract

The homepage **Hero** is the material reference: champagne satin, shallow polished relief, narrow edge highlights, soft contact shadows and directional cast shadows. The zinc glass homepage feature icons and technical documentation diagrams have different visual languages; do not import their canvas, frames or production rules.

- Use a **1200 × 630** landscape composition, with about 10% safe space at every edge. Higher-resolution working images may use the same ratio. Inspect actual dimensions; a prompt's requested size is not a tool guarantee.
- Place the complete Master symbol left and the partner symbol right, leaving generous breathing room. In the Astro example the Master occupies about 23% of the canvas width and Astro about 14%; use optical weight rather than imposing equal bounding boxes on other marks. Keep original proportions and distinguishing negative spaces.
- Leave the space between the two logos empty: **no X, ×, plus, ribbon knot or replacement connector**. Their shared satin field, light and polish communicate integration. This is the user's updated direction; earlier source iterations containing a separator are not style references.
- Use one continuous scene, common light from the upper left, shallow depth and coherent shadows falling down-right. Broad low-amplitude satin folds frame the outer field; the central region stays quiet.
- Preserve Master gold and partner identity colors. Use an official light/dark logo variant where required for contrast. Do not invent another partner palette or merge the logos into a new mark.
- Keep polish restrained: thin highlight edges and broad reflections, no chrome, thick extrusions, neon, halos, individual logo cards or heavy plinths. No title, tagline, version, UI or watermark. Brand wordmarks, if needed by the approved identity, are part of the logo rather than extra editorial text.
- Light: ivory and pale champagne. Dark: warm graphite with restrained gold reflection. Match composition and crop; relight the same scene instead of inverting colors or independently inventing another arrangement.

## Inputs and generation

1. Confirm the active checkout and development server's actual working directory. Inspect `site/content/components/hero.css` and `hero-shaders.ts` as needed; capture and view the rendered Hero in both themes. Existing captures can be reused when the Hero has not materially changed.
2. Obtain the project's formal Master mark from `site/public/brand/v2/logo/mark/`. Verify partner artwork against its official source, including version, geometry, colors and usage guidance. Do not use image-search approximations. Preserve the source URL and actual input. If a partner disallows a treatment, retain its approved artwork and express material through the surrounding scene; do not claim permission or endorsement.
3. Use the available **imagegen** skill and built-in image-generation tool. Supply formal logos as identity references and the Hero capture as a material reference; explicitly distinguish these roles. Inspect local inputs before calling the tool. A raster cover must not be replaced with a procedural SVG stand-in.
4. Generate the light candidate. Compare it with both original marks: silhouette, disconnected pieces, negative-space channels, flame/letter details, colors, clear space and optical balance. Fix a specific mismatch with a targeted edit; a plausible-looking invented logo is not acceptable.
5. Derive the dark companion by editing the selected light image. Lock its canvas, positions, sizes, shapes, fold geometry and crop; change lighting and permitted theme colors only. Compare both at final size for visible displacement.
6. Preserve the original generated files. Export paired WebP and a light PNG at 1200 × 630; use identical centered cropping only for negligible ratio rounding, never stretch the marks or cut their safe area. Use the existing image tooling for encoding/resizing, and imagegen for visual edits. Inspect compressed gradients, edge detail and small-preview recognition.

Keep generation instructions explicit rather than relying on the model remembering a previous chat. Built-in generation is not deterministic: reference images, a locked composition, saved prompts and visual checks provide continuity, not a promised identical rerender.

## Reusable prompt

Replace the partner and measured composition values for its silhouette. Do not carry Astro-specific geometry into another brand.

```text
Asset: Master CSS and [partner] dual-brand integration cover, landscape 1200:630.
Inputs: Master symbol = exact identity; official partner symbol = exact identity;
homepage Hero capture = material and lighting only, ignore its text and UI.
Composition: smaller complete Master left and partner right, generous breathing room;
optically balanced, original proportions, about 10% safe edges, no editorial text.
Between the logos: empty negative space. No X, ×, plus, ribbon or other connector.
Materials: shallow polished relief, thin highlight edges, continuous champagne satin
field, restrained folds at the perimeter, calm center, no individual logo plaques.
Lighting: broad upper-left light, coherent soft contact and down-right cast shadows.
Colors: Master gold; official partner colors; ivory/pale champagne light background.
Preserve: exact silhouettes, disconnected pieces, negative spaces and recognizable details.
Avoid: generic replacement marks, merged logos, chrome, neon, thick extrusion, halos,
plinths, connector symbols, title, tagline, UI, watermark.
```

Dark edit: identify the selected light image as the edit target, lock geometry and composition, use the dark Hero as a material reference, change to warm graphite satin and official dark-background logo colors, preserve directional lighting and the partner accent.

## Approved worked example

[Master × Astro source record](../../../../site/assets/images/integrations/astro/source/provenance.md) contains the exact prompts, retained inputs and raw outputs. The user accepted the final smaller-logo, no-connector pair on 2026-11-02 and requested its use across Integrations. Use the final light/dark WebP pair beside that source directory as the series baseline; earlier separator variants are only production history. View the images before using them.

For a category spanning several unbranded hosts, such as server-rendered applications, use a compact neutral server emblem instead of choosing one host's logo. Retain the same composition, optical balance and materials; identify the symbol accurately in alternative text and provenance.

Judge logo identity, material quality and final placement separately. Check 300px-wide sharing previews as well as full article display. Generation can subtly alter silhouettes or shift theme variants; inspect the actual pixels and revise before completion.
