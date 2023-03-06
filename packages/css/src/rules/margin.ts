import { Rule } from '../rule'

export class Margin extends Rule {
    static id = 'Margin' as const
    static matches = '^margin(?:-(?:left|right|top|bottom))?:.'
    static get prop() { return '' }
    override get(declaration): { [key: string]: any } {
        return {
            [this.prefix.slice(0, -1)]: declaration
        }
    }
    override get order(): number {
        return (this.prefix === 'margin' + ':') ? -1 : 0
    }
}