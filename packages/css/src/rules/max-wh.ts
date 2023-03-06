import { analyzeValueToken } from '../utils/analyze-value-token'
import { RuleConfig } from '..'

export const maxWH: RuleConfig = {
    matches: '^max:(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)x(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)',
    prop: false,
    analyzeToken(token: string, values: Record<string, string | number>, globalValues: Record<string, string | number>): [string, Array<string | { value: string }>, string] {
        return ['', ...analyzeValueToken(token.slice(4), values, globalValues, ['x'])]
    },
    get(declaration): { [key: string]: any } {
        const [width, height] = declaration.value.split(' x ')
        return {
            'max-width': { ...declaration, value: width },
            'max-height': { ...declaration, value: height }
        }
    }
}