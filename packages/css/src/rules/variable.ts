import { Rule } from '../rule'

export class Variable extends Rule {
    static id = 'Variable' as const
    static matches = '^\\$[^ (){}A-Z]+:[^ ]'
    static unit = '' // don't use 'rem' as default, because css variable is common API
    static get prop() { return '' }
    override get(declaration): { [key: string]: any } {
        return {
            ['--' + this.prefix.slice(1, -1)]: declaration
        }
    }
}