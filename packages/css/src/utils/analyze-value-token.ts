import { START_SYMBOL } from '../constants/start-symbol'

const selectorSymbols = ['!', '*', '>', '+', '~', ':', '[', '@', '_']

export function analyzeValueToken(
    valueToken: string, 
    values: Record<string, string | number>,
    globalValues: Record<string, string | number>,
    extraSplitSymbols: string[] = []
): [Array<string | { value: string }>, string] {
    
    const splitSymbols = [',', ...extraSplitSymbols]
    const valueTokens = []

    let currentValueToken = ''
    let i = 0;
    (function analyze(valueToken, end?, depth?, func = '') {
        let varIndex: number
        let isString = false
        if (end) {
            if (end === ')' && currentValueToken.slice(-1) === '$') {
                varIndex = currentValueToken.length - 1
            } else if (end === '\'') {
                isString = true
            }

            currentValueToken += valueToken[i++]
        }

        const transformAndPushValueToken = () => {
            const value = currentValueToken
            currentValueToken = ''

            if (values && value in values) {
                const originalIndex = i
                i = 0
                analyze(values[value].toString())
                i = originalIndex
            } else if (globalValues && value in globalValues) {
                const originalIndex = i
                i = 0
                analyze(globalValues[value].toString())
                i = originalIndex
            } else {
                valueTokens.push({ value })
            }
        }

        for (; i < valueToken.length; i++) {
            const val = valueToken[i]
            if (val === end) {
                currentValueToken += val
                if (isString) {
                    let count = 0
                    for (let j = currentValueToken.length - 2; ; j--) {
                        if (currentValueToken[j] !== '\\') {
                            break
                        }
                        count++
                    }
                    if (count % 2) {
                        continue
                    }
                }

                if (varIndex !== undefined) {
                    currentValueToken = currentValueToken.slice(0, varIndex) + currentValueToken.slice(varIndex).replace(/\$\((.*)\)/, 'var(--$1)')
                }

                if (!depth) {
                    if (isString) {
                        valueTokens.push(currentValueToken)
                    } else {
                        transformAndPushValueToken()
                    }

                    func = ''
                    currentValueToken = ''
                }

                break
            } else if (!isString && val in START_SYMBOL) {
                analyze(valueToken, START_SYMBOL[val], depth === undefined ? 0 : depth + 1, func)
            } else if ((val === '|' || val === ' ') && end !== '}' && (!isString || func === 'path')) {
                if (!end) {
                    transformAndPushValueToken()
                } else {
                    currentValueToken += ' '
                }
            } else {
                if (!end) {
                    if (val === '.') {
                        if (isNaN(+valueToken[i + 1])) {
                            break
                        } else if (valueToken[i - 1] === '-') {
                            currentValueToken += '0'
                        }
                    } else if (splitSymbols.includes(val)) {
                        if (currentValueToken) {
                            transformAndPushValueToken()
                        }
                        valueTokens.push(val)
                        continue
                    } else if (
                        val === '#'
                        && (currentValueToken || valueTokens.length && (valueToken[i - 1] !== '|' || valueTokens[i - 1] !== ' '))
                        || selectorSymbols.includes(val)
                    ) {
                        break
                    }

                    func += val
                }

                currentValueToken += val
            }
        }

        if (depth === undefined && currentValueToken) {
            transformAndPushValueToken()
        }
    })(valueToken)

    return [valueTokens, valueToken.slice(i)]
}