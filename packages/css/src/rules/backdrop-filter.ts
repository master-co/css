import { Rule } from '../rule'
import { Config } from '..'
import { parseValueUnit } from '../utils/parse-value-unit'

export class BackdropFilter extends Rule {
    static id = 'BackdropFilter' as const
    static matches = '^bd:.'
    static colorful = true
    override get(declaration): { [key: string]: any } {
        return {
            'backdrop-filter': declaration,
            '-webkit-backdrop-filter': declaration
        }
    }
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