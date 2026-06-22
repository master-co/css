import colors from 'internal/data/colors'
import textColors from 'internal/data/text-colors'

const syntaxes = [
    ...textColors.map(color => `text:${color}`),
    ...colors.map(color => `text:${color}`),
    ['text:`color`'],
]

export default syntaxes
