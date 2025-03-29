import { AT_COMPARABLE_FEATURES, AT_COMPARISON_OPERATORS, AT_IDENTIFIERS, AT_LOGICAL_OPERATORS } from '../common'
import MasterCSS from '../core'
import { AtIdentifier } from '../types/config'
import { AtComponent, AtGroupComponent, AtRule, AtStringComponent, AtValueComponent } from '../types/syntax'
import parsePairs from './parse-pairs'
import parseValue from './parse-value'
import replaceCharOutsideQuotes from './replace-char-outside-quotes'
import splitCharOutsideQuotes from './split-char-outside-quotes'

export default function parseAt(token: string, css = new MasterCSS()) {
    let id: AtIdentifier | undefined
    let firstToken: string | undefined
    const resolve = (eachToken: string) => {
        const regex = /([a-zA-Z0-9-:%|]+|[&|!|,|>|<|=][=]?)/g
        const eachTokens = [...eachToken.matchAll(regex)].map(match => match[0])
        let comps: AtComponent[] = []
        const addComp = (comp: AtComponent) => {
            if (comp.type === 'number') {
                if (AT_COMPARABLE_FEATURES.includes(comp.name) || !comp.name) {
                    if (!comp.name) comp.name = 'width'
                    const prev = comps[comps.length - 1]
                    if (prev && prev.type === 'comparison') {
                        comp.operator = prev.value
                        comp.token = prev.value + comp.token
                        comps.pop()
                    } else if (!comp.operator) {
                        comp.operator = '>='
                    }
                }
            }
            comps.push(comp)
        }
        eachTokens
            .forEach((eachToken) => {
                if (AT_COMPARABLE_FEATURES.includes(eachToken)) {
                    return
                } else if (AT_COMPARISON_OPERATORS.includes(eachToken)) {
                    comps.push({ type: 'comparison', token: eachToken, value: eachToken })
                    // if (!id) id = 'media'
                    return
                } else if (eachToken in AT_LOGICAL_OPERATORS) {
                    comps.push({ type: 'logical', token: eachToken, value: AT_LOGICAL_OPERATORS[eachToken as keyof typeof AT_LOGICAL_OPERATORS] })
                    return
                }
                const definedParsedAtRule = css.at.get(eachToken)
                if (!id && !firstToken) {
                    firstToken = eachToken
                    if (AT_IDENTIFIERS.includes(firstToken)) {
                        id = firstToken as AtIdentifier
                        return
                    } else if (definedParsedAtRule) {
                        id = definedParsedAtRule.id
                    } else if (firstToken.charAt(0).match(/[a-zA-Z-]/)) {
                        id = 'container'
                    } else {
                        id = 'media'
                    }
                }
                let atComponent = {
                    token: eachToken,
                    type: 'string'
                } as AtValueComponent
                if (definedParsedAtRule) {
                    definedParsedAtRule.components.forEach((eachComp) => {
                        const comp = { ...eachComp, token: eachToken }
                        addComp(comp)
                    })
                    return
                } else {
                    const [splitedNameOrValue, splitedValue] = splitCharOutsideQuotes(eachToken, ':')
                    if (splitedValue) {
                        atComponent.name = splitedNameOrValue
                        atComponent.value = splitedValue
                    } else {
                        atComponent.value = splitedNameOrValue
                    }
                    if (id === 'container' || id === 'media') {
                        const { token, ...comp } = parseValue(atComponent.value, 'rem', css.config.rootSize)
                        Object.assign(atComponent, comp)
                    }
                    addComp(atComponent)
                }
            })

        return comps
    }

    const pair = (eachToken: string) => {
        const pairedAtComponents: AtComponent[] = []
        const paired = parsePairs(eachToken)
        if (paired) {
            if (paired.pre) {
                pairedAtComponents.push(...pair(paired.pre))
            }
            if (paired.body) {
                if (id === 'supports') {
                    pairedAtComponents.push({
                        type: 'group',
                        children: [{
                            type: 'string',
                            value: replaceCharOutsideQuotes(paired.body, '|', ' '),
                        } as AtStringComponent]
                    })
                } else {
                    const children = pair(paired.body)
                    if (children.length > 1) {
                        pairedAtComponents.push({
                            type: 'group', children: pair(paired.body)
                        } as unknown as AtGroupComponent)
                    } else {
                        pairedAtComponents.push(...children)
                    }
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
    return {
        components: pair(token),
        id // should be assigned to here
    } as AtRule
}