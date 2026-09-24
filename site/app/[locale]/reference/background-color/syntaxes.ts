import colors from '~/site/docs-shell/data/colors'
import baseColors from '~/site/docs-shell/data/base-colors'

const syntaxes = [
  ...baseColors.map(color => `bg:${color}`),
  ...colors.map(color => `bg:${color}`),
  ['bg:`color`'],
]

export default syntaxes