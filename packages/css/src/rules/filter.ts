import { Rule } from '../rule'
import { Config } from '..'
import { parseValueUnit } from '../utils/parse-value-unit'

export class Filter extends Rule {
    static id = 'Filter' as const
    static matches = '^(?:blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|opacity|saturate|sepia)\\('
    static colorful = true
    override parseValue(value: string, config: Config): string {
        return parseValueUnit(
            value,
            method => {
                switch (method) {
                    case 'blur':
                    case 'drop-shadow':
                        return 'rem'
                    case 'hue-rotate':
                        return 'deg'
                }

                return ''
            },
            config)
    }
}