import type { PropertiesHyphen } from 'csstype'
import type { Variable } from '@master/css-schema/css-syntax'
import { collectCSSVariableReferences } from '@master/css-lexer'

export default function collectVariableNames(declarations: PropertiesHyphen, variables: Map<string, Variable>) {
  const variableNames = new Set<string>()
  for (const propertyName in declarations) {
    const propertyValue = declarations[propertyName as keyof PropertiesHyphen]
    if (!propertyValue) continue
    for (const name of collectCSSVariableReferences(String(propertyValue))) {
      const variable = variables.get(name)
      if (variable && !variable.inline) {
        variableNames.add(name)
      }
    }
  }
  return variableNames.size ? variableNames : undefined
}
