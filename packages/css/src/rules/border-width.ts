import { Rule } from '../rule'
import { getBorderProps } from '../utils/get-border-props'

export class BorderWidth extends Rule {
    static id = 'BorderWidth' as const
    static matches = '^(?:border(?:-(?:left|right|top|bottom))?-width:.|b(?:[xytblr]|order(?:-(?:left|right|top|bottom))?)?:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$)'
    static get prop() { return '' }
    override get(declaration): { [key: string]: any } {
        return getBorderProps(this.prefix, declaration, 'width')
    }
    override get order(): number {
        return (this.prefix === 'border-width' + ':' || this.prefix === 'b:' || this.prefix === 'border' + ':') ? -1 : 0
    }
}