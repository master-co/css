import { RuleConfig } from '../rule'

export const margin: RuleConfig = {
    matches: '^margin(?:-(?:left|right|top|bottom))?:.',
    prop: false,
    get(declaration): { [key: string]: any } {
        return {
            [this.prefix.slice(0, -1)]: declaration
        }
    },
    get order(): number {
        return (this.prefix === 'margin' + ':') ? -1 : 0
    }
}