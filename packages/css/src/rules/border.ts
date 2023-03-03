import { Rule } from '../'
import { getBorderProps } from '../utils/get-border-props'

export default class extends Rule {
    static override id = 'Border' as const
    static override matches = '^b(?:[xytblr]?|order(?:-(?:left|right|top|bottom))?):.'
    static override colorful = true
    static override get prop() { return '' }
    override get(declaration): { [key: string]: any } {
        return getBorderProps(this.prefix, declaration)
    }
    override get order(): number {
        return (this.prefix === 'border' + ':' || this.prefix === 'b:') ? -2 : -1
    }
}