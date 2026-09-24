import { getThemeVariables } from '~/site/utils/theme-variables'

export function getFontWeightRows() {
  return getThemeVariables('font-weight').map(({ key, name, value }) => ({
    token: `--${name}`, utilities: [`font-${key}`], value: String(value), description: 'Readable type',
  }))
}
