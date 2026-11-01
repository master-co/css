# Production and validation

Follow [site/AI.md](../../../../site/AI.md) for authoritative asset, component, and content-export conventions. This workflow uses existing dependencies; it does not require installing an external diagram skill.

## Author and render

Keep scenes and images with their owning guide or feature under `site/assets/images/`. Keep drafts and review sheets outside the public article until they are ready for integration. Preserve unrelated workspace changes.

A scene module's default export has a stable `id` and a `render(theme)` method returning `{ width, height, title, description, html }`. Theme is `light` or `dark`; both use one composition for all screen sizes. Build it with `drawing(theme)` from the rendering-modes [materials](../../../../site/assets/images/rendering-modes/source/materials.ts): absolutely positioned `sheet`, `chip`, `mark`, `text`, `divider` and `window` primitives plus `route` paths, all in scene pixels. Every visible word goes through a primitive that marks it `data-label`, so tests can compare it with the shared labels. Add a primitive or a token-based rule to `illustration.css` instead of styling one scene inline. This is a small authoring interface, not a general diagram schema.

For text anatomy, `codeParts` preserves adjacent literal fragments and gives each its own content-sized bracket; `annotation` provides an intrinsically sized explanation. `leader` names source and target anchors and a routing corridor. The renderer resolves those anchors after the real fonts load, rejecting missing/duplicate anchors and corridors that overlap the labels. Use these measured attachments instead of estimating text width. This processing happens only while producing the bitmap, never in the article client.

The scene is 720 × 480 (`sceneWidth`, `sceneHeight`), including its margins; the renderer rejects any other ratio than landscape 3:2 and writes a 2× PNG (1440 × 960).

From the repository root:

```sh
bun .agents/skills/master-css-doc-illustrations/scripts/render.ts \
  site/assets/images/rendering-modes/source/hydration.ts \
  site/assets/images/rendering-modes
```

The helper opens the scene in the repository's Playwright Chromium with the site's `tokens.css`, `illustration.css`, the Geist variable font and IBM Plex Mono, then writes `<id>-<theme>.png`. Chromium renders the tokens exactly: `light-dark()` colours, multi-layer `box-shadow` elevation and the 350 weight, which the former resvg path could not. It fails when a font does not load or a label leaves the canvas. The scene module is the editable source; no SVG or HTML output is committed. Regenerate a scene's two variants together, and rerender the set when the shared tokens or primitives change.

The renderer's checks do not establish correct semantics, legible labels, or good composition; verify text bounds, geometry, labels and arrow directions separately. Do not claim a passing render proves visual correctness. Check that containers fit their contents with consistent padding and have no unexplained fixed width or height; after text changes, verify attached leaders against the new bounds. For a measured specimen, compare its geometry with the real example or compiled values: padding, content width, scale and dimension endpoints must agree. An inspection wash must not change the layout it is explaining.

The rendering-mode scenes share labels and text descriptions from `site/utils/delivery-flows.ts`. `DeliveryFlow` selects their images through `delivery-illustration-images.ts` and renders `DocumentIllustration` (a tray whose stage is the image); its existing Markdown adapter keeps the same ordered explanation. The active site theme chooses the paint variant. This preserves the existing MDX interface.

## Integrate

- Use the site's image component for local bitmap assets, with intrinsic dimensions and appropriate sizing. Use the actual site theme selection, including manual switching, rather than only the operating-system preference.
- Use the same composition at every width. Only the active theme should be visible and exposed as the illustration; present one caption and one meaningful text equivalent.
- Keep article prose, figure title, important labels, conditions, and exported explanation aligned. Prefer existing shared content records; do not introduce a second source of technical facts solely for artwork.
- A short `alt` identifies the figure. A nearby explanation or text description carries the sequence and conditions; do not cram the full lesson into `alt`.
- When a custom component carries information, locate its search and Markdown/llms adapter. Preserve that information through the existing flow and verify the output instead of assuming image extraction is enough.
- Preserve explicit article anchors. Avoid client-side diagram rendering or JavaScript solely for static theme and size selection.

## Verify at the final scale

Inspect both theme outputs, then the figure in its article at 1440px beside the tray title and body text: its titles, chips and cards should read as the same interface at the same size. Check 390 and 768px in both themes for proportional scaling. Verify that the entire 3:2 image fills the media width with proportional height and no clipping. This width check applies to the image element; assess the drawn content for balanced margins, moderate whitespace and readable scale, without a coverage target. Check 200% zoom/enlarged text as applicable, with readable HTML descriptions available independently of bitmap labels.

Check for clipped folds and shadows, illegible labels, intersecting text, missing glyphs, illegible paths, false visual grouping, and arrowheads with no shaft or the wrong direction. Compare related figures for consistent scale and material without imposing identical layouts. For a redesign, retain a temporary before/after crop and judge what became easier to understand, not just which version looks cleaner. Inspect meaningful contrast separately from decorative highlights. Browser preview injection is useful for a style study but is not committed integration.

Review these independently before delivery:

- **Reader inference:** answer the brief's question by tracing the visible evidence. Check the likely wrong inference explicitly: can a reader mistake classification for sequence, an annotation for real output, or optional work for a required step? Verify quantities, scopes and attachment points against source. Use the hide-notes and remove-colour critiques from composition; do not claim that a self-review demonstrates novice comprehension.
- **Finish:** the focal subject is recognizable, hierarchy is calm, alignments and curves are deliberate, and theme-aware accents help rather than compete.
- **Integration:** the figure works beside the actual article, keeps its meaningful text equivalent, and survives theme, width and enlarged-text checks.

A technically valid but generic arrangement of labelled boxes can fail the first two checks. Rework its composition instead of adding stronger shadows or more decorative colour.

For optical review, consider the visible ink as a group: text glyphs, brackets, contours and shadows can make mathematically centred boxes appear off-centre. Keep internal alignments precise, then balance the whole composition without forcing unrelated objects to equal dimensions. Check the final-size source string before its surrounding labels. Verify accent text contrast against its actual wash in both themes and keep meaningful boundaries distinguishable without colour. On phones, explicitly assess what remains visible after proportional scaling; the independent HTML explanation must carry the full meaning when image labels become small.

Use a short task-specific review rather than an ever-growing universal checklist. For anatomy: read the intact string, identify each exact range, and state what it contributes. For a comparison: name what stays the same and what changes. For a sequence: trace identity and state through every stage. If actual reader feedback is available, distinguish it from the author's inspection and address the observed misunderstanding.

Run the checks appropriate to the actual change:

- Skill and routing: `quick_validate.py`, local links and the repository's instruction-size limits, then `bun run check:ai-context`.
- Site source changes: site lint; type-check for TS/TSX; execute new rendering helpers.
- Article/component integration: `prepare-app`, MDX imports, and affected docs-example/content tests.
- Export/data changes: relevant llms/content tests and comparison of the generated explanation with the figure.

Use existing test entrypoints for semantic coverage, theme selection and responsive sizing, and exports. Avoid pixel snapshots that only freeze the first artistic draft. Report pre-existing failures separately; a sample review does not imply the full integration suite has passed.
