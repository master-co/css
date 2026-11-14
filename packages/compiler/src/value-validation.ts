import { validateRuleDeclarations, CSS_VALUE_CHECK, cssSyntaxStatus, CSS_SYNTAX_CHECK } from '@master/css-tooling/validator'
import { MASTER_CSS_DIAGNOSTIC_VERSION, MasterCSSError, type MasterCSSDiagnostic } from '@master/css-schema'
import type { MasterCSSCompileOptions } from './index'
import type { CSSOutputMapping } from '@master/css-schema/css-directives'

type OffsetRange = { readonly start: number, readonly end: number }
type Origin = Pick<MasterCSSDiagnostic, 'source' | 'range'>
export interface ValidationSource {
  readonly css: string
  readonly source?: string
  readonly mappings?: readonly CSSOutputMapping[]
  readonly sources?: Readonly<Record<string, string>>
  readonly locate?: (range: OffsetRange) => Origin | undefined
}
function position(text: string, offset: number) {
  const lines = text.slice(0, offset).split(/\r\n?|\n/)
  return { line: lines.length - 1, character: lines[lines.length - 1].length }
}
function origin(input: ValidationSource, range: OffsetRange): Origin | undefined {
  if (input.locate) return input.locate(range)
  const mapping = input.mappings?.findLast(item => item.generatedStart <= range.start && (item.generatedEnd === undefined || range.start < item.generatedEnd))
  if (!mapping) return
  const source = mapping.source.file ?? input.source
  const text = source ? input.sources?.[source] : undefined
  const reference = mapping.source
  if (text !== undefined) {
    const unchanged = mapping.generatedEnd !== undefined && text.slice(reference.range.start, reference.range.end) === input.css.slice(mapping.generatedStart, mapping.generatedEnd)
    const start = unchanged ? reference.range.start + range.start - mapping.generatedStart : reference.range.start
    const end = unchanged ? Math.min(reference.range.end, reference.range.start + range.end - mapping.generatedStart) : reference.range.end
    return { source, range: { start: position(text, start), end: position(text, end) } }
  }
  return { source, ...(reference.loc ? { range: {
    start: { line: reference.loc.start.line - 1, character: reference.loc.start.column - 1 },
    end: { line: reference.loc.end.line - 1, character: reference.loc.end.column - 1 }
  } } : {}) }
}

export function assertValidationOptions(options: object) {
  if ('validation' in options && options.validation !== undefined && options.validation !== 'report' && options.validation !== 'error') {
    throw new MasterCSSError({ code: 'INVALID_INPUT', domain: 'compiler', message: "validation must be 'report' or 'error'." })
  }
}

const VALIDATION_CACHE_CAPACITY = 256
const validations = new Map<string, { readonly invalidSyntax: boolean, readonly declarations: readonly ReturnType<typeof validateRuleDeclarations>[number][] }>()

/**
 * The checks of one CSS text, which depend on nothing else. Hosts compile each
 * stylesheet once per build environment and emit the same CSS each time.
 */
function checkCSS(css: string) {
  let checked = validations.get(css)
  if (checked) {
    validations.delete(css)
  } else {
    checked = Object.freeze({
      invalidSyntax: cssSyntaxStatus(css) === 'invalid',
      declarations: Object.freeze(validateRuleDeclarations(css).filter(declaration => declaration.status === 'invalid' || declaration.status === 'unknown'))
    })
    if (validations.size >= VALIDATION_CACHE_CAPACITY) validations.delete(validations.keys().next().value!)
  }
  validations.set(css, checked)
  return checked
}

/**
 * Freezes `result` with its `diagnostics`. Without a diagnostic callback or
 * strict validation nothing observes them as they are produced, so they are
 * computed on first read: hosts that never read them, such as build plugins
 * transforming each stylesheet, skip validating the output.
 */
export function withDiagnostics<T extends object>(
  result: () => T,
  diagnostics: () => readonly MasterCSSDiagnostic[],
  options: Pick<MasterCSSCompileOptions, 'validation' | 'onDiagnostic'> = {}
): Readonly<T & { readonly diagnostics: readonly MasterCSSDiagnostic[] }> {
  if (options.onDiagnostic || options.validation === 'error') {
    // Validation reports before the rest of the result, as it always has.
    const reported = diagnostics()
    return Object.freeze({ ...result(), diagnostics: reported })
  }
  let computed: readonly MasterCSSDiagnostic[] | undefined
  return Object.freeze(Object.defineProperty({ ...result() }, 'diagnostics', {
    enumerable: true,
    get: () => computed ??= diagnostics()
  }) as T & { readonly diagnostics: readonly MasterCSSDiagnostic[] })
}

/** Validate the complete emission before a host can publish any of its assets. */
export function validateCompiledCSS(
  sources: readonly ValidationSource[],
  options: Pick<MasterCSSCompileOptions, 'validation' | 'onDiagnostic'> = {}
): readonly MasterCSSDiagnostic[] {
  assertValidationOptions(options)
  const diagnostics: MasterCSSDiagnostic[] = []
  for (const input of sources) {
    const { css, source } = input
    const checked = checkCSS(css)
    if (checked.invalidSyntax) {
      const diagnostic: MasterCSSDiagnostic = Object.freeze({ version: MASTER_CSS_DIAGNOSTIC_VERSION, code: 'CSS_PARSE_ERROR', domain: 'compiler', phase: 'css-syntax', severity: 'error', message: 'Invalid CSS token structure in compiled output', source: source ? `${source}#generated` : '<generated-css>', notes: [`Checked with ${CSS_SYNTAX_CHECK.name} ${CSS_SYNTAX_CHECK.version}; no authored source offset is available.`] })
      diagnostics.push(diagnostic)
      options.onDiagnostic?.(diagnostic)
    }
    for (const declaration of checked.declarations) {
      const authored = declaration.range ? origin(input, declaration.range) : undefined
      const diagnostic: MasterCSSDiagnostic = Object.freeze({
        version: MASTER_CSS_DIAGNOSTIC_VERSION,
        code: declaration.status === 'invalid' ? 'CSS_VALUE_INVALID' : 'CSS_VALUE_UNKNOWN',
        domain: 'compiler', phase: 'css-value',
        severity: declaration.status === 'invalid' ? 'error' : 'information',
        message: `${declaration.status === 'invalid' ? 'Invalid' : 'Unverified'} CSS value: ${declaration.property}:${declaration.value}`,
        ...(authored ?? { source: source ? `${source}#generated` : '<generated-css>' }),
        notes: [`Checked generated CSS with ${CSS_VALUE_CHECK.name} ${CSS_VALUE_CHECK.version}; browser support and computed values were not checked.`]
      })
      diagnostics.push(diagnostic)
      options.onDiagnostic?.(diagnostic)
    }
  }
  if (options.validation === 'error' && diagnostics.some(diagnostic => diagnostic.severity === 'error')) {
    throw new MasterCSSError({
      code: 'CSS_VALUE_INVALID', domain: 'compiler',
      message: 'Strict CSS validation failed. No compilation result was published.',
      diagnostics
    })
  }
  return Object.freeze(diagnostics)
}
