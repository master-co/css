import { MasterCSSError } from '@master/css-schema'

/** The mdn-data release the grammar of this binding version was generated from. */
export const MASTER_CSS_GRAMMAR_DATA = Object.freeze({ name: 'mdn-data', version: '2.37.2' } as const)

export type MasterCSSGrammarStatus = 'valid' | 'invalid' | 'unknown'

/** A declaration of a stylesheet and the status of its value; offsets are UTF-16. */
export interface MasterCSSGrammarDeclaration {
  readonly property: string
  readonly value: string
  readonly atRule?: string
  readonly status: MasterCSSGrammarStatus
  readonly range: { readonly start: number, readonly end: number }
}

/** A grammar error of a stylesheet, named as css-tree names its errors. */
export interface MasterCSSGrammarError {
  readonly name: 'SyntaxError' | 'SyntaxReferenceError' | 'SyntaxMatchError'
  readonly message: string
  readonly property?: string
  readonly atrule?: string
  readonly descriptor?: string
  readonly details?: string
  readonly offset?: number
}

/** The CSS grammar functions a native or Wasm binding exports. */
export interface MasterCSSGrammarProvider {
  cssGrammarVersion(): string
  cssSyntaxStatus(text: string): string
  cssValueStatus(property: string, value: string, atRule?: string): string
  cssRuleDeclarationsJSON(text: string): string
  validateCSSJSON(text: string): string
  parseCSSDeclarationsJSON(text: string): string
}

/** CSS syntax and value-grammar checks: mdn-data matched by the Rust core. */
export interface MasterCSSGrammar {
  readonly binding: 'native' | 'wasm'
  /** The mdn-data release the grammar was generated from. */
  readonly version: string
  syntaxStatus(text: string): MasterCSSGrammarStatus
  valueStatus(property: string, value: string, atRule?: string): MasterCSSGrammarStatus
  ruleDeclarations(text: string): MasterCSSGrammarDeclaration[]
  validateCSS(text: string): MasterCSSGrammarError[]
  /** The declarations as written, by property; `!important` stays in the value. */
  parseDeclarations(text: string): Record<string, string>
}

const registryKey = Symbol.for('@master/css-binding/css-grammar')
type Registry = { [registryKey]?: MasterCSSGrammar }

function bindGrammar(binding: MasterCSSGrammar['binding'], provider: MasterCSSGrammarProvider): MasterCSSGrammar {
  return Object.freeze({
    binding,
    version: provider.cssGrammarVersion(),
    syntaxStatus: (text) => provider.cssSyntaxStatus(text) as MasterCSSGrammarStatus,
    valueStatus: (property, value, atRule) =>
      provider.cssValueStatus(property, value, atRule) as MasterCSSGrammarStatus,
    ruleDeclarations: (text) => JSON.parse(provider.cssRuleDeclarationsJSON(text)),
    validateCSS: (text) => JSON.parse(provider.validateCSSJSON(text)),
    parseDeclarations: (text) =>
      Object.fromEntries(JSON.parse(provider.parseCSSDeclarationsJSON(text)) as [string, string][])
  } satisfies MasterCSSGrammar)
}

/**
 * Makes the grammar of an initialized binding available synchronously. The first
 * registration wins: every binding carries the same grammar.
 */
export function registerCSSGrammar(binding: MasterCSSGrammar['binding'], provider: MasterCSSGrammarProvider | undefined) {
  const registry = globalThis as Registry
  if (!registry[registryKey] && provider) registry[registryKey] = bindGrammar(binding, provider)
}

export function registeredCSSGrammar(): MasterCSSGrammar | undefined {
  return (globalThis as Registry)[registryKey]
}

export function cssGrammarUnavailable(): MasterCSSError {
  return new MasterCSSError({
    code: 'NATIVE_UNAVAILABLE',
    domain: 'binding',
    message: 'CSS grammar checks need a Master CSS binding. Create a compiler or tooling binding before checking CSS.'
  })
}
