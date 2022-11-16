import Rule from '../rule'
import { getBorderProps } from '../utils/get-border-props'

export default class extends Rule {
    static override id: 'BorderColor' = 'BorderColor' as const
    static override matches = /^border(-(left|right|top|bottom))?-color:./
    static override colorStarts = 'b([xytblr]|(order(-(left|right|top|bottom))?))?:'
    static override colorful = true
    static override get prop() { return '' }
    override get(declaration): { [key: string]: any } {
        return getBorderProps(this.prefix, declaration, 'color')
    }
    override get order(): number {
        return (this.prefix === 'border-color' + ':' || this.prefix === 'b:' || this.prefix === 'border' + ':') ? -1 : 0
    }
}