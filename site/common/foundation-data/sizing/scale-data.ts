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
    utility: 'width:*, height:*',
    role: 'Equal axes',
    description: 'Set both dimensions explicitly when the element is square by design.'
  },
  {
    utility: 'min-w:*, min-h:*',
    role: 'Lower bound',
    description: 'Prevent collapse, allow flex children to shrink, or set a minimum usable region.'
  },
  {
    utility: 'max-w:*, max-h:*',
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
