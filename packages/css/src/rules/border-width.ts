import { Rule } from '../rule'
import { getBorderProps } from '../utils/get-border-props'

export const borderWidth = {
    id: 'BorderWidth' as const,
    matches: '^(?:border(?:-(?:left|right|top|bottom))?-width:.|b(?:[xytblr]|order(?:-(?:left|right|top|bottom))?)?:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$)',
    get prop() { return '' },
    get(declaration): { [key: string]: any } {
        return getBorderProps(this.prefix, declaration, 'width')
    },
    get order(): number {
        return (this.prefix === 'border-width' + ':' || this.prefix === 'b:' || this.prefix === 'border' + ':') ? -1 : 0
    }
}