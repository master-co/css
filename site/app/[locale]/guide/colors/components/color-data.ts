import { getThemeVariables } from '~/site/utils/theme-variables'

export type PresetThemeColorPreview = 'background' | 'line' | 'text'
export type PresetThemeColorGroup = 'surfaces' | 'lineRoles' | 'baseHue' | 'textRoles' | 'textHue'

function getModeRows(namespace: string, utilities: (key: string) => string[], previewType: PresetThemeColorPreview) {
  return getThemeVariables(namespace).filter(variable => namespace !== 'color' || /^[a-z]+$/.test(variable.key) && variable.value.startsWith('var(')).map(variable => ({
    key: variable.key, token: `--${variable.name}`, utilities: utilities(variable.key), previewType,
    value: String(variable.value),
  }))
}
const textRows = getModeRows('color-text', key => [`fg-text-${key}`], 'text')
const textRoleKeys = new Set(['body', 'strong', 'muted', 'disabled', 'inverse', 'link', 'link-hover'])
export const rowsByGroup = {
  surfaces: getModeRows('color-surface', key => [`bg-surface-${key}`], 'background'),
  lineRoles: getModeRows('color-line', key => [`b-${key}`], 'line'),
  baseHue: getModeRows('color', key => [`bg-${key}`, `fg-${key}`], 'background'),
  textRoles: textRows.filter(({ key }) => textRoleKeys.has(key)),
  textHue: textRows.filter(({ key }) => !textRoleKeys.has(key)),
}
export const columnTitleByGroup = { surfaces: 'Role', lineRoles: 'Role', baseHue: 'Use for', textRoles: 'Role', textHue: 'Use for' }
const surfaceDescriptions: Record<string, string> = {
  base: 'Root page or app background.',
  inset: 'Recessed regions and inset sections.',
  raised: 'Raised cards, controls, and stacked surfaces.',
  floating: 'Floating layers such as dialogs, popovers, and menus.',
  inverse: 'High-contrast inverse surfaces.'
}
const lineRoleDescriptions: Record<string, string> = {
  divider: 'Decorative dividers; not required control boundaries.',
  control: 'Required control boundaries on opaque preset surfaces.',
  subtle: 'Low-contrast hairlines and soft outlines.'
}
const textRoleDescriptions: Record<string, string> = {
  body: 'Default readable foreground text.',
  strong: 'Headings, labels, and emphasized foreground text.',
  muted: 'Secondary text on base, inset, or raised; use fg-text-body on floating.',
  disabled: 'Unavailable actions and disabled controls.',
  inverse: 'Text on inverse surfaces.',
  link: 'Default inline links.',
  'link-hover': 'Interactive link hover state.'
}
export const rowDescriptionByGroup = {
  surfaces: (key) => surfaceDescriptions[key],
  lineRoles: (key) => lineRoleDescriptions[key],
  baseHue: (key) => `Fixed ${key} swatch; no text contrast guarantee.`,
  textRoles: (key) => textRoleDescriptions[key],
  textHue: (key) => `Mode-aware ${key} foreground text.`
} satisfies Record<PresetThemeColorGroup, (key: string) => string>
