import Rule from '../rule'

export default class extends Rule {
    static override id = 'Variable'
    static override matches = /^\$[^ {}A-Z]+:[^ ]/
    static override unit = '' // don't use 'rem' as default, because css variable is common API
    static override prop = ''
    override get(declaration): { [key: string]: any } {
        return {
            ['--' + this.prefix.slice(1, -1)]: declaration
        }
    }
}