# Surfaces

A contour identifies shape; contact shadow anchors it; broader shadow suggests distance. Adjust these independently. Structural seams and focus indicators have different jobs from decorative contours.

An outside zero-blur shadow draws a ring without occupying layout space. Hairline means narrowing that same ring, not adding another stroke. Compare width at constant opacity before compensating opacity; there is no universal compensation multiplier.

```css
.surface {
  box-shadow:
    0 0 0 var(--ring-width) var(--ring-color),
    var(--near-shadow),
    var(--ambient-shadow);
}
```

Use project tokens. Fractional shadow spread and border width can rasterize differently. Width, alpha, base tone, device scale and edge alignment jointly determine visible weight; .25px may disappear or become asymmetric in a particular rasterizer.

When the shadow list is composed from named values, a value that should draw nothing must still be a valid layer, such as `0 0 0 0 transparent`. `none` is invalid inside a comma-separated list and discards the whole declaration, ring included; inspect the computed `box-shadow` in every state that turns a layer off.

A dark stripe below a card suggests accumulated ring/contact weight. A dirty halo suggests excessive ambient contribution. Negative spread can limit shadow reach. On dark backgrounds, inspect surface luminance first, then contour and dark depth separately.

A hard white inner rim needs an actual material purpose. Solid near-white panels often need no inner highlight. Keep deliberate flat or strongly outlined styles where appropriate; shadow is not a mandatory elevation system.

Check native straight edges, corners and states against actual surrounding tones. A decorative hairline is not automatically an adequate input boundary. Forced-colors mode can remove shadows; use native controls or a targeted system-color border/outline fallback without disturbing layout.

## Textures

A repeated drawing across a face (dots, a grid, stripes, a checker) marks room that holds no content: an open stage, measured space, an area kept clear, the ground behind something transparent. Give each texture one such meaning within a project and keep it to specimens, margins and empty regions. Never put one under running text or controls, where marks cross letterforms and lower contrast. Its ink belongs below the faintest structural line nearby, so the eye finds the edge of what stands on it before it notices the drawing; a texture that reads first has become decoration.

Draw marks with hard-stopped gradients so the stated weight is the drawn weight, and count tiles from a whole-pixel origin: a tile centered in a box of odd width lands on half a pixel and blurs every mark. Check hairline textures at 1x as well as 2x, where a half-pixel line may vanish or double. A texture never carries meaning alone; forced-colors mode may remove it, so a boundary or a label must still say what the room is.
