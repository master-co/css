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

A dark stripe below a card suggests accumulated ring/contact weight. A dirty halo suggests excessive ambient contribution. Negative spread can limit shadow reach. On dark backgrounds, inspect surface luminance first, then contour and dark depth separately.

A hard white inner rim needs an actual material purpose. Solid near-white panels often need no inner highlight. Keep deliberate flat or strongly outlined styles where appropriate; shadow is not a mandatory elevation system.

Check native straight edges, corners and states against actual surrounding tones. A decorative hairline is not automatically an adequate input boundary. Forced-colors mode can remove shadows; use native controls or a targeted system-color border/outline fallback without disturbing layout.
