import { Rule } from '../rule'
import { getBorderProps } from '../utils/get-border-props'

export const borderStyle = {
    id: 'BorderStyle' as const,
    matches: '^(?:border(?:-(?:left|right|top|bottom))?-style:.|b(?:[xytblr]|order(?:-(?:left|right|top|bottom))?)?:(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|))',
    get prop() { return '' },
    get(declaration): { [key: string]: any } {
        return getBorderProps(this.prefix, declaration, 'style')
    },
    get order(): number {
        return (this.prefix === 'border-style' + ':' || this.prefix === 'b:' || this.prefix === 'border' + ':') ? -1 : 0
    }
}