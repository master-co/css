import { Rule } from '../rule'
import { getBorderProps } from '../utils/get-border-props'

export const borderColor = {
    matches: '^border(?:-(?:left|right|top|bottom))?-color:.',
    colorStarts: 'b(?:[xytblr]|(?:order(?:-(?:left|right|top|bottom))?))?:',
    colorful: true,
    prop: false,
    get(declaration): { [key: string]: any } {
        return getBorderProps(this.prefix, declaration, 'color')
    },
    get order(): number {
        return (this.prefix === 'border-color' + ':' || this.prefix === 'b:' || this.prefix === 'border' + ':') ? -1 : 0
    }
}