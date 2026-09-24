import colors from '~/site/docs-shell/data/colors'
import baseColors from '~/site/docs-shell/data/base-colors'
import { getThemeModeVariables } from '~/site/utils/theme-variables'

const textColors = getThemeModeVariables('color-text', 'light').map(({ key }) => key)

const syntaxes = [
  ...baseColors.map(color => `fg:${color}`),
  ...colors.map(color => `fg:${color}`),
  ...textColors.map(color => `text:${color}`),
  ['fg:`color`'],
]

export default syntaxes
