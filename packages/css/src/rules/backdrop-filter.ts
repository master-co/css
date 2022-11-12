import type { Config } from '../config'
import Rule from '../rule'
import { parseValueUnit } from '../utils/parse-value-unit'

export default class extends Rule {
    static override id: 'BackdropFilter' = 'BackdropFilter' as const
    static override matches = /^bd:./
    static override colorful = true
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