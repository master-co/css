import { analyzeValueToken } from '../utils/analyze-value-token'
export const wH = {
    id: 'WH' as const,
    matches: '^(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)x(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)',
    get prop() { return '' },
    analyzeToken(token: string, values: Record<string, string | number>, globalValues: Record<string, string | number>): [string, Array<string | { value: string }>, string] {
        return ['', ...analyzeValueToken(token, values, globalValues, ['x'])]
    },
    get(declaration): { [key: string]: any } {
        const [width, height] = declaration.value.split(' x ')
        return {
            'width': { ...declaration, value: width },
            'height': { ...declaration, value: height }
        }
    }
}