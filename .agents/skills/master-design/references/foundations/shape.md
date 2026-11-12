# Shape

Use shape to communicate containment and relationships. A corner radius should fit the size and role of its surface, and nested parts should look like they belong together.

## Keep a coherent family

Choose a small set of radii for controls, panels and large containers. Avoid independently rounding every nested piece. A circular icon button, a field and a card can have different shapes when their roles justify it; consistency means a repeatable relationship, not one radius everywhere.

For evenly inset concentric corners, relate the inner radius to the outer radius and inset. Borders, asymmetric padding and continuous-corner rendering change the visible result, so verify the painted gap rather than assuming arithmetic alone proves it.

## Preserve function

Shape cannot carry state by itself. A selected segment still needs appropriate semantics; a disabled button still needs its unavailable behavior. Keep focus visible outside a masked or clipped decorative shape by drawing the indicator on an unmasked container when needed.

Pills fit short tags and compact choices; they are not the default enclosure for all content. A surface that grows to several lines may need a calmer corner than a one-line control.

## Review

Inspect straight edges and corners at actual rendered size in both themes. Check nested insets, outside rings and focus clipping. Treat unsupported corner features as enhancements with a working fallback. See [geometry craft](../geometry.md) for measured relationships.
