# Material boundaries

Glass needs a real backdrop relationship. Keep foreground text clear and test translucent fill against actual content. An all-white background may show little blur; a busy one can compromise reading.

Treat rim, inner material light and exterior shadow separately. A faint dark contour can delimit bright glass, with broad low-alpha shadow describing distance. Inner white light belongs where it explains material, not on every solid panel.

Directional edge contrast can use a hollow mask and gradient while preserving interior pixels. Verify corners, paint bounds and coherent light direction across themes.

For a fade meeting a flat plane, inspect endpoint rate of change. An eased alpha distribution may join more quietly than a linear ramp. Hold endpoints, span and total contribution controlled; extra stops are not a universal banding cure.

CSS support alone does not prove visible backdrop rasterization. Compare against no blur or an independent patterned-background probe. Record an unobserved effect as a setup limitation rather than generalizing to all browser versions.

These examples do not simulate physical refraction. Add a more elaborate material only when it serves the project’s intended visual language and preserves readable content, performance and a useful fallback. The availability of an effect is not a reason to introduce it.

## Make the backdrop part of the test

Compare the same foreground and text over a plain surface, a high-contrast pattern and a realistic image. Vary one material property at a time: fill, blur, rim or exterior shadow. A readable result on a blank background says little about a translucent panel over detailed content.

Provide a solid or otherwise readable fallback when an optional effect is unsupported. Never depend on blur alone for text contrast. Decorative masks may clip focus and shadows; put functional indicators on an appropriate unmasked boundary and verify them in forced colors.

Material richness belongs to the project's visual direction. Glass, directional highlights and layered shadows are optional techniques, not a required quality level. See [surfaces](surfaces.md), [color](foundations/color.md) and [focus](focus.md).
