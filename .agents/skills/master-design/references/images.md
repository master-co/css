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
