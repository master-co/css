/** Data for the Design system section's figures that is not shared with the rest of the homepage. */

/** The two values `--color-surface-base` takes in the token sample; the theme preview tints the line in use. */
export const surfaceModeValues = [
  { mode: 'light', label: 'Light', colorName: 'zinc', level: 0, value: 'var(--color-zinc-0)' },
  { mode: 'dark', label: 'Dark', colorName: 'zinc', level: 95, value: 'var(--color-zinc-95)' }
] as const

/** The guide each figure points to for details; the tests check every page exists. */
export const designSystemGuides = {
  'theme-modes': '/guide/variables-and-modes',
  'theme-variables': '/guide/theme',
  'p3-palette': '/guide/colors',
  'art-gallery': '/guide/view-transitions',
  'cascade-layers': '/guide/cascade-layers'
} as const

/**
 * One element followed through the preset cascade layers: its component rule sits in `components`,
 * and the engine puts the rule for its utility in a later layer, so the utility wins.
 */
export const cascadeProbe = {
  tag: 'button',
  classes: ['btn', 'px-lg'],
  component: 'btn',
  utility: 'px-lg'
} as const

/** Photos in the layout card, placed by real span classes on a 12-column grid. */
export const galleryPlacements = [
  { id: 'reading-corner', className: 'grid-col-span(4) grid-row-span(2)' },
  { id: 'shelf-room', className: 'grid-col-span(8)' },
  { id: 'open-living', className: 'grid-col-span(4)' },
  { id: 'gallery-lounge', className: 'grid-col-span(4)' }
] as const
