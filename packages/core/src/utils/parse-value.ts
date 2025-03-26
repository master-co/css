import { UNIT_REGEX } from '../common'

type ParsedValue =
    | { value: string; type: 'string' }
    | { value: number; unit: string; type: 'number' }

export default function parseValue(
    token: string | number,
    unit = '',
    rootSize = 1
): ParsedValue {
    const isNumber = typeof token === 'number'
    const defaultUnit = unit

    // 如果是純數字
    if (isNumber) {
        const value =
            defaultUnit === 'rem' || defaultUnit === 'em'
                ? token / rootSize
                : token
        return { value, unit: defaultUnit, type: 'number' }
    }

    // 解析分數（例如 1/2 → 50%）
    if (/^\d+\/\d+$/.test(token)) {
        const [numerator, denominator] = token.split('/').map(Number)
        return {
            value: (numerator / denominator) * 100,
            unit: '%',
            type: 'number',
        }
    }

    const matches = token.match(UNIT_REGEX)
    if (matches) {
        let value = parseFloat(matches[1])
        let parsedUnit = matches[3] || ''

        if (!parsedUnit && (defaultUnit === 'rem' || defaultUnit === 'em')) {
            value = value / rootSize
            parsedUnit = defaultUnit
        }

        return {
            value,
            unit: parsedUnit || defaultUnit,
            type: 'number',
        }
    }

    // 無法解析則當作純字串
    return { value: token, type: 'string' }
}
