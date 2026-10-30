# Production and validation

Follow [site/AI.md](../../../../site/AI.md) for authoritative asset, component, and content-export conventions. This workflow uses existing dependencies; it does not require installing an external diagram skill.

## Author and render

Keep scenes and images with their owning guide or feature under `site/assets/images/`. Keep drafts and review sheets outside the public article until they are ready for integration. Preserve unrelated workspace changes.

The current renderer accepts a scene module whose default export has a stable `id` and `render(theme)` method returning `{ width, height, svg }`. Theme is `light` or `dark`; both use one composition for all screen sizes. This is a small authoring interface, not a general diagram schema.

From the repository root:

```sh
bun .agents/skills/master-css-doc-illustrations/scripts/render.ts \
  site/assets/images/rendering-modes/source/progressive.ts \
  site/assets/images/rendering-modes
```

The helper outputs `<id>-<theme>.svg` and matching 2× PNG files, using the site's local Geist fonts and existing `@resvg/resvg-js`. Author the shared scene and material parameters; regenerate its variants together. The SVG retains text and paths for inspection and editing; the scene remains the source for reproducible changes. Standalone SVG viewing requires the intended font, while the PNG has no font dependency.

The helper checks output dimensions. Independently verify text bounds, geometry, font appearance, labels, and arrow directions. Do not claim a passing render proves visual correctness. Do not rerender unrelated figures.

The three rendering-mode scenes share labels and text descriptions from `site/utils/delivery-flows.ts`. `DeliveryFlow` selects their images through `delivery-illustration-images.ts` and renders `DocumentIllustration`; its existing Markdown adapter keeps the same ordered explanation. The active site theme chooses the paint variant. The image fills the expanded figure width and scales proportionally on every screen; there is no mobile asset or layout switch. This preserves the existing MDX interface.

## Integrate

- Use the site's image component for local bitmap assets, with intrinsic dimensions and appropriate sizing. Use the actual site theme selection, including manual switching, rather than only the operating-system preference.
- Use the same composition at every width. Only the active theme should be visible and exposed as the illustration; present one caption and one meaningful text equivalent.
- Keep article prose, figure title, important labels, conditions, and exported explanation aligned. Prefer existing shared content records; do not introduce a second source of technical facts solely for artwork.
- A short `alt` identifies the figure. A nearby explanation or text description carries the sequence and conditions; do not cram the full lesson into `alt`.
- When a custom component carries information, locate its search and Markdown/llms adapter. Preserve that information through the existing flow and verify the output instead of assuming image extraction is enough.
- Preserve explicit article anchors. Avoid client-side diagram rendering or JavaScript solely for static theme and size selection.

## Verify at the final scale

Inspect both theme outputs and the actual article column at 390, 768, and 1280px in both themes. Check 200% zoom/enlarged text as applicable, with readable HTML descriptions available independently of bitmap labels.

Check for clipped folds and shadows, tiny labels, intersecting text, missing glyphs, illegible paths, false visual grouping, and arrowheads with no shaft or the wrong direction. Inspect meaningful contrast separately from decorative highlights and grid lines. Browser preview injection is useful for a style study but is not committed integration.

Run the checks appropriate to the actual change:

- Skill and routing: `quick_validate.py`, local links and the repository's instruction-size limits, then `bun run check:ai-context`.
- Site source changes: site lint; type-check for TS/TSX; execute new rendering helpers.
- Article/component integration: `prepare-app`, MDX imports, and affected docs-example/content tests.
- Export/data changes: relevant llms/content tests and comparison of the generated explanation with the figure.

Use existing test entrypoints for semantic coverage, theme selection and responsive sizing, and exports. Avoid pixel snapshots that only freeze the first artistic draft. Report pre-existing failures separately; a sample review does not imply the full integration suite has passed.
