export const margin = {
    id: 'Margin' as const,
    matches: '^margin(?:-(?:left|right|top|bottom))?:.',
    get prop() { return '' },
    get(declaration): { [key: string]: any } {
        return {
            [this.prefix.slice(0, -1)]: declaration
        }
    },
    get order(): number {
        return (this.prefix === 'margin' + ':') ? -1 : 0
    }
}