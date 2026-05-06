import type { PropertiesHyphen } from 'csstype'
import type { Variable } from '../types/syntax'

const CSS_VARIABLE_REFERENCE = /var\(\s*--([_a-zA-Z0-9-]+)\b/g

export default function collectVariableNames(declarations: PropertiesHyphen, variables: Map<string, Variable>) {
    const variableNames = new Set<string>()
    for (const propertyName in declarations) {
        const propertyValue = declarations[propertyName as keyof PropertiesHyphen]
        if (!propertyValue) continue
        for (const match of String(propertyValue).matchAll(CSS_VARIABLE_REFERENCE)) {
            if (variables.has(match[1])) {
                variableNames.add(match[1])
            }
        }
    }
    return variableNames.size ? variableNames : undefined
}
