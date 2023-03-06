import { Rule } from '../rule'

export class GridColumns extends Rule {
    static override id = 'GridColumns' as const
    static override matches = '^grid-cols:.'
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