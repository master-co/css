import colors from '~/data/colors'
import textColors from '~/data/text-colors'

const syntaxes = [
    ['fg:`color`'],
    ...textColors.map(color => `fg:${color}`),
    ...colors.map(color => `fg:${color}`),
]

export default syntaxes