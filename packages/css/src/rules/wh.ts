import { analyzeValueToken } from '../utils/analyze-value-token'
import { Rule } from '../rule'

export class WH extends Rule {
    static override id = 'WH' as const
    static override matches = '^(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)x(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)'
    static override get prop() { return '' }
    override analyzeToken(token: string, values: Record<string, string | number>, globalValues: Record<string, string | number>): [string, Array<string | { value: string }>, string] {
        return ['', ...analyzeValueToken(token, values, globalValues, ['x'])]
    }
    override get(declaration): { [key: string]: any } {
        const [width, height] = declaration.value.split(' x ')
        return {
            'width': { ...declaration, value: width },
            'height': { ...declaration, value: height }
        }
    }
}