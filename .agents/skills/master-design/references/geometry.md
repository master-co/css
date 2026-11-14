# Geometry

## Measure the edges

Distinguish layout bounds, visible surface and painted effects. An outside ring does not consume padding; a physical border may. Name the edge a measurement starts from.

For concentric circular surfaces with even inset and no intervening physical border, outer radius minus inset gives inner surface radius. R 24, inset 8 and R 16 is one specimen. A .5px outside ring paints into that gap: layout inset remains 8, straight visible gap is about 7.5, painted outer radius is 16.5. Recompute for borders, asymmetric padding or other corner models.

Separate shell-to-panel spacing from panel-to-content padding. A snug shell can enclose generous content whitespace.

Tangency joins direction; a circular arc still jumps from zero to constant curvature. A custom curve can bring curvature to zero at the straight-edge join while also changing the overall silhouette. Do not equate every cubic with a platform squircle or use radius subtraction as its exact inset construction.

Guides must correspond to real centers, extents and source CSS dimensions. Mark geometric magnification separately from device density, then inspect native size.

## Read the inset

For the circular specimen above, compare layout inset 8, inner surface radius 16 and a .5px exterior ring. The straight painted gap becomes approximately 7.5, while the inner painted contour's radius becomes 16.5. These are derived values from that construction. A physical border changes the boxes and must be included separately.

Measure straight segments and the bend. Equal straight padding does not guarantee an even-looking corner when the two contours use incompatible models. Changing a corner curve may also change its apparent size; keep bounds fixed and record that additional variable instead of calling the comparison radius-only.

## Verify the construction

Test the smallest supported control and the largest relevant container, including asymmetric content. Inspect clipped focus, outside shadows and fractional edges at native size. A correct enlarged diagram establishes a geometric relationship, not identical rasterization across browsers or densities. See [shape](foundations/shape.md) and [evidence](evidence.md).

## Check an embedded end control

When a field presents its end action as an evenly inset insert, compare three gaps: block-start, block-end and adjacent inline-end. Measure from the shell's inner boundary to the action's painted boundary, not to its icon ink. With a borderless 40px shell and a 32px action, centered block gaps are 4px; an 8px end gap differs from that intention. A 4px end gap makes this specimen even. Account for physical borders and outward rings separately.

The text's start padding is a different relationship. An attached full-height action, a separator or a deliberate asymmetric composition can have different gaps. Do not force the whole field to four equal paddings or resize the hit target to make the visible inset fit. Check RTL, focus, the smallest supported size and the actual clear/open action.
