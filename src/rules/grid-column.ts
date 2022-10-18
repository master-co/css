import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'GridColumn'
    static override matches = /^grid-col(?:umn)?(?:-span)?:./
    static override propName = 'grid-column'
    static override unit = ''
    override parseValue(value: string): string {
        return this.prefix.slice(-5, -1) === 'span' && value !== 'auto'
            ? 'span' + ' ' + value + '/' + 'span' + ' ' + value
            : value
    }
    override order = -1
}