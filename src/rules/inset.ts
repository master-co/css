import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'Inset'
    static override matches = /^(?:top|bottom|left|right):./
    static override propName = 'inset'
    override get(declaration): { [key: string]: any } {
        return {
            [this.prefix.slice(0, -1)]: declaration
        }
    }
}