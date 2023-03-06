import { RuleConfig } from '..'

export const padding: RuleConfig = {
    matches: '^padding(?:-(?:left|right|top|bottom))?:.',
    prop: false,
    get(declaration): { [key: string]: any } {
        return {
            [this.prefix.slice(0, -1)]: declaration
        }
    },
    get order(): number {
        return (this.prefix === 'padding' + ':') ? -1 : 0
    }
}