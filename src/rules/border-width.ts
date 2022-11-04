import MasterCSSRule from '../rule'
import { getBorderProps } from '../utils/get-border-props'

export default class extends MasterCSSRule {
    static override id = 'BorderWidth'
    static override matches = /^(border(-(left|right|top|bottom))?-width:.|b([xytblr]|order(-(left|right|top|bottom))?)?:(([0-9]|(max|min|calc|clamp)\(.*\))|(max|min|calc|clamp)\(.*\))((?!\|).)*$)/
    static override prop = ''
    override get(declaration): { [key: string]: any } {
        return getBorderProps(this.prefix, declaration, 'width')
    }
    override get order(): number {
        return (this.prefix === 'border-width' + ':' || this.prefix === 'b:' || this.prefix === 'border' + ':') ? -1 : 0
    }
}