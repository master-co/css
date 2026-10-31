# Visual language

## Reference and status

The direction comes from the user's light/dark project-structure examples in the [Next.js documentation](https://nextjs.org/docs/app/getting-started/project-structure): neutral surfaces, thin contours, restrained depth, readable labels, and the same structure across themes. These are visual deductions, not claims about Next.js's implementation or exact tokens.

The user accepted the initial direction with specific refinements: **no background grid**, fewer labels and enclosing frames, stronger alignment, more deliberate spacing and typography, and an engineering drawing character. The [Progressive delivery scene](../../../../site/assets/images/rendering-modes/source/progressive.ts) implements that revised brief; [Runtime](../../../../site/assets/images/rendering-modes/source/runtime.ts) and [Hydration](../../../../site/assets/images/rendering-modes/source/hydration.ts) extend it to different relationships.

Reuse their material language while composing new or revised scenes within the required 3:2 canvas.

## Material and hierarchy

- Use white/off-white in light mode and charcoal in dark mode. Reserve stronger contrast for the content and meaningful paths. Routine diagrams do not need brand yellow or a categorical rainbow.
- Separate contour, contact shadow, and ambient shadow. A fine directional edge identifies the object; a restrained gradient and soft shadow give it depth. Avoid a thick grey halo or bright plastic rim.
- Treat dark mode independently: lift the top edge and upper surface, keep the lower face restrained, and preserve readable path and label contrast. Do not invert a light image.
- Keep the background plain. Do not add a grid, technical wallpaper, or decorative crosshairs. Convey engineering precision through alignment, measured clearance, consistent strokes, and deliberate connector routes.
- Leave quiet space on all four sides and comfortable gaps between groups, including room outside shadows and connectors. Choose margins to suit the scene's density and visual balance, with all whitespace inside the fixed 3:2 canvas. Preserve readable type at the actual article width.
- Draw recognizable artifacts: a document with a fold, a browser with restrained chrome, or a module with a simple chip detail. Keep them subordinate to the relationships; no decorative dashboards or tiny faux code.
- Let connected objects share a visual vocabulary while keeping their roles distinct. Equal-size cards are useful for genuinely equivalent alternatives, not a default for every process.

The palette and effects live in [materials.ts](../../../../site/assets/images/rendering-modes/source/materials.ts). Adjust them there instead of hand-editing separate output files. Retain the minimum frames needed to identify actual artifacts and decision nodes; do not wrap the composition in another large panel.

## Type and paths

- Use the site's local Geist Regular and Medium faces. Keep source text editable and preserve exact spelling of identifiers. The renderer embeds the appearance in the PNG; it does not depend on the reader's installed fonts.
- Use a compact, shared type scale across an illustration set. On a 600 × 400 canvas, start with 20px primary labels and 18px secondary labels; scale them together when changing logical canvas dimensions. Keep labels of the same role consistent in size and weight across figures, with text proportional to its object and subordinate to the drawing.
- Judge type at the actual documentation width, including phones. Balance legibility with the whole composition rather than enlarging every label to a fixed displayed size. Simplify crowded labels and retain the readable HTML description for the complete explanation.
- Keep long conditions outside a small object and close to the edge they qualify. Do not let captions, arrows, or folds collide with text.
- Use a solid directed line for the main flow. A dashed line can identify a conditional path when its condition is explicit. Do not assign a universal “async” meaning to dashes.
- Give arrowheads a visible shaft, clearance from the destination, and the correct tangent. Avoid zero-length final segments, which can reverse a marker's direction.
- Keep labels horizontal. Budget a real corridor for edge labels and leave visible clearance from the line; neither text nor a line should touch the other.

## Themes and responsive display

Light and dark variants must share labels, objects, edges, and geometry. Only paint and effects differ. Use this same composition at every screen size; the user does not want separate mobile artwork.

Scale the image element proportionally to fill the article’s expanded media width, including on phones; retain the composition's internal margins and whitespace. Do not add a narrower centered panel or a fixed pixel-width cap. Preserve the whole 3:2 scene without cropping or distortion. Check small-screen labels and keep the readable HTML description available; a large export resolution alone does not improve displayed text size. If a future figure is too dense, simplify or split the shared composition rather than introducing a mobile variant.

Article `<img>` and `<video>` elements receive the shared inward 1px outline from the prose stylesheet. Apply it to the media element itself, not a `<figure>`, wrapper, diagram object, inline `<svg>`, `<canvas>`, or `<iframe>`. SVG files displayed through `<img>` follow the image rule. Use **10% opacity** (alpha `0.1`), with black in light mode and white in dark mode. Do not bake a second perimeter into the image. Standalone article media expands with the existing prose bleed. Media inside an already-expanded figure fills that figure without adding a second bleed; embedded demo media keeps its own layout.
