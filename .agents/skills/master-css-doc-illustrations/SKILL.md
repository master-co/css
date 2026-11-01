---
name: master-css-doc-illustrations
description: "Create and refine technical illustrations for Master CSS Guide, Reference, and Blog articles: delivery flows, structure, scope boundaries, and visual comparisons. Draw editable 3:2 scenes in the site design system at 1:1 article scale and render coordinated light/dark images, with one composition across screen sizes and equivalent article text. Exclude homepage icons, brand design, photography, and statistical charts."
---

# Master CSS documentation illustrations

Make a relationship easier to understand through its visible structure. A reader should be able to follow the flow, recognize the boundary, or compare the relevant difference without decoding paragraphs inside uniform cards.

## Establish the lesson

Read the affected article and applicable [site instructions](../../../site/AI.md). Use [master-css-writing](../master-css-writing/SKILL.md) for the article's purpose, claims, surrounding prose, and ownership; this skill owns the illustration work.

Every Guide, Reference and Blog article requires at least one authored explanatory image embedded in the article. Produce the image and retain its editable source before treating the article as complete, including short and lookup articles. Light/dark variants count as one figure. An existing qualifying figure can remain through revisions; decorative assets, placeholders and interactive demos do not satisfy the minimum.

- Name the reader question the figure answers. Locate its insertion point beside the relevant explanation.
- Verify objects, arrows, conditions, and labels against current source/tests. Existing diagrams are evidence of presentation, not proof of behavior.
- Distinguish containment from sequence, data transfer from execution, and an optional path from the default. Do not imply measured speed through arbitrary line lengths, clock faces, or percentages.
- Retain an existing working demo or shared-data specimen when it teaches behavior well, and use the required image to explain a complementary relationship. Follow the writing skill's [demo design check](../master-css-writing/references/review-and-validation.md#demo-design-check); a working demo replaces neither the image nor visual review. Use standard plotting tools for measured data.

For small visual edits, preserve the established relationships and scope; recompose as needed to meet the 3:2 canvas requirement. Infer routine decisions from the article and approved references; do not require an outline or style questionnaire for each image.

## Compose and produce

Read [composition](references/composition.md) to choose a visual structure and [visual language](references/visual-language.md) when drawing or changing the treatment. Read [production and validation](references/production-and-validation.md) for rendering, theme selection, integration, and checks.

1. Choose a structure that expresses the relationship. Use a container only for an actual group, artifact, or boundary.
2. Keep the labels short, with a compact, consistent type scale proportional to the objects and canvas. Let the surrounding prose carry the explanation. Make the primary path obvious before adding exceptions.
3. Author one scene with shared labels on the **720 × 480** (3:2) canvas, including all margins: the article's wide media width, so a scene pixel is a CSS pixel on desktop. Draw with the site design system at its own sizes, through the shared primitives and `--ui-*` tokens, so the figure reads as the interface around it rather than a picture of it. Keep balanced margins and moderate whitespace between groups, with everything inside the canvas. Use the same composition on desktop and mobile; the image scales proportionally to fill the media width. Full-width display does not require the drawn content to occupy the whole canvas.
4. Render light and dark images from that source with the rendering helper. Inspect the exported pixels, then inspect the figure in its article at the actual size, beside the tray title and body text.
5. Retain the source, output images, caption, and meaningful text equivalent. Update the relevant search/Markdown adapter when integration requires it.

Use [the rendering helper](scripts/render.ts) for the current scene interface. Its font, bounds and dimension checks do not establish correct semantics, legible labels, or good composition; review those separately. Do not add a rendering dependency, a diagram framework, or colours and shadows outside the design system's tokens.

If the user requests a style sample, deliver and verify that concrete sample before asking for confirmation; then wait before treating it as approved or extending its style to the remaining batch. Otherwise complete authorized illustration work without introducing an approval gate.

## Finish

A finished figure fits its 3:2 canvas with balanced whitespace, matches the surrounding interface in material and size, has correct relationships, readable labels, consistent theme variants, responsive sizing of the same composition, and an equivalent explanation in the relevant outputs. It is placed beside the lesson and does not replace necessary code or observable results.

Report the figure and source locations, substantive visual choices, actual verification, and remaining limits. Distinguish a style candidate from an approved baseline, and a browser preview from committed article integration.

Read [research sources](references/research.md) only when maintaining the skill or reconsidering its methods.
