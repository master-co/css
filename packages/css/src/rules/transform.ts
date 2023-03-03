import { Rule, Config } from '../'

export class Transform extends Rule {
    static override id = 'Transform' as const
    static override matches = '^(?:translate|scale|skew|rotate|perspective|matrix)(?:3d|[XYZ])?\\('
    static override unit = ''
    override parseValue(value: string, { rootSize }: Config): string {
        return value.replace(
            /(translate|scale|skew|rotate|perspective|matrix)(3d|[XYZ])?\((.*?)\)/g,
            (origin, method, type, valueStr: string) => {
                let unit: string
                let last: boolean
                switch (method) {
                    case 'translate':
                        unit = 'rem'
                        break
                    case 'skew':
                        unit = 'deg'
                        break
                    case 'rotate':
                        if (type === '3d') {
                            last = true
                        }
                        unit = 'deg'
                        break
                    default:
                        return origin
                }

                const values = valueStr.split(',')
                return origin.replace(
                    valueStr,
                    values
                        .map((eachValue, i) => {
                            if (!last || values.length - 1 === i) {
                                const isNaN = Number.isNaN(+eachValue)
                                return isNaN
                                    ? eachValue
                                    : ((eachValue as any) / (unit === 'rem' ? rootSize : 1))
                                    + unit
                            } else {
                                return eachValue
                            }
                        })
                        .join(','))
            })
    }
}