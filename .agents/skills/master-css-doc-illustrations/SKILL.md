---
name: master-css-doc-illustrations
description: "Design and produce explanatory technical illustrations for Master CSS Guide, Reference, and Blog articles. Choose visual grammar and fidelity for syntax anatomy, scope, mechanisms, delivery sequences and comparisons; refine content-sized scenes in the site design system, render light/dark images, and verify reader inference and article integration. Exclude homepage icons, brand design, photography, and statistical charts."
---

# Master CSS documentation illustrations

Make a relationship easier to understand through its visible structure. A reader should be able to follow the flow, recognize the boundary, or compare the relevant difference without decoding paragraphs inside uniform cards. Matching the site's fonts, tokens and radii is a material baseline, not evidence that the illustration explains its subject well.

## Establish the lesson

Read the affected article and applicable [site instructions](../../../site/AI.md). Use [master-css-writing](../master-css-writing/SKILL.md) for the article's purpose, claims, surrounding prose, and ownership; this skill owns the illustration work.

Every Guide, Reference and Blog article outside the Integrations category requires at least one authored explanatory image embedded in the article. Integration guides are exempt and stay code-first; do not activate this workflow for them by default. The top-level Installation guide is not exempt. Produce the image and retain its editable source before treating the article as complete, including short and lookup articles. Light/dark variants count as one figure. An existing qualifying figure can remain through revisions; decorative assets, placeholders and interactive demos do not satisfy the minimum.

- Name the reader question the figure answers. Locate its insertion point beside the relevant explanation.
- State what the reader should **see**, and which visible feature establishes it: a repeated identity, a changed dimension, an enclosed scope, a precise attachment or a conditional path. If only the labels carry that claim, reconsider the composition before polishing it.
- Verify objects, arrows, conditions, and labels against current source/tests. Existing diagrams are evidence of presentation, not proof of behavior.
- Distinguish containment from sequence, data transfer from execution, and an optional path from the default. Do not imply measured speed through arbitrary line lengths, clock faces, or percentages.
- Retain an existing working demo or shared-data specimen when it teaches behavior well, and use the required image to explain a complementary relationship. Follow the writing skill's [demo design check](../master-css-writing/references/review-and-validation.md#demo-design-check); a working demo replaces neither the image nor visual review. Use standard plotting tools for measured data.

Form a brief before drawing: the reader's question, what they already know, the inference the image should enable, the evidence that makes it true, and the most likely wrong inference to prevent. Keep this in working notes or a concise source comment when useful; do not add process language to the article. Define what this figure leaves to prose, code or a live demo. A syntax anatomy figure need not also become a complete execution model.

For small visual edits, preserve the established relationships and scope; recompose as needed to meet the 3:2 canvas requirement. Infer routine decisions from the article and approved references; do not require an outline or style questionnaire for each image.

## Compose and produce

Read [composition](references/composition.md) to choose a visual structure and [visual language](references/visual-language.md) when drawing or changing the treatment. Read [production and validation](references/production-and-validation.md) for rendering, theme selection, integration, and checks.

1. Choose the visual grammar for the inference: anatomy, containment, mapping, sequence, mechanism or comparison. Set the fidelity deliberately: preserve exact teaching evidence while simplifying irrelevant context. Use the [selection and fidelity guidance](references/composition.md); the existing primitives are drawing tools, not a required layout.
2. Decide how position, shape, boundaries, line style and colour encode the relationship. Keep each meaning consistent, preserve object identity across stages, and attach labels to their actual referents. Establish a focal subject and a reading path before polishing material. Use a container only for an actual artifact, group or boundary.
3. Author one scene with shared labels on the **720 × 480** (3:2) canvas, including all margins: the article's wide media width, so a scene pixel is a CSS pixel on desktop. Draw with the site design system at its own sizes, through the shared primitives and `--ui-*` tokens, so the figure reads as the interface around it rather than a picture of it. Keep balanced margins and moderate whitespace between groups, with everything inside the canvas. Use the same composition on desktop and mobile; the image scales proportionally to fill the media width. Full-width display does not require the drawn content to occupy the whole canvas.
4. Size containers intrinsically from content, gaps and padding; retain automatic height. Constrain dimensions only for readable wrapping, a real boundary or a controlled comparison. Resolve annotations against the resulting bounds after fonts load. Render both themes with the helper, inspect the pixels, and refine the composition at actual article scale.
5. Retain the source, output images, caption, and meaningful text equivalent. Update the relevant search/Markdown adapter when integration requires it.

Use [the rendering helper](scripts/render.ts) for the current scene interface. Its font, bounds and dimension checks do not establish correct semantics, legible labels, or good composition; review those separately. Colour may distinguish concepts, scope or a meaningful change; follow the [colour guidance](references/visual-language.md#colour-with-a-purpose) instead of imposing monochrome on the explanation. Use the design system's theme-aware roles. Do not add a rendering dependency or a diagram framework.

If the user requests a style sample, deliver and verify that concrete sample before asking for confirmation; then wait before treating it as approved or extending its style to the remaining batch. Otherwise complete authorized illustration work without introducing an approval gate.

## Finish

A finished figure fits its 3:2 canvas with balanced whitespace, matches the surrounding interface in material and size, has correct relationships, readable labels, consistent theme variants, responsive sizing of the same composition, and an equivalent explanation in the relevant outputs. It is placed beside the lesson and does not replace necessary code or observable results.

Apply separate gates for **reader inference**, **visual finish** and **integration**, using [production and validation](references/production-and-validation.md#verify-at-the-final-scale). A reader should be able to answer the brief's question from the actual drawing and its necessary labels. Automated bounds checks are not a comprehension test; an agent's walkthrough is not observed user research. Repair a weak explanation before delivery even when rendering and tests pass. Resolve routine design decisions professionally instead of making the user discover missing principles one correction at a time.

Report the figure and source locations, substantive visual choices, actual verification, and remaining limits. Distinguish a style candidate from an approved baseline, and a browser preview from committed article integration.

Read [research sources](references/research.md) only when maintaining the skill or reconsidering its methods.
