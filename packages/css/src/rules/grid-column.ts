import { RuleConfig } from '../rule'

export const gridColumn: RuleConfig = {
    matches: '^grid-col(?:umn)?(?:-span)?:.',
    unit: '',
    order: -1,
    parseValue(value: string): string {
        return this.prefix.slice(-5, -1) === 'span' && value !== 'auto'
            ? 'span' + ' ' + value + '/' + 'span' + ' ' + value
            : value
    }
}