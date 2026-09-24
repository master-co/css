import { getThemeModeVariables } from '~/site/utils/theme-variables'

export type PresetThemeColorPreview = 'background' | 'line' | 'text'
export type PresetThemeColorGroup = 'surfaces' | 'lineRoles' | 'baseHue' | 'textRoles' | 'textHue'

function getModeRows(namespace: string, utilities: (key: string) => string[], previewType: PresetThemeColorPreview) {
  const dark = new Map(getThemeModeVariables(namespace, 'dark').map(variable => [variable.key, variable.value]))
  return getThemeModeVariables(namespace, 'light').map(variable => ({
    key: variable.key, token: `--${variable.name}`, utilities: utilities(variable.key), previewType,
    light: String(variable.value), dark: String(dark.get(variable.key)),
  }))
}
const textRows = getModeRows('color-text', key => [`text-${key}`], 'text')
const textRoleKeys = new Set(['body', 'strong', 'muted', 'subtle', 'disabled', 'placeholder', 'inverse', 'link', 'link-hover'])
export const rowsByGroup = {
  surfaces: getModeRows('color-surface', key => [`surface-${key}`], 'background'),
  lineRoles: getModeRows('color-line', key => [`b-${key}`], 'line'),
  baseHue: getModeRows('color', key => [`bg-${key}`, `fg-${key}`], 'background'),
  textRoles: textRows.filter(({ key }) => textRoleKeys.has(key)),
  textHue: textRows.filter(({ key }) => !textRoleKeys.has(key)),
}
export const columnTitleByGroup = { surfaces: 'Role', lineRoles: 'Role', baseHue: 'Use for', textRoles: 'Role', textHue: 'Use for' }
const surfaceDescriptions: Record<string, string> = {
  base: 'Root page or app background.',
  muted: 'Subdued sections and low-emphasis blocks.',
  raised: 'Raised cards, controls, and stacked surfaces.',
  overlay: 'Floating layers such as dialogs, popovers, and menus.',
  inverse: 'High-contrast inverse surfaces.'
}
const lineRoleDescriptions: Record<string, string> = {
  base: 'Default borders, dividers, outlines, and strokes.',
  strong: 'Emphasized boundaries and selected states.',
  muted: 'Quiet separators in dense interfaces.',
  subtle: 'Low-contrast hairlines and soft outlines.'
}
const textRoleDescriptions: Record<string, string> = {
  body: 'Default readable foreground text.',
  strong: 'Headings, labels, and emphasized foreground text.',
  muted: 'Secondary copy, metadata, and quiet navigation.',
  subtle: 'Low-emphasis helper text and placeholder-adjacent content.',
  disabled: 'Unavailable actions and disabled controls.',
  placeholder: 'Input placeholders.',
  inverse: 'Text on inverse surfaces.',
  link: 'Default inline links.',
  'link-hover': 'Interactive link hover state.'
}
export const rowDescriptionByGroup = {
  surfaces: (key) => surfaceDescriptions[key],
  lineRoles: (key) => lineRoleDescriptions[key],
  baseHue: (key) => `Mode-aware ${key} for backgrounds and foregrounds.`,
  textRoles: (key) => textRoleDescriptions[key],
  textHue: (key) => `Mode-aware ${key} foreground text.`
} satisfies Record<PresetThemeColorGroup, (key: string) => string>
