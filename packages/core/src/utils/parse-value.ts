import { UNIT_REGEX } from '../common'
import { NumberValueComponent, StringValueComponent } from '../types/syntax'

export default function parseValue(
    token: string | number,
    unit = '',
    rootSize = 1
) {
    const isNumber = typeof token === 'number'
    const defaultUnit = unit

    // 如果是純數字
    if (isNumber) {
        return {
            unit: defaultUnit,
            type: 'number',
            value: defaultUnit === 'rem' || defaultUnit === 'em'
                ? token / rootSize
                : token
        } as NumberValueComponent
    }

    const matches = token.match(UNIT_REGEX)
    if (matches) {
        let value = parseFloat(matches[1])
        let parsedUnit = matches[2] || ''

        if (!parsedUnit && (defaultUnit === 'rem' || defaultUnit === 'em')) {
            value = value / rootSize
            parsedUnit = defaultUnit
        }

        return {
            token,
            value,
            unit: parsedUnit || defaultUnit,
            type: 'number',
        } as NumberValueComponent
    }

    // 無法解析則當作純字串
    return { token, value: token, type: 'string' } as StringValueComponent
}
