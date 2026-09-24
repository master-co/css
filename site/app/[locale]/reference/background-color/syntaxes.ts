import colors from '~/site/docs-shell/data/colors'
import baseColors from '~/site/docs-shell/data/base-colors'

const syntaxes = [
  ...baseColors.map(color => color === 'transparent' ? 'background-color:transparent' : `bg-${color}`),
  ...colors.map(color => color === 'transparent' ? 'background-color:transparent' : `bg-${color}`),
  ['background-color:`color`'],
]

export default syntaxes