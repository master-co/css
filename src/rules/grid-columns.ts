import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'GridColumns'
    static override matches = /^grid-cols:./
    static override propName = 'grid-columns'
    static override unit = ''
    override get(declaration): { [key: string]: any } {
        return {
            display: { ...declaration, value: 'grid' },
            'grid-template-columns': {
                ...this,
                value: 'repeat'
                    + '(' + declaration.value
                    + ','
                    + 'minmax'
                    + '(' + 0 + ',' + 1 + 'fr' + '))'
            },
        }
    }
}