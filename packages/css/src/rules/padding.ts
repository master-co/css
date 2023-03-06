export const padding = {
    id: 'Padding' as const,
    matches: '^padding(?:-(?:left|right|top|bottom))?:.',
    get prop() { return '' },
    get(declaration): { [key: string]: any } {
        return {
            [this.prefix.slice(0, -1)]: declaration
        }
    },
    get order(): number {
        return (this.prefix === 'padding' + ':') ? -1 : 0
    }
}