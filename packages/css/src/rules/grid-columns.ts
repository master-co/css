import { RuleConfig } from '../rule'

export const gridColumns: RuleConfig = {
    matches: '^grid-cols:.',
    unit: '',
    get(declaration): { [key: string]: any } {
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