import colors from 'internal/data/colors'
import textColors from 'internal/data/text-colors'

const syntaxes = [
    ['text:`color`'],
    ...textColors.map(color => `text:${color}`),
    ...colors.map(color => `text:${color}`),
]

export default syntaxes