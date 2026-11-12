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

## Review

Check normal, hover, active, focused, selected, invalid and disabled states, including concurrent states. Measure contrast on the composited result. Read the [accessibility baseline](../accessibility.md) and [surface craft](../surfaces.md). For Master UI, use its published theme roles rather than introducing a second palette in the consuming site.
