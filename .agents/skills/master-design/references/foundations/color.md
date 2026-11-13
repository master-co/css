# Color

Choose color by its job before choosing its value. Separate the page surface, a raised region, primary and secondary text, a necessary boundary, an accent and feedback states. Keep these meanings stable when appearance changes.

## Define roles

A palette is a range of available values; a semantic role explains when a value belongs. Use roles such as surface, content, boundary, focus and status so a dark theme can change their values without changing the interface's meaning. Do not let a palette step silently imply disabled, selected or error everywhere.

Reserve the strongest accent for consequential actions and selected information. A warning needs useful text and a distinct cue, not simply more saturation. Keep tertiary information readable instead of using low opacity as a substitute for hierarchy.

## Compose light and dark

Design dark surfaces as a hierarchy in their own right. A raised surface may need a lighter fill and a controlled edge rather than a larger shadow. Verify the actual foreground/background pairs, including content on selected rows, buttons and overlays.

Alpha colors depend on the surface below them. Test overlapping translucency and the lightest and darkest plausible backgrounds. Avoid copying the same opacity between themes and assuming equal perceived contrast.

## Keep meaning available

Combine color with labels, icons or shape for feedback and selection. Keep focus independent from the accent or decorative contour. In forced colors, preserve semantic boundaries with supported borders/outlines and system colors rather than relying on box shadows alone.

## Compare the actual pair

A foreground role needs a compatible background role. Moving muted text from a page to an accent-filled button can invalidate a previously acceptable pair. For translucent paint, the apparent color depends on both alpha and the surface underneath; multiplying several translucent layers is different from applying one opacity to the whole group, which also fades its text.

Use a color comparison with the same words, size and layout. Change only the surface or alpha being investigated, and calculate contrast from the resulting foreground and background. A contrasting annotation color must not be mistaken for a prescribed brand accent.

## Choose emphasis by meaning

Semantic color may need to compete with a brand accent, a selected fill and keyboard focus at the same time. Give the distinct facts distinct cues: a selected checkmark, an error message and a focus outline can coexist. Do not make every actionable region the same saturated color merely because each is clickable.

Check a selected row with secondary text and an invalid field with focus in both themes. Repeat without color and in forced colors. The same facts should remain identifiable even when decorative surfaces disappear. [Spectrum's token guidance](https://spectrum.adobe.com/page/design-tokens/) explains intent-based roles; its taxonomy and palette are not required here.

## Review

Check normal, hover, active, focused, selected, invalid and disabled states, including concurrent states. Measure contrast on the composited result. Read the [accessibility baseline](../accessibility.md) and [surface craft](../surfaces.md). A consumer library's published theme remains the owner of its roles and values.
