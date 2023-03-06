import { Rule } from '../rule'

const diff = .75

export class TextSize extends Rule {
    static id = 'TextSize' as const
    static matches = '^t(?:ext)?:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$'
    static get prop() { return '' }
    override get(declaration): { [key: string]: any } {
        const { unit, value } = declaration
        return {
            'font-size': declaration,
            'line-height': {
                ...declaration,
                value: unit === 'em'
                    ? value + diff + unit
                    : `calc(${value}${unit} + ${diff}em)`,
                unit: ''
            }
        }
    }
}