import { Rule, Config } from '../'
import { parseValueUnit } from '../utils/parse-value-unit'

export default class extends Rule {
    static override id = 'Filter' as const
    static override matches = '^(?:blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|opacity|saturate|sepia)\\('
    static override colorful = true
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