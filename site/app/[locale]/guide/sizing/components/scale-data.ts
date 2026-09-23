export const sizingRoles = [
  {
    utility: 'w:*',
    role: 'Physical width',
    description: 'Set the width of wrappers, columns, panels, media, and proportional regions.'
  },
  {
    utility: 'h:*',
    role: 'Physical height',
    description: 'Set the height of fixed regions, viewport sections, media slots, and controls.'
  },
  {
    utility: 'size:*',
    role: 'Equal axes',
    description: 'Set width and height together when the element is square by design.'
  },
  {
    utility: 'min-w:*, min-h:*, min:*',
    role: 'Lower bound',
    description: 'Prevent collapse, allow flex children to shrink, or set a minimum usable region.'
  },
  {
    utility: 'max-w:*, max-h:*, max:*',
    role: 'Upper bound',
    description: 'Cap growth for page wrappers, readable measures, panels, menus, and media.'
  },
  {
    utility: 'flex-basis:*',
    role: 'Flex starting size',
    description: 'Give flex items a shared starting main-axis size before free space is distributed.'
  },
  {
    utility: '@sm, @container(...)',
    role: 'Sizing boundary',
    description: 'Change sizing at the viewport or component container that owns the decision.'
  }
]

export const containerDescriptions: Record<string, string> = {
  '3xs': 'Small floating layers, popovers, and compact component caps.',
  '2xs': 'Narrow cards, small panels, and compact side content.',
  xs: 'Small sidebars, forms, and dense content panels.',
  sm: 'Standard sidebars, drawers, and narrow modal content.',
  md: 'Medium panels, dialogs, and reusable component widths.',
  lg: 'Wide panels, editor side panes, and modal layouts.',
  xl: 'Large content columns and media regions.',
  '2xl': 'Large panels and section caps.',
  '3xl': 'Wide content areas and dashboard sections.',
  '4xl': 'Large page sections and split layouts.',
  '5xl': 'Common page wrapper cap.',
  '6xl': 'Wide page wrapper cap.',
  '7xl': 'Full application shell cap.',
  '8xl': 'Maximum wide-screen canvas cap.'
}
