# Geometry

Distinguish layout bounds, visible surface and painted effects. An outside ring does not consume padding; a physical border may. Name the edge a measurement starts from.

For concentric circular surfaces with even inset and no intervening physical border, outer radius minus inset gives inner surface radius. R 24, inset 8 and R 16 is one specimen. A .5px outside ring paints into that gap: layout inset remains 8, straight visible gap is about 7.5, painted outer radius is 16.5. Recompute for borders, asymmetric padding or other corner models.

Separate shell-to-panel spacing from panel-to-content padding. A snug shell can enclose generous content whitespace.

Tangency joins direction; a circular arc still jumps from zero to constant curvature. A custom curve can bring curvature to zero at the straight-edge join while also changing the overall silhouette. Do not equate every cubic with a platform squircle or use radius subtraction as its exact inset construction.

Guides must correspond to real centers, extents and source CSS dimensions. Mark geometric magnification separately from device density, then inspect native size.
