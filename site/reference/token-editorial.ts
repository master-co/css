/** Reading context only; token values and consumers still come from the preset. */
export const tokenEditorial: Record<string, { context: string, guide: string, label: string }> = {
  animate: { context: 'Named animation shorthands combine a keyframe name with timing and repetition. The current recipes loop indefinitely; use a finite animation when an entrance should run once.', guide: '/guide/motion', label: 'Motion' },
  breakpoint: { context: 'These lengths define the shared viewport thresholds. The named media conditions are listed separately in [Breakpoints](/reference/tokens/breakpoints).', guide: '/guide/breakpoints', label: 'Breakpoints' },
  color: { context: 'Numbered palette steps have fixed values. Hue aliases such as blue have separate light and dark values; current resolves to the element’s currentColor.', guide: '/guide/colors', label: 'Colors' },
  'color-line': { context: 'Line roles give borders, outlines and strokes a consistent emphasis in each theme.', guide: '/guide/colors#line-roles', label: 'Colors' },
  'color-surface': { context: 'Surface roles identify page, subdued, raised, floating and inverse backgrounds. Their stored references resolve through the palette.', guide: '/guide/colors', label: 'Colors' },
  'color-text': { context: 'Text roles provide foreground hierarchy and interaction colors. Choose them against the actual surface; a role name alone does not guarantee sufficient contrast.', guide: '/guide/colors', label: 'Colors' },
  container: { context: 'Shared lengths cap reusable regions and define container-query thresholds. The named conditions are listed separately in [Containers](/reference/tokens/containers).', guide: '/guide/containers', label: 'Containers' },
  content: { context: 'The empty token supplies an empty quoted string for generated content.', guide: '/reference/content', label: 'Content' },
  duration: { context: 'Share these durations across animation and transition lengths or delays. A duration alone does not create an animation.', guide: '/guide/motion', label: 'Motion' },
  easing: { context: 'Timing curves describe how an animation or transition progresses between its states.', guide: '/guide/motion', label: 'Motion' },
  'font-family': { context: 'Each value is an ordered fallback stack. Available font files determine which face the browser uses.', guide: '/guide/typography#font-families', label: 'Typography' },
  'font-feature': { context: 'OpenType feature values apply through font-feature-settings. The chosen font must support the requested feature.', guide: '/reference/font-feature-settings', label: 'Font features' },
  'font-size': { context: 'Use font:* for a size-only change. The text:* utility combines size with the preset’s corresponding line height and letter spacing.', guide: '/guide/typography', label: 'Typography' },
  'font-weight': { context: 'Named weights map to numeric font weights. Their appearance depends on the available faces and supported weight range.', guide: '/guide/typography#font-weights', label: 'Typography' },
  leading: { context: 'These unitless line heights scale with the element’s font size.', guide: '/guide/typography#line-height', label: 'Typography' },
  order: { context: 'Order changes the visual arrangement of flex and grid items. It does not change document order or keyboard navigation order.', guide: '/reference/order', label: 'Order' },
  radius: { context: 'Corner radii shape an element’s border. They do not, by themselves, clip its descendants.', guide: '/guide/corner-radius', label: 'Corner radius' },
  shadow: { context: 'Each shadow combines several layers. The current light and dark variants keep the same geometry and change their colors and opacity.', guide: '/guide/elevation', label: 'Elevation' },
  spacing: { context: 'A shared spacing scale supports padding, margin, gaps and other length-valued properties.', guide: '/guide/spacing', label: 'Spacing' },
  tracking: { context: 'Nonzero tracking values use em units, so letter spacing scales with the element’s font size.', guide: '/guide/typography#letter-spacing', label: 'Typography' }
}
