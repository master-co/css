import { RuleConfig } from '../rule'

export const gridRows: RuleConfig = {
    unit: '',
    get(declaration): { [key: string]: any } {
        return {
            display: { ...declaration, value: 'grid' },
            'grid-auto-flow': { ...declaration, value: 'column' },
            'grid-template-rows': {
                ...declaration,
                value: 'repeat'
                    + '(' + declaration.value
                    + ','
                    + 'minmax'
                    + '(' + 0 + ',' + 1 + 'fr' + '))'
            },
        }
    }
}