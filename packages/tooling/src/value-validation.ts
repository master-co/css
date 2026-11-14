import { cssSyntaxStatus, CSS_SYNTAX_CHECK } from './syntax-validation'
import { cssGrammar, MASTER_CSS_GRAMMAR_DATA } from '@master/css-binding/css-grammar'
import type { MasterCSSDiagnostic, MasterCSSValueStatus } from '@master/css-binding/tooling'

export interface DeclarationValidation {
  readonly property: string
  readonly value: string
  readonly atRule?: string
  readonly status: MasterCSSValueStatus
  readonly range?: { readonly start: number, readonly end: number }
}

export const CSS_VALUE_CHECK = Object.freeze({ ...MASTER_CSS_GRAMMAR_DATA, phase: 'css-value' as const, scope: 'expanded-declarations-and-known-math-grammar-and-static-types-v1' as const })

/** Grammar knowledge is a report, never permission to generate a declaration. */
export function cssValueStatus(property: string, value: string): MasterCSSValueStatus {
  return cssGrammar().valueStatus(property, value)
}

/** Every declaration of a stylesheet with the status of its value; ranges are UTF-16 offsets. */
export function validateRuleDeclarations(text: string): DeclarationValidation[] {
  return cssGrammar().ruleDeclarations(text)
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
