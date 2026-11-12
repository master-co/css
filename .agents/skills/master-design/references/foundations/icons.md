# Icons and imagery

Icons support recognition and scanning. Use familiar symbols with a consistent drawing weight, but do not make an unfamiliar glyph carry the only explanation of an action.

## Match the task and text

Pair an ambiguous action with a visible label. An icon-only control still needs an accessible name and a discoverable explanation where its purpose is unclear. Keep decorative icons hidden from assistive technology to avoid reading a label twice.

Review stroke, internal whitespace and optical center at the final rendered size beside the actual typeface. A 24-unit drawing scaled to 16 pixels changes its stroke weight; compensate deliberately rather than shifting every wrapper. Preserve one icon family for ordinary interface actions unless a meaningful exception is part of the brand.

## Keep imagery useful

Use photographs, illustrations and avatars when they help identify content or explain a relationship. Provide appropriate alternative text and stable aspect ratios. Decorative imagery can use an empty alternative; identity imagery should not repeat an adjacent name unnecessarily.

Crop for the intended container and inspect both bright and dark edges. A subtle inner outline can preserve an image's perimeter without altering its crop. Keep illustration style separate from the functional icon set.

## Review

Check image loading and fallback, long names, high-density rendering and themes. Icon targets must remain large enough and nonoverlapping even when their glyphs are small. See [images](../images.md), [avatar stacks](../avatar-stacks.md) and [typographic alignment](../typography.md).
