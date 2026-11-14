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

A grid behind a transparent image can explain empty space; stripes in a chart can distinguish data; a project may use texture as part of its identity. State the intended role. The empty-stage recipe uses a quiet pattern beneath the specimen, but that meaning and intensity do not apply to every texture.

Inspect interference with letters, controls and necessary boundaries on the actual backdrop. Prefer a separate text region or stable backing when a pattern makes reading unreliable. A branded texture behind content can be valid if contrast and legibility survive crops, themes and text growth. Decorative pattern weight is a judgment; meaningful data patterns also need distinguishable labels or shapes.

Hard-stopped gradients are one way to draw crisp repeated marks, not a mandatory renderer. Check tile origin, fractional alignment and rasterization at native 1× and 2×; an odd-width centered tile may change edge weight. Forced colors may remove patterns, so necessary meaning must survive through text, shape or boundaries.

## Separate the contributions

A ring defines a contour; a contact shadow suggests attachment; a diffuse shadow suggests separation. Compare these contributions on the same shape, background and content before combining them. A stronger shadow is not a substitute for a necessary field boundary, and a darker ring need not make a surface appear farther away.

Dark appearances can need fill separation and a clear edge when a shadow against a dark background contributes little. This does not require a particular palette, gradient or light direction. Use the consumer's material language and verify the actual adjacent surfaces.

## Test a functional boundary

Inspect a resting field, a selected item and a focused action against their immediate backgrounds. Remove decorative shadows and enable forced colors. If the control can no longer be identified or its state disappears, strengthen the functional cue rather than prescribing thicker decoration everywhere. See [accessibility](accessibility.md) and [elevation](foundations/elevation.md).
