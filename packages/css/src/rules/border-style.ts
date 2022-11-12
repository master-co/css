import Rule from '../rule'
import { getBorderProps } from '../utils/get-border-props'

export default class extends Rule {
    static override id: 'BorderStyle' = 'BorderStyle' as const
    static override matches = /^(border(-(left|right|top|bottom))?-style:.|b([xytblr]|order(-(left|right|top|bottom))?)?:(none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset)(?!\|))/
    static override prop = ''
    override get(declaration): { [key: string]: any } {
        return getBorderProps(this.prefix, declaration, 'style')
    }
    override get order(): number {
        return (this.prefix === 'border-style' + ':' || this.prefix === 'b:' || this.prefix === 'border' + ':') ? -1 : 0
    }
}