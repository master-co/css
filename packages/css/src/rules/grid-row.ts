import { Rule } from '../rule'

export class GridRow extends Rule {
    static id = 'GridRow' as const
    static matches = '^grid-row-span:.'
    static unit = ''
    override parseValue(value: string): string {
        return this.prefix.slice(-5, -1) === 'span' && value !== 'auto'
            ? 'span' + ' ' + value + '/' + 'span' + ' ' + value
            : value
    }
    override order = -1
}