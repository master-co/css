import { getThemeModeVariables } from '~/site/utils/theme-variables'

const shadowRoles: Record<string, { utility: string, role: string, description: string }> = {
  xs: {
    utility: 'shadow:xs',
    role: 'Quiet separation',
    description: 'Small controls, table rows, and subtle raised states.'
  },
  sm: {
    utility: 'shadow:sm',
    role: 'Standard surface',
    description: 'Cards, reusable panels, and quiet product surfaces.'
  },
  md: {
    utility: 'shadow:md',
    role: 'Temporary lift',
    description: 'Hover lift, floating toolbars, and command surfaces.'
  },
  lg: {
    utility: 'shadow:lg',
    role: 'Detached overlay',
    description: 'Dropdowns, popovers, toasts, and menus.'
  },
  xl: {
    utility: 'shadow:xl',
    role: 'Workflow interruption',
    description: 'Drawers, dialogs, and focused panels.'
  },
  '2xl': {
    utility: 'shadow:2xl',
    role: 'Blocking layer',
    description: 'Modals and spotlight surfaces above a dimmed page.'
  }
}

export function getShadowRows() {
  return getThemeModeVariables('shadow', 'light').flatMap(({ key }) => {
    const role = shadowRoles[key]
    if (!role) return []

    return [{
      key,
      token: `--shadow-${key}`,
      ...role
    }]
  })
}
