import { cssSyntaxStatus, CSS_SYNTAX_CHECK } from './syntax-validation'
import { definitionSyntax, generate, lexer, parse, property as propertyName, walk, version as cssTreeVersion } from 'css-tree'
import type { MasterCSSDiagnostic, MasterCSSValueStatus } from '@master/css-binding/tooling'

export interface DeclarationValidation {
  readonly property: string
  readonly value: string
  readonly atRule?: string
  readonly status: MasterCSSValueStatus
  readonly range?: { readonly start: number, readonly end: number }
}

export const CSS_VALUE_CHECK = Object.freeze({ name: 'css-tree', version: cssTreeVersion, phase: 'css-value' as const, scope: 'expanded-declarations' as const })

const units = new Set(Object.values((lexer as typeof lexer & { units: Record<string, string[]> }).units).flat().map((unit) => unit.toLowerCase()))
const cache = new Map<string, MasterCSSValueStatus>()
let knownKeywords: Set<string> | undefined
function isKnownKeyword(name: string) {
  if (!knownKeywords) {
    knownKeywords = new Set<string>()
    const grammar = lexer.dump() as { properties: Record<string, unknown>, types: Record<string, unknown> }
    for (const syntax of [...Object.values(grammar.properties), ...Object.values(grammar.types)]) {
      if (typeof syntax !== 'string') continue
      definitionSyntax.walk(definitionSyntax.parse(syntax), node => {
        if (node.type === 'Keyword') knownKeywords!.add(node.name.toLowerCase())
      })
    }
  }
  return knownKeywords.has(name.toLowerCase())
}

/** Grammar knowledge is a report, never permission to generate a declaration. */
export function cssValueStatus(property: string, value: string): MasterCSSValueStatus {
  return validateValue(property, value)
}

function validateValue(property: string, value: string, atRule?: string): MasterCSSValueStatus {
  const key = `${atRule ?? ''}\0${property}\0${value}`
  const cached = cache.get(key)
  if (cached) return cached
  if (propertyName(property).custom) return 'unknown'
  let status: MasterCSSValueStatus
  try {
    const ast = parse(value, { context: 'value' })
    let dependent = propertyName(property).custom
    const descriptor = atRule ? lexer.getAtrule(atRule)?.descriptors?.[property] : undefined
    // @page and its margin boxes also accept ordinary page properties.
    const pageContext = atRule === 'page' || /^(?:top|bottom)-(?:left|center|right)(?:-corner)?$|^(?:left|right)-(?:top|middle|bottom)$/.test(atRule ?? '')
    const useDescriptor = Boolean(atRule && (descriptor || !pageContext))
    let unresolved = dependent || (useDescriptor ? !descriptor : !lexer.getProperty(property))
    let invalidRepeat = false
    walk(ast, (node) => {
      if (node.type === 'Function') {
        const name = node.name.toLowerCase()
        if (['var', 'env', 'attr'].includes(name)) dependent = true
        if (dependent || !lexer.getType(`${name}()`)) unresolved = true
        if (name === 'repeat' && /^grid-template-(?:columns|rows)$/.test(property)) {
          const count = node.children.first
          if (count?.type === 'Number') {
            invalidRepeat ||= !Number.isInteger(Number(count.value)) || Number(count.value) <= 0
          } else if (count?.type === 'Identifier') {
            invalidRepeat ||= !['auto-fill', 'auto-fit'].includes(count.name)
          }
        }
      } else if (node.type === 'Identifier' && !isKnownKeyword(node.name)) {
        unresolved = true
      } else if (node.type === 'Dimension' && !units.has(node.unit.toLowerCase())) {
        unresolved = true
      }
    })
    const knownMatch = !(useDescriptor
      ? lexer.matchAtruleDescriptor(atRule!, property, ast)
      : lexer.matchProperty(property, ast)).error
    status = invalidRepeat ? 'invalid' : dependent ? 'unknown' : knownMatch ? 'valid' : unresolved ? 'unknown' : 'invalid'
  } catch {
    status = 'invalid'
  }
  if (cache.size >= 4096) cache.delete(cache.keys().next().value!)
  cache.set(key, status)
  return status
}

export function validateRuleDeclarations(text: string): DeclarationValidation[] {
  const declarations: DeclarationValidation[] = []
  let ast
  try { ast = parse(text, { positions: true, parseAtrulePrelude: false, parseRulePrelude: false, parseCustomProperty: false }) }
  catch { return declarations }
  walk(ast, {
    visit: 'Declaration',
    enter(node) {
      const value = generate(node.value)
      const atRule = this.atrule && !this.rule ? this.atrule.name.toLowerCase() : undefined
      declarations.push({ property: node.property, value, ...(atRule ? { atRule } : {}), status: validateValue(node.property, value, atRule), ...(node.loc ? { range: { start: node.loc.start.offset, end: node.loc.end.offset } } : {}) })
    }
  })
  return declarations
}

export function withCSSValueValidation<T extends {
  readonly cssSyntaxStatus?: import('@master/css-binding/tooling').MasterCSSSyntaxStatus
  readonly className: string
  readonly rules: readonly { readonly text: string }[]
  readonly diagnostics?: readonly MasterCSSDiagnostic[]
}>(result: T) {
  const declarations = result.rules.flatMap((rule) => validateRuleDeclarations(rule.text))
  const diagnostics = [...(result.diagnostics || [])]
  for (const declaration of declarations) {
    if (declaration.status !== 'invalid' && declaration.status !== 'unknown') continue
    diagnostics.push({
      code: declaration.status === 'invalid' ? 'CSS_VALUE_INVALID' : 'CSS_VALUE_UNKNOWN',
      phase: 'css-value',
      severity: declaration.status === 'invalid' ? 'error' : 'info',
      message: declaration.status === 'invalid'
        ? `Invalid CSS value: ${declaration.property}:${declaration.value}`
        : `CSS value cannot be fully checked: ${declaration.property}:${declaration.value}`,
      range: { start: 0, end: result.className.length },
      notes: []
    })
  }
  const cssValueStatus: MasterCSSValueStatus = declarations.some((d) => d.status === 'invalid') ? 'invalid'
    : declarations.some((d) => d.status === 'unknown') ? 'unknown'
      : declarations.length ? 'valid' : 'not-checked'
  const syntax = result.rules.map(rule => cssSyntaxStatus(rule.text))
  const syntaxStatus: import('@master/css-binding/tooling').MasterCSSSyntaxStatus = result.cssSyntaxStatus === 'invalid' || syntax.includes('invalid') ? 'invalid'
    : syntax.includes('unknown') ? 'unknown' : syntax.length ? 'valid' : result.cssSyntaxStatus ?? 'not-checked'
  if (syntax.includes('invalid')) diagnostics.push({ code: 'CSS_PARSE_ERROR', phase: 'css-syntax', severity: 'error', message: 'Invalid CSS token structure in expanded declarations, selectors or queries', range: { start: 0, end: result.className.length }, notes: [] })
  const checks = [...(syntax.length ? [CSS_SYNTAX_CHECK] : []), ...(declarations.length ? [CSS_VALUE_CHECK] : [])]
  return { ...result, cssSyntaxStatus: syntaxStatus, cssValueStatus, browserSupport: 'not-checked' as const, checks, declarations, diagnostics }
}
