import type { NativeCSSDeclarationMatcher } from '@master/css'
import { lexer, parse, property as propertyName } from 'css-tree'
import { isTargetError } from './validate-css'

const matches = new Map<string, boolean>()

export const cssTreeNativeDeclarationMatcher: NativeCSSDeclarationMatcher = ({ property, value }) => {
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
