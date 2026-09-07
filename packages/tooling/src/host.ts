import { lexer, parse, property as propertyName } from 'css-tree'
import { isTargetError } from './css'

const matches = new Map<string, boolean>()

export interface MasterCSSNativeDeclarationCandidate {
  readonly property: string
  readonly value: string
}

export const supportsNativeDeclaration = ({ property, value }: MasterCSSNativeDeclarationCandidate) => {
  if (propertyName(property).custom) return true

  const cacheKey = property + '\0' + value
  const cached = matches.get(cacheKey)
  if (cached !== undefined) return cached

  let matched = false
  try {
    const ast = parse(value, {
      context: 'value'
    })
    matched = !isTargetError((lexer as any).checkPropertyName(property))
      && !isTargetError(lexer.matchProperty(property, ast).error)
  } catch {
    matched = false
  }

  matches.set(cacheKey, matched)
  return matched
}
