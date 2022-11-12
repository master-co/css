import Rule from '../rule'

export default class extends Rule {
    static override id: 'GridColumn' = 'GridColumn' as const
    static override matches = /^grid-col(?:umn)?(?:-span)?:./
    static override unit = ''
    override parseValue(value: string): string {
        return this.prefix.slice(-5, -1) === 'span' && value !== 'auto'
            ? 'span' + ' ' + value + '/' + 'span' + ' ' + value
            : value
    }
    override order = -1
}