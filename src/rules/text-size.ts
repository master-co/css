import MasterCSSRule from '../rule'

const diff = .5

export default class extends MasterCSSRule {
    static override id = 'TextSize'
    static override matches = /^t(ext)?:([0-9]|(max|min|calc|clamp)\(.*\))((?!\|).)*$/
    override get(declaration): { [key: string]: any } {
        const { unit, value } = declaration
        return {
            'font-size': declaration,
            'line-height': {
                ...declaration,
                value: unit === 'rem'
                    ? value + diff + unit
                    : `calc(${value}${unit} + ${diff}rem)`,
                unit: ''
            }
        }
    }
}