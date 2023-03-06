import { Rule } from '../rule'

export class GridColumn extends Rule {
    static id = 'GridColumn' as const
    static matches = '^grid-col(?:umn)?(?:-span)?:.'
    static unit = ''
    override parseValue(value: string): string {
        return this.prefix.slice(-5, -1) === 'span' && value !== 'auto'
            ? 'span' + ' ' + value + '/' + 'span' + ' ' + value
            : value
    }
    override order = -1
}