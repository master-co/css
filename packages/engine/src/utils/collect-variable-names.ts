import type { PropertiesHyphen } from 'csstype'
import type { Variable } from '@master/css-schema/css-syntax'
import { CSS_VARIABLE_REFERENCE } from './css-variables'

export default function collectVariableNames(declarations: PropertiesHyphen, variables: Map<string, Variable>) {
  const variableNames = new Set<string>()
  for (const propertyName in declarations) {
    const propertyValue = declarations[propertyName as keyof PropertiesHyphen]
    if (!propertyValue) continue
    for (const match of String(propertyValue).matchAll(CSS_VARIABLE_REFERENCE)) {
      const variable = variables.get(match[1])
      if (variable && !variable.inline) {
        variableNames.add(match[1])
      }
    }
  }
  return variableNames.size ? variableNames : undefined
}
