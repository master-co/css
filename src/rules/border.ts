import MasterCSSRule from '../rule'
import { getBorderProps } from '../utils/get-border-props'

export default class extends MasterCSSRule {
    static override id = 'Border'
    static override matches = /^b([xytblr]?|order(-(left|right|top|bottom))?):./
    static override colorful = true
    static override prop = ''
    override get(declaration): { [key: string]: any } {
        return getBorderProps(this.prefix, declaration)
    }
    override get order(): number {
        return (this.prefix === 'border' + ':' || this.prefix === 'b:') ? -2 : -1
    }
}