import { RuleConfig } from '..'

export const variable: RuleConfig = {
    matches: '^\\$[^ (){}A-Z]+:[^ ]',
    unit: '', // don't use 'rem' as default, because css variable is common API
    prop: false,
    get(declaration): { [key: string]: any } {
        return {
            ['--' + this.prefix.slice(1, -1)]: declaration
        }
    }
}