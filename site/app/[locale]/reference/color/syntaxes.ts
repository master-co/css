import colors from '~/site/docs-shell/data/colors'
import baseColors from '~/site/docs-shell/data/base-colors'
import { getThemeVariables } from '~/site/utils/theme-variables'

const textColors = getThemeVariables('color-text').map(({ key }) => key)

const syntaxes = [
  ...baseColors.map(color => color === 'transparent' ? 'fg:transparent' : `fg-${color}`),
  ...colors.map(color => color === 'transparent' ? 'fg:transparent' : `fg-${color}`),
  ...textColors.map(color => `text-${color}`),
  ['fg:`color`'],
]

export default syntaxes
