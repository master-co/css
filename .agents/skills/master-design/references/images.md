# Images

Bright and dark image content can form uneven apparent edges against a panel. A low-alpha inward outline can quietly finish the perimeter.

```css
.content-image {
  outline: 1px solid rgb(0 0 0 / .1);
  outline-offset: -1px;
}
```

This is a specimen, not a universal image rule. Test low-alpha neutral white in a dark context. Neutral black/white avoids a palette-tinted fringe; tune strength against real edge content.

Hold the image, crop, radius and dimensions constant in comparisons. The outline overlays inside pixels without changing layout size. Rounded-corner paint reaches farther inward than a one-pixel straight strip; account for that when checking interior preservation.

Separate the image treatment from its external shell. Verify object-fit, clipping and actual image bounds. Transparent logos and irregular artwork often need their own silhouette rather than a rectangular frame; preserve transparency.

## Overlapping avatars

Read [Avatar stacking](avatar-stacks.md) for image inset, an independent surface-colored separation ring, overlap geometry, ordering, counts and participant access.

## Preserve the image while testing its edge

Keep source pixels, crop, display size and container radius fixed when comparing an outline. An inward contour affects the image perimeter without increasing the layout box; an outside ring paints beyond it. A changed crop or brighter image cannot isolate the effect of the outline.

A contour is optional when the image already separates clearly from its surroundings. Inspect bright and dark perimeter content rather than applying one opacity to every image. Identity and meaningful details must survive any crop, including narrow layouts.

## Loading and fallback

Reserve the intended aspect ratio to avoid shifting the next action. Use an appropriate alternative when an informative image fails, and avoid duplicate announcements when an adjacent name already identifies an avatar. A fallback should not imply that a different person's portrait loaded. Check delayed load, failure, zoom and both themes.

## Match the alternative to the role

| Role | Useful alternative |
| --- | --- |
| Decoration | Empty alternative or hidden decorative markup; avoid duplicate announcements |
| Identity | Identify the person/object when surrounding text does not already do so |
| Action or destination | Name the action or destination, not the drawing's appearance |
| Informative image | Convey the relevant information in context |
| Complex chart or diagram | Provide its conclusion and a suitable detailed description or data representation |

Use real text instead of an image of text when the presentation can be achieved with text, except where the image is essential or customizable under WCAG 1.4.5. A logo is a different case from a rasterized paragraph. Consult the [WAI image decision tree](https://www.w3.org/WAI/tutorials/images/decision-tree/).

## Keep text readable over changing images

Measure contrast at the actual background behind each letter after crop, resizing and compositing. An average image color cannot establish that contrast. Use a stable backing/scrim or a separate text region when the image cannot guarantee readability. Compare the same text and crop before changing treatment, then test alternate crops, loading failure and both themes. Do not cover the subject that the image needs to identify.
