export function analyzeUnitValue(token: string, rootSize: number, defaultUnit: string): { value: string, unit: string } {
    if (defaultUnit) {
        let unit = ''

        const matches = token.match(/^([+-.]?\d+(\.?\d+)?)(.*)?/)
        // ['0.5deg', '0.5', 'deg', index: 0, input: '0.5deg', groups: undefined]
        if (matches) {
            if (token.includes('/')) {
                // w:1/2 -> width: 50%
                const [dividend, divisor] = token.split('/')
                return { value: (+dividend / +divisor) * 100 + '%', unit }
            } else {
                let value: any = +matches[1]
                unit = matches[3] || ''
                /**
                 * 當無單位值且 defaultUnit === 'rem'，
                 * 將 pxValue / 16 轉為 remValue
                 */
                if (!unit) {
                    if (defaultUnit === 'rem' || defaultUnit === 'em') {
                        value = value / rootSize
                    }
                    unit = defaultUnit || ''
                }
                return { value, unit }
            }
        }
    }
}