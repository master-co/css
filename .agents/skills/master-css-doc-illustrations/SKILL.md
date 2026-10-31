---
name: master-css-doc-illustrations
description: "Create and refine technical illustrations for Master CSS Guide, Reference, and Blog articles: delivery flows, structure, scope boundaries, and visual comparisons. Produce editable 3:2 SVG scenes and coordinated light/dark images, with one composition across screen sizes and equivalent article text. Exclude homepage icons, brand design, photography, and statistical charts."
---

# Master CSS documentation illustrations

Make a relationship easier to understand through its visible structure. A reader should be able to follow the flow, recognize the boundary, or compare the relevant difference without decoding paragraphs inside uniform cards.

## Establish the lesson

Read the affected article and applicable [site instructions](../../../site/AI.md). Use [master-css-writing](../master-css-writing/SKILL.md) for the article's purpose, claims, surrounding prose, and ownership; this skill owns the illustration work.

- Name the reader question the figure answers. Locate its insertion point beside the relevant explanation.
- Verify objects, arrows, conditions, and labels against current source/tests. Existing diagrams are evidence of presentation, not proof of behavior.
- Distinguish containment from sequence, data transfer from execution, and an optional path from the default. Do not imply measured speed through arbitrary line lengths, clock faces, or percentages.
- Prefer an existing working demo or shared-data specimen when it teaches the actual behavior better. Use standard plotting tools for measured data.

For small visual edits, preserve the established relationships and scope; recompose as needed to meet the 3:2 canvas requirement. Infer routine decisions from the article and approved references; do not require an outline or style questionnaire for each image.

## Compose and produce

Read [composition](references/composition.md) to choose a visual structure and [visual language](references/visual-language.md) when drawing or changing the treatment. Read [production and validation](references/production-and-validation.md) for rendering, theme selection, integration, and checks.

1. Choose a structure that expresses the relationship. Use a container only for an actual group, artifact, or boundary.
2. Keep the labels short, with a compact, consistent type scale proportional to the objects and canvas. Let the surrounding prose carry the explanation. Make the primary path obvious before adding exceptions.
3. Author one SVG scene with shared labels and theme parameters on a landscape **3:2 outer canvas**, including all padding (for example, 600 × 400 logical pixels). Keep balanced margins and moderate whitespace between groups, with objects, labels, connectors and shadows inside the canvas. Choose their scale for readability and visual balance. Use the same composition on desktop and mobile; the image element scales proportionally to fill the article media width without a separate centered width cap. Full-width display does not require the drawn content to occupy the whole canvas.
4. Render light and dark images from that source using the existing toolchain and local fonts. Inspect the exported pixels, then inspect the figure in its article at the actual size.
5. Retain the source, output images, caption, and meaningful text equivalent. Update the relevant search/Markdown adapter when integration requires it.

Use [the rendering helper](scripts/render.ts) for the current scene interface. Its dimension checks do not establish correct semantics, legible labels, or good composition; review those separately. Do not add a rendering dependency or a diagram framework for an ordinary figure.

If the user requests a style sample, deliver and verify that concrete sample before asking for confirmation; then wait before treating it as approved or extending its style to the remaining batch. Otherwise complete authorized illustration work without introducing an approval gate.

## Finish

A finished figure fits its 3:2 canvas with balanced whitespace, has correct relationships, readable labels, consistent theme variants, responsive sizing of the same composition, and an equivalent explanation in the relevant outputs. It is placed beside the lesson and does not replace necessary code or observable results.

Report the figure and source locations, substantive visual choices, actual verification, and remaining limits. Distinguish a style candidate from an approved baseline, and a browser preview from committed article integration.

Read [research sources](references/research.md) only when maintaining the skill or reconsidering its methods.
