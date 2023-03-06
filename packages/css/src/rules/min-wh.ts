import { analyzeValueToken } from '../utils/analyze-value-token'
export const minWH = {
    id: 'MinWH' as const,
    matches: '^min:(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)x(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)',
    get prop() { return '' },
    analyzeToken(token: string, values: Record<string, string | number>, globalValues: Record<string, string | number>): [string, Array<string | { value: string }>, string] {
        return ['', ...analyzeValueToken(token.slice(4), values, globalValues, ['x'])]
    },
    get(declaration): { [key: string]: any } {
        const [width, height] = declaration.value.split(' x ')
        return {
            'min-width': { ...declaration, value: width },
            'min-height': { ...declaration, value: height }
        }
    }
}