import { Rule } from '../'

export class Margin extends Rule {
    static override id = 'Margin' as const
    static override matches = '^margin(?:-(?:left|right|top|bottom))?:.'
    static override get prop() { return '' }
    override get(declaration): { [key: string]: any } {
        return {
            [this.prefix.slice(0, -1)]: declaration
        }
    }
    override get order(): number {
        return (this.prefix === 'margin' + ':') ? -1 : 0
    }
}