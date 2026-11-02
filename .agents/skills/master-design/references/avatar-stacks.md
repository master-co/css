# Avatar stacking — overlap, separation, and image edges

An avatar group identifies people. A stack is its overlapping, compact arrangement. Preserve the consumer's identity treatment, density and interaction model; overlap is not useful when names and separate portraits already fit.

## Separate the three layers

| Visible symptom | Mechanism and adjustment | Check |
| --- | --- | --- |
| Faces merge where circles overlap | An opaque outer separation ring uses the actual carrying surface color. It masks the preceding avatar; it is not elevation shadow. | Inspect selected, hovered and dark hosts, not only a white card. |
| Bright photo pixels lose their perimeter | A low-alpha neutral inner stroke paints over the photo without changing its crop or layout. | Hold source image, focus, object-fit, size and separator constant. |
| Circles change size when an outline is added | A physical border is consuming image area or changing box dimensions. Keep the layout box fixed; draw the two treatments independently. | Measure both layout and painted extents. |
| A bright halo appears on a nonwhite host | The separator uses a generic white token rather than the real opaque surface. | Compare computed host and separator colors and inspect pixels at the join. |

Keep the image at fixed dimensions with `object-fit: cover`. A wrapper clipped to the same circle can place a noninteractive pseudo-element above an opaque image:

```css
.avatar-content { position: absolute; inset: 0; border-radius: inherit; overflow: hidden; }
.avatar-content img { display: block; width: 100%; height: 100%; object-fit: cover; }
.avatar-content::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 0 var(--image-stroke-width) var(--image-stroke-color);
  pointer-events: none;
}
```

Do not assume an inset shadow directly on `img` paints above its opaque replaced content. An inward outline is another option only after verifying its actual rounded paint. Keep the inner stroke separate from the outside separator. Neither requires a floating shadow or inner white light.

## Geometry and order

For equal circular boxes on a straight line, with diameter D, overlap O and no extra physical borders, layout width is `N × D − (N − 1) × O`. An outside separator of spread G extends the first and last circles; painted width is layout width plus `2 × G`. This does not include extra outer clearance.

The stacked study starts at D32, O8, G2: three boxes occupy 80px of layout and 84px of outside paint. For a spaced row with gap S, width is `N × D + (N − 1) × S`; S6 gives 108px of layout and 112px of outside paint. The A comparisons hold portraits, crop, image inset and G2 constant, with matching host size, inline-start and vertical center. Only spacing changes. They are original concept comparisons, not a claim that the dashboard historically used spaced avatars. These are specimen values. A snug parent must still leave the outside ring unclipped. Recalculate for unequal sizes, curved arrangements, visible gaps or a different border model.

Use logical start margins and keep DOM data order. Later siblings paint in front through explicit stacking order; RTL mirrors placement without reversing people. Do not add a trailing negative margin. The dashboard specimen stays D22/O5 with a 1.5px outside separator; retain its original first-circle center and table column starts.

## Surface coupling

The component needs the actual opaque host color, including selected and hover variants. A row-surface token can feed both background and separator. The inner stroke has a separate neutral color/alpha; dark contexts may use a faint white instead of black.

A single color cannot imitate a transparent knockout over a patterned or translucent backdrop. Use a verified mask/knockout or switch to a nonoverlapping layout. The companion example chooses spacing on patterned surfaces. Do not silently paint a white disk and call it transparency.

## Counts, identity and interaction

Choose visible capacity from available space. In the four-slot study, capacity includes overflow: seven people show three portraits and **+4**; four people show four portraits and no +0. The overflow label counts hidden people, not the entire group. One person remains one avatar; zero people produces an empty state, not an invented face.

Photo failure, initials and a generic missing-identity shape keep the same box. Long names belong in an appropriate name/list view. Keep +N centered without changing the circle; account for wider counts and preserve the exact accessible count if visually abbreviating.

Display-only avatars need no tabindex. Give names once through a group label or a nearby list; do not repeat photo alt, aria-label and initials. Overlapping per-avatar 44px targets can cover one another. Prefer one real group/overflow trigger that opens a useful participant view. Check keyboard activation, Escape and focus return. Expanded rows should be separate and large enough for their actual interactions. No overflow button should be inert.

## Verify

Compare spaced versus stacked arrangement with image inset and separator fixed, then compare image-inset presence with the same stack and separator. A separate live toggle compares separator presence while other choices stay fixed. Use actual photo content, not only initials. Save native pixels separately from magnified geometry. Across relevant engines/densities, check central image pixels and crop preservation, visible edge differences, last-on-top order, RTL centers, host joins, fallback, exact overflow counts and narrow/focus behavior. Record renderer differences rather than treating a support query as proof of visible paint.

[Images](images.md) covers general image finishing. [Aron preferences](aron-preferences.md) supplies opt-in starting values; this reference does not impose the example's dimensions or palette on other brands.
