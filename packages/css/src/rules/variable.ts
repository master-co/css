export const variable = {
    id: 'Variable' as const,
    matches: '^\\$[^ (){}A-Z]+:[^ ]',
    unit: '', // don't use 'rem' as default, because css variable is common API
    get prop() { return '' },
    get(declaration): { [key: string]: any } {
        return {
            ['--' + this.prefix.slice(1, -1)]: declaration
        }
    }
}