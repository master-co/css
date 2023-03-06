import { Rule } from '../rule'

export class Padding extends Rule {
    static id = 'Padding' as const
    static matches = '^padding(?:-(?:left|right|top|bottom))?:.'
    static get prop() { return '' }
    override get(declaration): { [key: string]: any } {
        return {
            [this.prefix.slice(0, -1)]: declaration
        }
    }
    override get order(): number {
        return (this.prefix === 'padding' + ':') ? -1 : 0
    }
}