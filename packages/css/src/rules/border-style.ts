import { Rule } from '../rule'
import { getBorderProps } from '../utils/get-border-props'

export class BorderStyle extends Rule {
    static id = 'BorderStyle' as const
    static matches = '^(?:border(?:-(?:left|right|top|bottom))?-style:.|b(?:[xytblr]|order(?:-(?:left|right|top|bottom))?)?:(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|))'
    static get prop() { return '' }
    override get(declaration): { [key: string]: any } {
        return getBorderProps(this.prefix, declaration, 'style')
    }
    override get order(): number {
        return (this.prefix === 'border-style' + ':' || this.prefix === 'b:' || this.prefix === 'border' + ':') ? -1 : 0
    }
}