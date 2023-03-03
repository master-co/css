import { analyzeValueToken } from '../utils/analyze-value-token'
import { Rule } from '../'

export default class extends Rule {
    static override id = 'MaxWH' as const
    static override matches = '^max:(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)x(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)'
    static override get prop() { return '' }
    override analyzeToken(token: string, values: Record<string, string | number>, globalValues: Record<string, string | number>): [string, Array<string | { value: string }>, string] {
        return ['', ...analyzeValueToken(token.slice(4), values, globalValues, ['x'])]
    }
    override get(declaration): { [key: string]: any } {
        const [width, height] = declaration.value.split(' x ')
        return {
            'max-width': { ...declaration, value: width },
            'max-height': { ...declaration, value: height }
        }
    }
}