import { Rule } from '../rule'
import { getBorderProps } from '../utils/get-border-props'

export class BorderColor extends Rule {
    static id = 'BorderColor' as const
    static matches = '^border(?:-(?:left|right|top|bottom))?-color:.'
    static colorStarts = 'b(?:[xytblr]|(?:order(?:-(?:left|right|top|bottom))?))?:'
    static colorful = true
    static get prop() { return '' }
    override get(declaration): { [key: string]: any } {
        return getBorderProps(this.prefix, declaration, 'color')
    }
    override get order(): number {
        return (this.prefix === 'border-color' + ':' || this.prefix === 'b:' || this.prefix === 'border' + ':') ? -1 : 0
    }
}