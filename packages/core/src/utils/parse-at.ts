import { AT_OPERATORS, COMPARISION_OPERATORS } from '../common'
import MasterCSS from '../core'
import { AtDefinitionType } from '../types/config'
import { AtComponent, AtFeatureComponent, AtGroupComponent } from '../types/syntax'
import parsePairs from './parse-pairs'

export default function parseAt(token: string, css = new MasterCSS()) {
    const matches = /^(media|supports|container|layer)/.exec(token)
    let type: AtDefinitionType | undefined = matches?.[0] as AtDefinitionType
    token = type ? token.slice(type.length) : token
    const resolve = (eachToken: string) => {
        const regex = /([a-zA-Z0-9-:]+|[&|!|,|>|<|=][=]?)/g
        const eachTokens = [...eachToken.matchAll(regex)].map(match => match[0])
        const eachAtComponents: AtComponent[] = []
        eachTokens.forEach((eachToken, i) => {
            const value = AT_OPERATORS[eachToken as keyof typeof AT_OPERATORS]
            let atComponent: AtComponent
            if (value) {
                atComponent = { type: 'operator', token: eachToken, value }
            } else {
                const defintion = css.at.get(eachToken || '')
                atComponent = defintion
                    ? { token: eachToken, value: defintion.value }
                    : { token: eachToken, value: eachToken }
                const atFeatureComponent = atComponent as unknown as AtFeatureComponent
                // resolve screen sizes
                if (!atFeatureComponent.type && typeof atFeatureComponent.value === 'number') {
                    const prevAtComponent = eachAtComponents[eachAtComponents.length - 1] as AtComponent | undefined
                    let operator = '>='
                    if (prevAtComponent?.type === 'operator') {
                        if (COMPARISION_OPERATORS.includes(prevAtComponent.value)) {
                            operator = prevAtComponent.value
                            eachAtComponents.splice(i - 1, 1)
                        }
                    }
                    switch (operator) {
                        case '>=':
                            atFeatureComponent.name = 'min-width'
                            break
                        case '<=':
                            atFeatureComponent.name = 'max-width'
                            break
                        case '>':
                            atFeatureComponent.name = 'min-width'
                            atFeatureComponent.value += .02
                            break
                        case '<':
                            atFeatureComponent.name = 'max-width'
                            atFeatureComponent.value -= .02
                            break
                        case '=':
                            atFeatureComponent.name = 'width'
                            break
                    }
                }
            }
            eachAtComponents.push(atComponent)
        })
        return eachAtComponents
    }
    const pair = (eachToken: string) => {
        const pairedAtComponents: AtComponent[] = []
        const pairs = parsePairs(eachToken)
        if (pairs) {
            if (pairs.pre) pairedAtComponents.push(...resolve(pairs.pre))
            if (pairs.body) {
                pairedAtComponents.push({
                    type: 'group', children: pair(pairs.body)
                } as unknown as AtGroupComponent)
            }
            if (pairs.post) pairedAtComponents.push(...resolve(pairs.post))
        } else {
            pairedAtComponents.push(...resolve(eachToken))
        }
        return pairedAtComponents
    }
    const atComponents = pair(token)
    /**
     * If the type is not defined, try to get it from the first token
     */
    if (!type) {
        const firstAtComponent = atComponents[0]
        if (firstAtComponent.token) {
            const atDefinition = css.at.get(firstAtComponent.token)
            if (atDefinition) {
                type = atDefinition.type
            }
        }
    }
    return {
        type: type || 'media',
        atComponents
    }
}