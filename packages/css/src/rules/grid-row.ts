import Rule from '../rule'

export default class extends Rule {
    static override id: 'GridRow' = 'GridRow' as const
    static override matches = /^grid-row-span:./
    static override unit = ''
    override parseValue(value: string): string {
        return this.prefix.slice(-5, -1) === 'span' && value !== 'auto'
            ? 'span' + ' ' + value + '/' + 'span' + ' ' + value
            : value
    }
    override order = -1
}