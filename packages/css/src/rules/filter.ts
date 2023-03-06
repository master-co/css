import { Rule } from '../rule'
import { Config } from '..'
import { parseValueUnit } from '../utils/parse-value-unit'

import { RuleConfig } from '..'

export const filter: RuleConfig = {
    matches: '^(?:blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|opacity|saturate|sepia)\\(',
    colorful: true,
    parseValue(value: string, config: Config): string {
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