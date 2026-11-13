# Shape

Use shape to communicate containment and relationships. A corner radius should fit the size and role of its surface, and nested parts should look like they belong together.

## Keep a coherent family

Choose a small set of radii for controls, panels and large containers. Avoid independently rounding every nested piece. A circular icon button, a field and a card can have different shapes when their roles justify it; consistency means a repeatable relationship, not one radius everywhere.

For evenly inset concentric corners, relate the inner radius to the outer radius and inset. Borders, asymmetric padding and continuous-corner rendering change the visible result, so verify the painted gap rather than assuming arithmetic alone proves it.

## Preserve function

Shape cannot carry state by itself. A selected segment still needs appropriate semantics; a disabled button still needs its unavailable behavior. Keep focus visible outside a masked or clipped decorative shape by drawing the indicator on an unmasked container when needed.

Pills can fit short tags and compact choices. For a surface that grows to several lines, inspect available text space and edge relationships rather than assuming the same shape remains useful.

## Compare a nested pair

For circular corners with an even inset and no physical border between surfaces, an outer radius of 24 and inset of 8 imply an inner radius of 16. Giving both surfaces radius 24 changes the corner gap even though the straight inset remains 8. This is a geometric specimen, not a prescribed radius family.

When the inset reaches the outer circular radius, the simple inner-radius relationship reaches zero; a negative radius is not meaningful. Asymmetric borders and noncircular corners need their own construction. Do not generalize radius subtraction to every squircle.

## Separate meaning from silhouette

Two controls may have different shapes because their purposes differ, or the same shape with different labels and states. A rounded rectangle alone does not imply a button. Verify semantics, target and state alongside the silhouette; polishing corners cannot fix a misleading action.

## Review

Inspect straight edges and corners at actual rendered size in both themes. Check nested insets, outside rings and focus clipping. Treat unsupported corner features as enhancements with a working fallback. See [geometry craft](../geometry.md) for measured relationships.
