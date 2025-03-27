import { AT_OPERATORS, COMPARISION_OPERATORS } from '../common'
import MasterCSS from '../core'
import { AtDefinition, AtType } from '../types/config'
import { AtComponent, AtDescriptorComponent, AtGroupComponent } from '../types/syntax'
import parsePairs from './parse-pairs'
import parseValue from './parse-value'
import replaceCharOutsideQuotes from './replace-char-outside-quotes'
import splitCharOutsideQuotes from './split-char-outside-quotes'

export default function parseAt(token: string, css = new MasterCSS()) {
    const matches = /^(media|supports|container|layer)/.exec(token)
    let type: AtType | undefined = matches?.[0] as AtType
    token = type ? token.slice(type.length) : token
    let firstToken: string
    const resolve = (eachToken: string) => {
        const regex = /([a-zA-Z0-9-:%|]+|[&|!|,|>|<|=][=]?)/g
        const eachTokens = [...eachToken.matchAll(regex)].map(match => match[0])
        const eachAtComponents: AtComponent[] = []
        eachTokens.forEach((eachToken, i) => {
            let operatorValue = AT_OPERATORS[eachToken as keyof typeof AT_OPERATORS]
            let atComponent: AtComponent
            /**
             * If the type is not defined, try to get it from the first token
             */
            if (!type && !firstToken) {
                firstToken = eachToken
                const firstDefintion = css.at.get(firstToken)
                type = firstDefintion?.type || 'media'
            }
            if (operatorValue) {
                atComponent = { type: 'operator', token: eachToken, value: operatorValue }
            } else {
                atComponent = { token: eachToken } as AtDescriptorComponent
                let defintion: AtDefinition | undefined
                let name: string | undefined
                let value: string | number
                let operator: string | undefined
                defintion = css.at.get(eachToken)
                if (defintion) {
                    name = defintion.name
                    value = defintion.value
                } else {
                    const [splitedNameOrValue, splitedValue] = splitCharOutsideQuotes(eachToken, ':')
                    if (splitedValue) {
                        name = splitedNameOrValue
                        value = splitedValue
                    } else {
                        value = splitedNameOrValue
                    }
                    value = replaceCharOutsideQuotes(value, '|', ' ')
                }
                if (type === 'media' || type === 'container') {
                    const parsed = parseValue(value, 'rem', css.config.rootSize)
                    if (parsed.type === 'number') {
                        const prevAtComponent = eachAtComponents[eachAtComponents.length - 1] as AtComponent | undefined
                        operator = '>='
                        if (prevAtComponent?.type === 'operator') {
                            if (COMPARISION_OPERATORS.includes(prevAtComponent.value)) {
                                operator = prevAtComponent.value
                                eachAtComponents.splice(i - 1, 1)
                            }
                        }
                        switch (operator) {
                            case '>=':
                                name = 'min-width'
                                break
                            case '<=':
                                name = 'max-width'
                                break
                            case '>':
                                name = 'min-width'
                                break
                            case '<':
                                name = 'max-width'
                                break
                            case '=':
                                name = 'width'
                                break
                        }
                        atComponent.unit = parsed.unit
                    }
                    atComponent.value = parsed.value
                    if (name) atComponent.name = name
                    if (operator) atComponent.operator = operator
                } else {
                    atComponent.value = value
                    if (name) atComponent.name = name
                }
            }
            eachAtComponents.push(atComponent)
        })
        return eachAtComponents
    }
    const pair = (eachToken: string) => {
        const pairedAtComponents: AtComponent[] = []
        const paired = parsePairs(eachToken)
        if (paired) {
            if (paired.pre) {
                pairedAtComponents.push(...pair(paired.pre))
            }
            if (paired.body) {
                const children = pair(paired.body)
                if (children.length > 1) {
                    pairedAtComponents.push({
                        type: 'group', children: pair(paired.body)
                    } as unknown as AtGroupComponent)
                } else {
                    pairedAtComponents.push(...children)
                }
            }
            if (paired.post) {
                pairedAtComponents.push(...pair(paired.post))
            }
        } else {
            pairedAtComponents.push(...resolve(eachToken))
        }
        return pairedAtComponents
    }
    const atComponents = pair(token)
    return {
        type,
        atComponents
    }
}