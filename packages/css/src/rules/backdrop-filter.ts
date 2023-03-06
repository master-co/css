import { Rule } from '../rule'
import { Config } from '..'
import { parseValueUnit } from '../utils/parse-value-unit'

export const backdropFilter = {
    id: 'BackdropFilter' as const,
    matches: '^bd:.',
    colorful: true,
    get(declaration): { [key: string]: any } {
        return {
            'backdrop-filter': declaration,
            '-webkit-backdrop-filter': declaration
        }
    },
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