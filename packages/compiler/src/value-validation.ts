import { validateRuleDeclarations, CSS_VALUE_CHECK } from '@master/css-tooling/validator'
import { MASTER_CSS_DIAGNOSTIC_VERSION, MasterCSSError, type MasterCSSDiagnostic } from '@master/css-schema'
import type { MasterCSSCompileOptions } from './index'

/** Validate the complete emission before a host can publish any of its assets. */
export function validateCompiledCSS(
  sources: readonly { readonly css: string, readonly source?: string }[],
  options: Pick<MasterCSSCompileOptions, 'cssValuePolicy' | 'onDiagnostic'> = {}
): readonly MasterCSSDiagnostic[] {
  const diagnostics: MasterCSSDiagnostic[] = []
  for (const { css, source } of sources) {
    const position = (offset: number) => {
      const lines = css.slice(0, offset).split('\n')
      return { line: lines.length - 1, character: lines[lines.length - 1].length }
    }
    for (const declaration of validateRuleDeclarations(css)) {
      if (declaration.status !== 'invalid' && declaration.status !== 'unknown') continue
      const diagnostic: MasterCSSDiagnostic = Object.freeze({
        version: MASTER_CSS_DIAGNOSTIC_VERSION,
        code: declaration.status === 'invalid' ? 'CSS_VALUE_INVALID' : 'CSS_VALUE_UNKNOWN',
        domain: 'compiler', phase: 'css-value',
        severity: declaration.status === 'invalid' ? 'error' : 'information',
        message: `${declaration.status === 'invalid' ? 'Invalid' : 'Unverified'} CSS value: ${declaration.property}:${declaration.value}`,
        source: source ? `${source}#generated` : '<generated-css>',
        ...(declaration.range ? { range: { start: position(declaration.range.start), end: position(declaration.range.end) } } : {}),
        notes: [`Checked generated CSS with ${CSS_VALUE_CHECK.name} ${CSS_VALUE_CHECK.version}; browser support and computed values were not checked.`]
      })
      diagnostics.push(diagnostic)
      options.onDiagnostic?.(diagnostic)
    }
  }
  if (options.cssValuePolicy === 'error' && diagnostics.some(diagnostic => diagnostic.severity === 'error')) {
    throw new MasterCSSError({
      code: 'CSS_VALUE_INVALID', domain: 'compiler',
      message: 'Strict CSS validation failed. No compilation result was published.',
      diagnostics
    })
  }
  return Object.freeze(diagnostics)
}
