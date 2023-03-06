export const gridRow = {
    id: 'GridRow' as const,
    matches: '^grid-row-span:.',
    unit: '',
    order: -1,
    parseValue(value: string): string {
        return this.prefix.slice(-5, -1) === 'span' && value !== 'auto'
            ? 'span' + ' ' + value + '/' + 'span' + ' ' + value
            : value
    }
}